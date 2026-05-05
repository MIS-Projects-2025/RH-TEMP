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
use App\Models\Recording;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Conditional;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Settings;
use Symfony\Component\Cache\Adapter\RedisAdapter;
use Symfony\Component\Cache\Psr16Cache;

class ProcessRecordingsExport implements ShouldQueue
{
    use Queueable;

    private const LIMITS = [
        'temp' => ['uar' => 26.0, 'lar' => 19.0, 'ucl' => 25.0, 'lcl' => 20.0],
        'rh'   => ['uar' => 62.0, 'lar' => 48.0, 'ucl' => 60.0, 'lcl' => 50.0],
    ];

    public int $timeout = 300;

    public function __construct(public ExportJob $exportJob) {}

    public function handle(OmegaIsdService $omega): void
    {
        $this->exportJob->update(['status' => 'processing', 'progress' => 'Fetching all devices...']);

        $redisConnection = \Illuminate\Support\Facades\Redis::connection()->client();
        $pool = new RedisAdapter($redisConnection);
        $cache = new Psr16Cache($pool);
        Settings::setCache($cache);

        $params  = $this->exportJob->params;
        $date    = Carbon::parse($params['date']);
        $period  = (int) $params['period'];
        $devices = Device::all();

        // --- Fetch all devices concurrently ---
        $responses = Http::pool(function (Pool $pool) use ($devices, $date, $period) {
            foreach ($devices as $device) {
                $pool->as($device->id)
                    ->timeout(20)
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

        // --- Build spreadsheet (fast, no more waiting per device) ---
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
        $this->applyHeaderStyle($overview, 'A4:E4');

        $overviewRow = 5;

        foreach ($devices as $device) {
            $response = $responses[$device->id];

            $sheet = $spreadsheet->createSheet();
            $sheet->setTitle(substr(trim($device->name) ?: "Dev-{$device->id}", 0, 31));

            if ($response instanceof \Exception || !$response->successful()) {
                $reason = $response instanceof \Exception
                    ? $response->getMessage()
                    : "HTTP {$response->status()}";

                Log::warning("Export: unreachable [{$device->name}] {$device->ip} — {$reason}");
                $sheet->setCellValue('A1', "Device unreachable: {$reason}");
                $this->updateOverviewRow($overview, $overviewRow, $device, 'Unreachable', 0, 'FFC7CE');
                $overviewRow++;

                continue;
            }

            $records = $omega->parse($response->body());

            if ($records->isEmpty()) {
                $sheet->setCellValue('A1', 'No data recorded for this period.');
                $this->updateOverviewRow($overview, $overviewRow, $device, 'No Data', 0, 'FFEB9C');
            } else {
                $this->writeDeviceSheet($sheet, $records);
                $this->addChart($sheet, $records->count());
                $sheet->getTabColor()->setRGB('00B050');
                $this->updateOverviewRow($overview, $overviewRow, $device, 'OK', $records->count(), 'C6EFCE');
            }
            $overviewRow++;

            unset($records);
        }

        foreach (range('A', 'E') as $col) {
            $overview->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'report_' . $date->format('Ymd') . '_' . time() . '.xlsx';
        $path     = 'exports/' . $filename;

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
        $this->writeMeasurementTable(
            sheet: $sheet,
            records: $records,
            startRow: 1,
            startColIndex: 1,
            headers: ['Date and Time', 'T-UAR', 'T-LAR', 'T-UCL', 'T-LCL', 'Temperature', 'Dev', 'sqrd'],
            limits: self::LIMITS['temp'],
            valueKey: 'temperature',
            valueFormatCode: '0.00',
            devFormatCode: '0.00',
        );

        $this->writeMeasurementTable(
            sheet: $sheet,
            records: $records,
            startRow: 1,
            startColIndex: 10,
            headers: ['Date and Time', 'RH-UAR', 'RH-LAR', 'RH-UCL', 'RH-LCL', 'Relative Humidity', 'Dev', 'sqrd'],
            limits: self::LIMITS['rh'],
            valueKey: 'humidity',
            valueFormatCode: '0.00"%"',
            devFormatCode: '0.00"%"',
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
        string     $valueFormatCode = 'General',
        string     $devFormatCode   = 'General',
    ): void {
        $col = fn(int $offset) => Coordinate::stringFromColumnIndex($startColIndex + $offset);

        $mean   = $records->avg($valueKey);
        $sqrds  = $records->map(fn($r) => ($r[$valueKey] - $mean) ** 2)->all();
        $n      = count($sqrds);
        $stdDev = $n > 0 ? sqrt(array_sum($sqrds) / $n) : 0;

        $sheet->setCellValue($col(6) . $startRow, 'Standard Deviation:');
        $sheet->setCellValue($col(7) . $startRow, $stdDev);
        $sheet->getStyle($col(6) . $startRow)->getFont()->setBold(true);
        $sheet->getStyle($col(7) . $startRow)->getNumberFormat()->setFormatCode($devFormatCode);

        $headerRow = $startRow + 1;
        $sheet->fromArray($headers, null, $col(0) . $headerRow);
        $this->applyHeaderStyle($sheet, $col(0) . $headerRow . ':' . $col(7) . $headerRow);

        $dataRow = $headerRow + 1;
        // Outside UAR/LAR — red (action)
        $redHigh = new Conditional();
        $redHigh->setConditionType(Conditional::CONDITION_CELLIS);
        $redHigh->setOperatorType(Conditional::OPERATOR_GREATERTHAN);
        $redHigh->addCondition($limits['uar']);
        $redHigh->getStyle()->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('FFC7CE');

        $redLow = new Conditional();
        $redLow->setConditionType(Conditional::CONDITION_CELLIS);
        $redLow->setOperatorType(Conditional::OPERATOR_LESSTHAN);
        $redLow->addCondition($limits['lar']);
        $redLow->getStyle()->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('FFC7CE');

        // Outside UCL/LCL but inside UAR/LAR — yellow (warning)
        $yellowHigh = new Conditional();
        $yellowHigh->setConditionType(Conditional::CONDITION_CELLIS);
        $yellowHigh->setOperatorType(Conditional::OPERATOR_BETWEEN);
        $yellowHigh->addCondition($limits['ucl']);
        $yellowHigh->addCondition($limits['uar']);
        $yellowHigh->getStyle()->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('FFEB9C');

        $yellowLow = new Conditional();
        $yellowLow->setConditionType(Conditional::CONDITION_CELLIS);
        $yellowLow->setOperatorType(Conditional::OPERATOR_BETWEEN);
        $yellowLow->addCondition($limits['lar']);
        $yellowLow->addCondition($limits['lcl']);
        $yellowLow->getStyle()->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('FFEB9C');

        foreach ($records as $record) {
            $value = $record[$valueKey];
            $dev   = $value - $mean;
            $sqrd  = ($dev) ** 2;

            $sheet->fromArray([
                $record['recorded_at']->format('m/d/y h:i:s A'),
                $limits['uar'],
                $limits['lar'],
                $limits['ucl'],
                $limits['lcl'],
                $value,
                $dev,
                $sqrd,
            ], null, $col(0) . $dataRow);

            $sheet->getStyle($col(5) . $dataRow)->getNumberFormat()->setFormatCode($valueFormatCode);
            $sheet->getStyle($col(6) . $dataRow)->getNumberFormat()->setFormatCode($devFormatCode);

            $dataRow++;
        }

        $valueRange = $col(5) . ($startRow + 2) . ':' . $col(5) . ($dataRow - 1);

        // Order matters — Excel evaluates top to bottom, first match wins.
        // Put red first so UAR/LAR breach isn't overridden by the yellow rule.
        $sheet->getStyle($valueRange)->setConditionalStyles([
            $redHigh,
            $redLow,
            $yellowHigh,
            $yellowLow,
        ]);
    }

    private function updateOverviewRow($sheet, $row, $device, $status, $count, $rgbColor): void
    {
        $sheet->fromArray([
            $device->location ?? '-',
            $device->ip,
            $status,
            $count,
        ], null, "A{$row}");

        $sheet->getStyle("A{$row}:E{$row}")->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB($rgbColor);
    }

    private function applyHeaderStyle($sheet, string $range): void
    {
        $style = $sheet->getStyle($range);
        $style->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $style->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('2D3748');
    }

    private function addChart(Worksheet $sheet, int $count): void
    {
        if ($count === 0) return;

        $sheetName    = $sheet->getTitle();
        $dataRowStart = 3;
        $dataRowEnd   = $count + 2;

        // Temp chart — starts at column S (after RH table ends at Q + gap)
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

        // RH chart — starts at column AB
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
                marker: "none"
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
                marker: "none"
            );

            $seriesData[] = new DataSeriesValues(
                DataSeriesValues::DATASERIES_TYPE_NUMBER,
                "'{$sheetName}'!\${$col}\${$dataRowStart}:\${$col}\${$dataRowEnd}",
                null,
                $pointCount,
                marker: "none"
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
