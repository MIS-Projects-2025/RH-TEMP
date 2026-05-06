<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Carbon\Carbon;
use App\Models\Device;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use App\Services\OmegaIsdService;
use App\Models\ExportJob;
use PhpOffice\PhpSpreadsheet\Chart\{
    Chart,
    DataSeries,
    DataSeriesValues,
    PlotArea,
    Legend,
    Title,
};
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class ProcessRecordingsExport implements ShouldQueue
{
    use Queueable;

    private const LIMITS = [
        'temp' => ['uar' => 26.0, 'lar' => 19.0, 'ucl' => 25.0, 'lcl' => 20.0],
        'rh'   => ['uar' => 62.0, 'lar' => 48.0, 'ucl' => 60.0, 'lcl' => 50.0],
    ];

    public int $timeout = 7200;

    public function __construct(public ExportJob $exportJob) {}

    public function handle(OmegaIsdService $omega): void
    {
        ini_set('memory_limit', '1G');

        $this->exportJob->update(['status' => 'processing', 'progress' => 'Fetching all devices...']);

        $params  = $this->exportJob->params;
        $date    = Carbon::parse($params['date']);
        $period  = (int) $params['period'];
        $devices = Device::all();

        $transferTimeout = match ($period) {
            4 => 180,
            3 => 90,
            2 => 45,
            default => 20,
        };

        $responses = Http::pool(function (Pool $pool) use ($devices, $date, $period, $transferTimeout) {
            foreach ($devices as $device) {
                $pool->as($device->id)
                    ->connectTimeout(15)
                    ->timeout($transferTimeout)
                    ->withHeaders([
                        'Referer' => "http://{$device->ip}/pLoadWbPg?pgNo=30",
                        'Origin'  => "http://{$device->ip}",
                    ])
                    ->asForm()
                    ->post("http://{$device->ip}/downloadRecordData", [
                        'Year'   => $date->year,
                        'Month'  => $date->month,
                        'Day'    => $date->day,
                        'Period' => $period,
                        'none'   => 1,
                    ]);
            }
        });

        $this->exportJob->update(['progress' => 'Building spreadsheet...']);

        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $overview = $spreadsheet->createSheet(0);
        $overview->setTitle('Overview');
        $overview->fromArray([
            ['Report Period:', $this->periodLabel($date, $period)],
            ['Generated At:', now()->format('Y-m-d H:i:s')],
            [],
            ['Location', 'IP Address', 'Status', 'Data Points Found'],
        ], null, 'A1');

        $overview->getColumnDimension('A')->setWidth(30);
        $overview->getColumnDimension('B')->setWidth(18);
        $overview->getColumnDimension('C')->setWidth(14);
        $overview->getColumnDimension('D')->setWidth(18);

        $overviewRow = 5;
        $total       = $devices->count();
        $done        = 0;

        foreach ($devices as $device) {
            $response = $responses[$device->id];
            unset($responses[$device->id]);

            $sheetTitle = substr(
                preg_replace('/[\\\\\/\?\*\[\]\:]/', '-', trim($device->location ?? "Dev-{$device->id}")),
                0,
                31
            );

            $sheet = $spreadsheet->createSheet();
            $sheet->setTitle($sheetTitle);
            $done++;

            if ($response instanceof \Exception || !$response->successful()) {
                $reason = $response instanceof \Exception
                    ? $response->getMessage()
                    : "HTTP {$response->status()}";

                Log::warning("Export: unreachable [{$device->name}] {$device->ip} — {$reason}");
                $sheet->setCellValue('A1', "Device unreachable: {$reason}");
                $this->updateOverviewRow($overview, $overviewRow, $device, 'Unreachable', 0);
                $overviewRow++;
                $this->exportJob->update([
                    'progress' => "Building spreadsheet... ({$done}/{$total} devices) " . now()->format('H:i:s'),
                ]);
                continue;
            }

            $records = $omega->parse($response->body());

            if ($records->isEmpty()) {
                $sheet->setCellValue('A1', 'No data recorded for this period.');
                $this->updateOverviewRow($overview, $overviewRow, $device, 'No Data', 0);
            } else {
                $this->writeDeviceSheet($sheet, $records);
                $this->addChart($sheet, $records->count());
                $this->updateOverviewRow($overview, $overviewRow, $device, 'OK', $records->count());
            }

            $overviewRow++;
            unset($records);

            $this->exportJob->update([
                'progress' => "Building spreadsheet... ({$done}/{$total} devices) " . now()->format('H:i:s'),
            ]);
        }

        $filename = 'report_' . $date->format('Ymd') . '_' . time() . '.xlsx';
        $path     = 'exports/' . $filename;

        $this->exportJob->update(['progress' => 'Saving file... ' . now()->format('H:i:s')]);

        $writer = new Xlsx($spreadsheet);
        $writer->setIncludeCharts(true);
        $writer->save(storage_path('app/' . $path));

        $spreadsheet->disconnectWorksheets();
        unset($spreadsheet);

        $this->exportJob->update([
            'status'       => 'done',
            'file_path'    => $path,
            'completed_at' => now(),
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        $this->exportJob->update([
            'status' => 'failed',
            'error'  => $exception->getMessage(),
        ]);
    }

    private function periodLabel(Carbon $date, int $period): string
    {
        $end = $date->format('Y-m-d');

        return match ($period) {
            1 => $end,
            2 => $date->copy()->subDays(6)->format('Y-m-d')  . ' to ' . $end,
            3 => $date->copy()->subDays(29)->format('Y-m-d') . ' to ' . $end,
            4 => $date->copy()->subDays(364)->format('Y-m-d') . ' to ' . $end,
            default => $end,
        };
    }

    private function writeDeviceSheet(Worksheet $sheet, Collection $records): void
    {
        $sheet->getColumnDimension('A')->setWidth(22);
        $sheet->getColumnDimension('J')->setWidth(22);

        $this->writeMeasurementTable(
            sheet: $sheet,
            records: $records,
            startRow: 1,
            startColIndex: 1,
            headers: ['Date and Time', 'T-UAR', 'T-LAR', 'T-UCL', 'T-LCL', 'Temperature', 'Dev', 'sqrd'],
            limits: self::LIMITS['temp'],
            valueKey: 'temperature',
        );

        $this->writeMeasurementTable(
            sheet: $sheet,
            records: $records,
            startRow: 1,
            startColIndex: 10,
            headers: ['Date and Time', 'RH-UAR', 'RH-LAR', 'RH-UCL', 'RH-LCL', 'Relative Humidity', 'Dev', 'sqrd'],
            limits: self::LIMITS['rh'],
            valueKey: 'humidity',
        );
    }

    private function writeMeasurementTable(
        Worksheet  $sheet,
        Collection $records,
        int        $startRow,
        int        $startColIndex,
        array      $headers,
        array      $limits,
        string     $valueKey,
    ): void {
        $col  = fn(int $offset) => Coordinate::stringFromColumnIndex($startColIndex + $offset);
        $n    = $records->count();
        $mean = $records->avg($valueKey);

        $sumSqrd = $records->sum(fn($r) => ($r[$valueKey] - $mean) ** 2);
        $stdDev  = $n > 0 ? sqrt($sumSqrd / $n) : 0;

        $sheet->setCellValue($col(6) . $startRow, 'Standard Deviation:');
        $sheet->setCellValue($col(7) . $startRow, $stdDev);

        $headerRow = $startRow + 1;
        $sheet->fromArray($headers, null, $col(0) . $headerRow);

        $rows = [];
        foreach ($records as $record) {
            $value  = $record[$valueKey];
            $dev    = $value - $mean;
            $rows[] = [
                $record['recorded_at']->format('m/d/y h:i:s A'),
                $limits['uar'],
                $limits['lar'],
                $limits['ucl'],
                $limits['lcl'],
                $value,
                $dev,
                $dev ** 2,
            ];
        }

        $sheet->fromArray($rows, null, $col(0) . ($headerRow + 1));
    }

    private function updateOverviewRow(Worksheet $sheet, int $row, Device $device, string $status, int $count): void
    {
        $sheet->fromArray([
            $device->location ?? '-',
            $device->ip,
            $status,
            $count,
        ], null, "A{$row}");
    }

    private function addChart(Worksheet $sheet, int $count): void
    {
        if ($count === 0) return;

        $sheetName    = $sheet->getTitle();
        $dataRowStart = 3;
        $dataRowEnd   = $count + 2;

        $sheet->addChart($this->buildLineChart(
            sheetName: $sheetName,
            title: 'Temperature',
            seriesLabels: ['T-UAR', 'T-LAR', 'T-UCL', 'T-LCL', 'Temperature'],
            seriesColumns: ['B', 'C', 'D', 'E', 'F'],
            xCol: 'A',
            dataRowStart: $dataRowStart,
            dataRowEnd: $dataRowEnd,
            topLeft: 'S1',
            bottomRight: 'AH15',
            yMin: self::LIMITS['temp']['lar'] - 3,
            yMax: self::LIMITS['temp']['uar'] + 3,
        ));

        $sheet->addChart($this->buildLineChart(
            sheetName: $sheetName,
            title: 'Relative Humidity',
            seriesLabels: ['RH-UAR', 'RH-LAR', 'RH-UCL', 'RH-LCL', 'Relative Humidity'],
            seriesColumns: ['K', 'L', 'M', 'N', 'O'],
            xCol: 'J',
            dataRowStart: $dataRowStart,
            dataRowEnd: $dataRowEnd,
            topLeft: 'S20',
            bottomRight: 'AH35',
            yMin: self::LIMITS['rh']['lar'] - 10,
            yMax: self::LIMITS['rh']['uar'] + 10,
        ));
    }

    private function buildLineChart(
        string $sheetName,
        string $title,
        array  $seriesLabels,
        array  $seriesColumns,
        string $xCol,
        int    $dataRowStart,
        int    $dataRowEnd,
        string $topLeft,
        string $bottomRight,
        float  $yMin,
        float  $yMax,
    ): Chart {
        $pointCount = $dataRowEnd - $dataRowStart + 1;

        $xLabels = [
            new DataSeriesValues(
                DataSeriesValues::DATASERIES_TYPE_STRING,
                "'{$sheetName}'!\${$xCol}\${$dataRowStart}:\${$xCol}\${$dataRowEnd}",
                null,
                $pointCount,
                marker: 'none'
            ),
        ];

        $labelValues = [];
        $seriesData  = [];

        foreach ($seriesColumns as $i => $col) {
            $labelValues[] = new DataSeriesValues(
                DataSeriesValues::DATASERIES_TYPE_STRING,
                null,
                null,
                1,
                [$seriesLabels[$i]],
                marker: 'none'
            );

            $seriesData[] = new DataSeriesValues(
                DataSeriesValues::DATASERIES_TYPE_NUMBER,
                "'{$sheetName}'!\${$col}\${$dataRowStart}:\${$col}\${$dataRowEnd}",
                null,
                $pointCount,
                marker: 'none'
            );
        }

        $dataSeries = new DataSeries(
            DataSeries::TYPE_LINECHART,
            DataSeries::GROUPING_STANDARD,
            range(0, count($seriesColumns) - 1),
            $labelValues,
            $xLabels,
            $seriesData
        );

        $yAxis = new \PhpOffice\PhpSpreadsheet\Chart\Axis();
        $yAxis->setAxisOption('minimum', $yMin);
        $yAxis->setAxisOption('maximum', $yMax);

        $chart = new Chart(
            name: $title,
            title: new Title($title),
            legend: new Legend(Legend::POSITION_BOTTOM, null, false),
            plotArea: new PlotArea(null, [$dataSeries]),
            yAxis: $yAxis,
        );

        $chart->setTopLeftPosition($topLeft);
        $chart->setBottomRightPosition($bottomRight);

        return $chart;
    }
}
