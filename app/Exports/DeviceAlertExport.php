<?php

namespace App\Exports;

use App\Models\AlertLevel;
use App\Models\DeviceAlert;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Chart\Chart;
use PhpOffice\PhpSpreadsheet\Chart\DataSeries;
use PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues;
use PhpOffice\PhpSpreadsheet\Chart\Legend;
use PhpOffice\PhpSpreadsheet\Chart\PlotArea;
use PhpOffice\PhpSpreadsheet\Chart\Title;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Builds the alert history workbook:
 *  - Summary: counts per location and per day, with a chart for each
 *  - Events:  one row per saved alert, with the thresholds that applied
 */
class DeviceAlertExport
{
    private const CELL_FILL = ['orange' => 'FFE0B2', 'red' => 'F8BBBB'];
    private const SERIES_FILL = ['orange' => 'FF9800', 'red' => 'E53935'];

    /** @param Collection<int, DeviceAlert> $alerts with level relations loaded */
    public function save(Collection $alerts, string $path): void
    {
        $book = new Spreadsheet();

        $this->summary($book->getActiveSheet(), $alerts);
        $this->events($book->createSheet(), $alerts);
        $book->setActiveSheetIndex(0);

        $writer = new Xlsx($book);
        $writer->setIncludeCharts(true);
        $writer->save($path);
    }

    private function events(Worksheet $sheet, Collection $alerts): void
    {
        $sheet->setTitle('Events');

        $sheet->fromArray([
            'Alerted at',
            'Location',
            'Device IP',
            'Status',
            'Previous status',
            'Temp (°C)',
            'Temp status',
            'RH (%)',
            'RH status',
            'Threshold profile',
            'Temp min',
            'Temp max',
            'Temp crit min',
            'Temp crit max',
            'RH min',
            'RH max',
            'RH crit min',
            'RH crit max',
        ], null, 'A1');

        $alerts = $alerts->values();

        $sheet->fromArray($alerts->map(fn(DeviceAlert $a) => [
            Date::PHPToExcel($a->alerted_at),
            $a->location,
            $a->device_ip,
            $this->label($a->level),
            $this->label($a->previousLevel),
            $a->temp,
            $this->label($a->tempLevel),
            $a->rh,
            $this->label($a->rhLevel),
            $a->threshold_profile_name,
            ...array_map(fn($column) => $a->{$column}, DeviceAlert::THRESHOLDS),
        ])->all(), null, 'A2');

        // Colour the status cells so orange/red stand out when scanning.
        $statusColumns = ['D' => 'level', 'E' => 'previousLevel', 'G' => 'tempLevel', 'I' => 'rhLevel'];

        foreach ($alerts as $i => $alert) {
            foreach ($statusColumns as $column => $relation) {
                $rgb = self::CELL_FILL[$alert->{$relation}?->name ?? ''] ?? null;

                if ($rgb) {
                    $sheet->getStyle($column . ($i + 2))->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB($rgb);
                }
            }
        }

        $last = $alerts->count() + 1;

        $sheet->getStyle('A1:R1')->getFont()->setBold(true);
        $sheet->getStyle("A2:A{$last}")->getNumberFormat()->setFormatCode('yyyy-mm-dd hh:mm:ss');
        $sheet->freezePane('A2');
        $sheet->setAutoFilter("A1:R{$last}");

        foreach (range('A', 'R') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
    }

    private function summary(Worksheet $sheet, Collection $alerts): void
    {
        $sheet->setTitle('Summary');

        $byLocation = $this->tally($alerts, fn(DeviceAlert $a) => $a->location ?: $a->device_ip);
        $byDay = $this->tally($alerts, fn(DeviceAlert $a) => $a->alerted_at->format('Y-m-d'));

        $sheet->fromArray(['Location', 'Orange', 'Red', 'Total'], null, 'A1');
        $sheet->fromArray($byLocation, null, 'A2');

        $sheet->fromArray(['Date', 'Orange', 'Red', 'Total'], null, 'F1');
        $sheet->fromArray($byDay, null, 'F2');

        $sheet->getStyle('A1:D1')->getFont()->setBold(true);
        $sheet->getStyle('F1:I1')->getFont()->setBold(true);

        foreach (['A', 'B', 'C', 'D', 'F', 'G', 'H', 'I'] as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $sheet->addChart($this->chart($byLocation, 'A', 'B', 'C', 'Alerts by location', 'K2', 'U18'));
        $sheet->addChart($this->chart($byDay, 'F', 'G', 'H', 'Alerts per day', 'K20', 'U36'));
    }

    /** Rows of [group, orange, red, total], sorted by group. */
    private function tally(Collection $alerts, callable $groupBy): array
    {
        return $alerts->groupBy($groupBy)->sortKeys()->map(fn(Collection $group, $name) => [
            (string) $name,
            $group->filter(fn(DeviceAlert $a) => $a->level->name === 'orange')->count(),
            $group->filter(fn(DeviceAlert $a) => $a->level->name === 'red')->count(),
            $group->count(),
        ])->values()->all();
    }

    /** Stacked column chart (orange + red) over a table on the Summary sheet. */
    private function chart(
        array $rows,
        string $categoryColumn,
        string $orangeColumn,
        string $redColumn,
        string $title,
        string $topLeft,
        string $bottomRight
    ): Chart {
        $count = count($rows);
        $last = $count + 1;

        $categories = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, $this->ref($categoryColumn, 2, $last), null, $count),
        ];

        $labels = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, $this->ref($orangeColumn, 1), null, 1),
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, $this->ref($redColumn, 1), null, 1),
        ];

        $orange = new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, $this->ref($orangeColumn, 2, $last), null, $count);
        $orange->setFillColor(self::SERIES_FILL['orange']);

        $red = new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, $this->ref($redColumn, 2, $last), null, $count);
        $red->setFillColor(self::SERIES_FILL['red']);

        $series = new DataSeries(
            DataSeries::TYPE_BARCHART,
            DataSeries::GROUPING_STACKED,
            [0, 1],
            $labels,
            $categories,
            [$orange, $red]
        );
        $series->setPlotDirection(DataSeries::DIRECTION_COL);

        $chart = new Chart(
            'chart_' . $categoryColumn,
            new Title($title),
            new Legend(Legend::POSITION_BOTTOM, null, false),
            new PlotArea(null, [$series])
        );
        $chart->setTopLeftPosition($topLeft);
        $chart->setBottomRightPosition($bottomRight);

        return $chart;
    }

    /** Absolute Summary-sheet reference, e.g. 'Summary'!$B$2:$B$9 */
    private function ref(string $column, int $from, ?int $to = null): string
    {
        $ref = "'Summary'!\${$column}\${$from}";

        return $to ? $ref . ":\${$column}\${$to}" : $ref;
    }

    private function label(?AlertLevel $level): ?string
    {
        return $level ? ucfirst($level->name) : null;
    }
}
