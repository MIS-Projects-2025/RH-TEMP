<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Models\Status;
use Illuminate\Console\Command;
use App\Constants\DeviceTempThresholdConstants;

class SaveDeviceLogs extends Command
{
    protected $signature   = 'devices:save-logs';
    protected $description = 'Fetch all device readings and save out-of-range entries to DB';

    public function handle(): void
    {
        $devices = Device::all();

        if ($devices->isEmpty()) {
            $this->info('No devices found.');
            return;
        }

        $saved   = 0;
        $skipped = 0;
        $failed  = 0;

        foreach ($devices as $device) {
            $site = "http://{$device->ip}/postReadHtml?a";

            try {
                $ctx     = stream_context_create(['http' => ['timeout' => 5]]);
                $content = file_get_contents($site, false, $ctx);

                if ($content === false) {
                    $this->warn("Offline: {$device->location} ({$device->ip})");
                    $failed++;
                    continue;
                }

                $temp = trim($this->extract($content, 'Temperature', 11, 5));
                $rh   = trim($this->extract($content, 'Humidity',    8,  5));
                $rec  = trim($this->extract($content, 'Recording',   10, 3));
                $isRecording = strtoupper($rec) !== 'OFF';

                if (!is_numeric($temp) || !is_numeric($rh)) {
                    $this->warn("Bad data: {$device->location} — temp={$temp} rh={$rh}");
                    $failed++;
                    continue;
                }

                if ($this->isOutOfRange((float) $temp, (float) $rh, $device->location)) {
                    $device->statuses()->create([
                        'temp'         => $temp,
                        'rh'           => $rh,
                        'is_recording' => $isRecording,
                    ]);
                    $this->line("Saved: {$device->location} — temp={$temp} rh={$rh}");
                    $saved++;
                } else {
                    $skipped++;
                }
            } catch (\Exception $e) {
                $this->error("Error: {$device->location} — {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("Done — saved: {$saved}, in-range: {$skipped}, failed: {$failed}");
    }

    private function extract(string $content, string $keyword, int $offset, int $length): string
    {
        $pos = strpos($content, $keyword);
        if ($pos === false) return '';
        return substr($content, $pos + $offset, $length);
    }

    private function isOutOfRange(float $temp, float $rh, string $location): bool
    {
        $limits = in_array($location, DeviceTempThresholdConstants::PL3_LOCATIONS, true)
            ? DeviceTempThresholdConstants::PL3
            : DeviceTempThresholdConstants::STANDARD;

        return $temp > $limits['temp_max']
            || $temp < $limits['temp_min']
            || $rh   > $limits['rh_max']
            || $rh   < $limits['rh_min'];
    }
}
