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

class ProcessRecordingsExport implements ShouldQueue
{
    use Queueable;
    public int $timeout = 300; // 5 mins for 30-40 devices
    /**
     * Create a new job instance.
     */
    public function __construct(public ExportJob $exportJob) {}

    /**
     * Execute the job.
     */
    public function handle(OmegaIsdService $omega): void
    {
        $this->exportJob->update(['status' => 'processing']);

        $params   = $this->exportJob->params;
        $endDate  = Carbon::parse($params['date'])->endOfDay();
        $period   = (int) $params['period']; // 1=Day, 2=Week, 3=Month, 4=Year
        $interval = (int) ($params['interval'] ?? 30); // 10, 20, 30 mins

        // 1. Calculate the Start Date based on the "Lookback" Period
        $startDate = match ($period) {
            1 => $endDate->copy()->startOfDay(),               // Exact Day
            2 => $endDate->copy()->subDays(6)->startOfDay(),    // Last 7 Days
            3 => $endDate->copy()->subDays(29)->startOfDay(),   // Last 30 Days
            4 => $endDate->copy()->subDays(364)->startOfDay(),  // Last 365 Days
            default => $endDate->copy()->startOfDay(),
        };

        $devices = Device::all();
        $total   = $devices->count();

        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        // 2. Setup the Overview Sheet
        $overview = $spreadsheet->createSheet(0);
        $overview->setTitle('Overview');
        $overview->fromArray([
            ['Report Period:', $startDate->format('Y-m-d') . ' to ' . $endDate->format('Y-m-d')],
            ['Generated At:', now()->format('Y-m-d H:i:s')],
            [], // Empty row
            ['Device Name', 'Location', 'IP Address', 'Status', 'Data Points Found']
        ], null, 'A1');

        $this->applyHeaderStyle($overview, 'A4:E4');
        $overviewRow = 5;

        foreach ($devices as $index => $device) {
            $this->exportJob->update([
                'progress' => "Processing " . ($index + 1) . " of {$total}: {$device->name}",
            ]);

            $groupSeconds = $interval * 60;

            $records = Recording::where('device_id', $device->id)
                ->whereBetween('recorded_at', [$startDate, $endDate])
                ->selectRaw("
                    temperature, 
                    humidity, 
                    recorded_at,
                    -- This identifies which 30-minute 'bucket' the record belongs to
                    FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(recorded_at) / ($groupSeconds)) * ($groupSeconds)) as time_slot
                ")
                ->whereIn('id', function ($query) use ($device, $startDate, $endDate, $groupSeconds) {
                    $query->selectRaw('MAX(id)')
                        ->from('recordings')
                        ->where('device_id', $device->id)
                        ->whereBetween('recorded_at', [$startDate, $endDate])
                        ->groupByRaw("FLOOR(UNIX_TIMESTAMP(recorded_at) / ($groupSeconds))");
                })
                ->orderBy('recorded_at', 'ASC')
                ->get();

            $sheet = $spreadsheet->createSheet();
            $sheetTitle = substr(trim($device->name) ?: "Dev-{$device->id}", 0, 31);
            $sheet->setTitle($sheetTitle);

            if ($records->isEmpty()) {
                $sheet->setCellValue('A1', 'No data recorded for this period.');
                $this->updateOverviewRow($overview, $overviewRow, $device, 'No Data', 0, 'FFC7CE');
            } else {
                // 1. Updated Headers (Removed "Avg" since it's now a snapshot)
                $sheet->fromArray(['Interval Slot', 'Actual Time', 'Temperature (°C)', 'Humidity (%)'], null, 'A1');

                foreach ($records as $i => $row) {
                    $sheet->fromArray([
                        $row->time_slot,    // The "Bucket" (e.g., 14:00:00)
                        $row->recorded_at,  // The exact DB timestamp (e.g., 14:00:05)
                        $row->temperature,  // Raw value from the snapshot
                        $row->humidity,     // Raw value from the snapshot
                    ], null, 'A' . ($i + 2));
                }

                $this->addChart($sheet, $records->count());
                $this->updateOverviewRow($overview, $overviewRow, $device, 'OK', $records->count(), 'C6EFCE');
                $sheet->getTabColor()->setRGB('00B050');
            }

            $overviewRow++;
        }

        foreach (range('A', 'E') as $col) {
            $overview->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'report_' . $endDate->format('Ymd') . '_' . time() . '.xlsx';
        $path     = 'exports/' . $filename;

        $writer = new Xlsx($spreadsheet);
        $writer->setIncludeCharts(true);
        $writer->save(storage_path('app/' . $path));

        $this->exportJob->update([
            'status'       => 'done',
            'file_path'    => $path,
            'completed_at' => now(),
        ]);
    }

    private function updateOverviewRow($sheet, $row, $device, $status, $count, $rgbColor)
    {
        $sheet->fromArray([
            $device->name,
            $device->location ?? '-',
            $device->ip,
            $status,
            $count
        ], null, "A{$row}");

        $sheet->getStyle("A{$row}:E{$row}")->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB($rgbColor);
    }

    private function applyHeaderStyle($sheet, $range)
    {
        $style = $sheet->getStyle($range);
        $style->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $style->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('2D3748');
    }

    private function addChart($sheet, int $count): void
    {
        if ($count === 0) return;
        // same chart code from earlier — paste it here
    }
}
