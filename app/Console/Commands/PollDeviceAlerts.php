<?php

namespace App\Console\Commands;

use App\Models\AlertLevel;
use App\Models\Device;
use App\Models\DeviceAlert;
use Illuminate\Console\Command;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Throwable;

class PollDeviceAlerts extends Command
{
    protected $signature = 'app:poll-device-alerts';

    protected $description = 'Poll all devices, save orange/red events, and send email alerts';

    public function handle(): int
    {
        $proxyUrl = rtrim(
            (string) config('services.device_proxy.url'),
            '/'
        );

        $recipients = array_values(array_filter(
            array_map(
                'trim',
                explode(',', (string) config('services.device_alert.recipients'))
            )
        ));

        if ($proxyUrl === '') {
            $this->error('Device proxy URL is not configured.');
            return self::FAILURE;
        }

        if (empty($recipients)) {
            $this->error('No device alert email recipients are configured.');
            return self::FAILURE;
        }

        try {
            $devices = Device::query()
                ->with('thresholdProfile')
                ->whereNotNull('ip')
                ->where('ip', '<>', '')
                ->get();

            // name => id (green/orange/red), loaded once per run.
            $levelIds = AlertLevel::pluck('id', 'name');
        } catch (Throwable $e) {
            $this->error('Failed to load devices: ' . $e->getMessage());

            report($e);

            return self::FAILURE;
        }

        if ($devices->isEmpty()) {
            $this->info('No devices found.');
            return self::SUCCESS;
        }

        /*
         * Prepare requests for all devices.
         *
         * This assumes your Device model has a thresholdProfile()
         * relationship and that the threshold fields match your React code.
         */
        $requests = [];
        $devicesByKey = [];

        foreach ($devices as $device) {
            if (!$device->thresholdProfile) {
                $this->warn(
                    "Skipping {$device->ip}: no threshold profile assigned."
                );

                continue;
            }

            $key = (string) $device->getKey();

            $requests[$key] = [
                'url' => "{$proxyUrl}/proxy/{$device->ip}/postReadHtml?a",
            ];

            $devicesByKey[$key] = $device;
        }

        if (empty($requests)) {
            $this->warn('No devices with valid threshold profiles to poll.');
            return self::SUCCESS;
        }

        /*
         * Poll all device URLs concurrently.
         */
        try {
            $responses = Http::pool(
                function (Pool $pool) use ($requests) {
                    $poolRequests = [];

                    foreach ($requests as $key => $request) {
                        $poolRequests[$key] = $pool
                            ->as($key)
                            ->connectTimeout(2)
                            ->timeout(5)
                            ->get($request['url']);
                    }

                    return $poolRequests;
                }
            );
        } catch (Throwable $e) {
            $this->error('Failed to execute device polling requests: ' . $e->getMessage());

            report($e);

            return self::FAILURE;
        }

        $polled = 0;
        $alertsSent = 0;
        $failed = 0;

        /*
         * Process each response independently.
         */
        foreach ($devicesByKey as $key => $device) {
            $response = $responses[$key] ?? null;

            if ($response instanceof Throwable) {
                $this->warn("Request failed for {$device->ip}: {$response->getMessage()}");
                $failed++;
                continue;
            }

            if (!$response instanceof Response) {
                $this->warn("No valid response received from {$device->ip}.");
                $failed++;
                continue;
            }

            if (!$response->successful()) {
                $this->warn(
                    "HTTP {$response->status()} returned by {$device->ip}."
                );

                $failed++;
                continue;
            }

            $reading = $this->parseDeviceResponse($response->body());

            /*
             * Do not treat missing/invalid readings as green.
             * Preserve the last known alert state when a reading is invalid.
             */
            if ($reading['temp'] === null || $reading['rh'] === null) {
                $this->warn(
                    "Could not parse temperature/humidity from {$device->ip}."
                );

                $failed++;
                continue;
            }

            $polled++;

            $thresholds = $device->thresholdProfile;

            $tempLevel = $this->getLevel(
                $reading['temp'],
                $thresholds->temp_min,
                $thresholds->temp_max,
                $thresholds->temp_crit_min,
                $thresholds->temp_crit_max
            );

            $rhLevel = $this->getLevel(
                $reading['rh'],
                $thresholds->rh_min,
                $thresholds->rh_max,
                $thresholds->rh_crit_min,
                $thresholds->rh_crit_max
            );

            $currentLevel = $this->getOverallLevel(
                $tempLevel,
                $rhLevel
            );

            $cache = Cache::store('file');

            $statusKey = "device-alert-status:{$key}";
            $incidentNotifiedKey = "device-alert-email-sent:{$key}";

            $previousLevel = $cache->get($statusKey);

            $orangeAlertsEnabled = (bool) config(
                'services.device_alert.orange_enabled',
                false
            );

            /*
            * Green means the current alert incident has ended.
            * Reset the email-sent flag so a future incident can notify again.
            */
            if ($currentLevel === 'green') {
                $cache->forever($statusKey, 'green');
                $cache->forget($incidentNotifiedKey);

                continue;
            }

            /*
            * Red emails are always enabled.
            * Orange emails depend on DEVICE_ALERT_ORANGE_ENABLED.
            */
            $shouldSendEmail = $currentLevel === 'red'
                || (
                    $currentLevel === 'orange'
                    && $orangeAlertsEnabled
                );

            $alreadyNotified = (bool) $cache->get(
                $incidentNotifiedKey,
                false
            );

            $changed = $previousLevel !== $currentLevel;
            $emailPending = $shouldSendEmail && !$alreadyNotified;

            /*
             * Nothing to do when the status is unchanged and no email is pending
             * (a pending email here means an earlier send failed and is retried).
             */
            if (!$changed && !$emailPending) {
                continue;
            }

            /*
             * Save every change into orange/red, whether or not an email goes out.
             * The status is only advanced once the row is saved, so a DB failure
             * is retried on the next poll instead of losing the event.
             */
            if ($changed) {
                try {
                    DeviceAlert::create([
                        'device_id' => $device->getKey(),
                        'device_ip' => $device->ip,
                        'location' => $device->location,
                        'threshold_profile_name' => $thresholds->name,
                        'temp' => $reading['temp'],
                        'rh' => $reading['rh'],
                        'level_id' => $levelIds[$currentLevel],
                        'previous_level_id' => $previousLevel ? $levelIds[$previousLevel] : null,
                        'temp_level_id' => $levelIds[$tempLevel],
                        'rh_level_id' => $levelIds[$rhLevel],
                        'alerted_at' => now(),
                    ] + $thresholds->only(DeviceAlert::THRESHOLDS));

                    $cache->forever($statusKey, $currentLevel);

                    $this->line(
                        "{$device->location} ({$device->ip}): " .
                            strtoupper($previousLevel ?? 'UNKNOWN') .
                            ' -> ' . strtoupper($currentLevel)
                    );
                } catch (Throwable $e) {
                    $this->error(
                        "Failed to save alert for {$device->ip}: {$e->getMessage()}"
                    );

                    report($e);

                    $failed++;
                }
            }

            /*
            * At most one email per device per continuous alert incident.
            * If orange is disabled, a later red reading can still trigger an email.
            */
            if ($emailPending) {
                $location = $device->location ?: 'Unknown location';

                $emoji = $currentLevel === 'red' ? '🔴' : '🟠';

                // Red always takes priority over orange.
                // Within the same severity, TEMP is checked before RH.
                if ($tempLevel === 'red') {
                    $trigger = sprintf('TEMP %s °C', $reading['temp']);
                } elseif ($rhLevel === 'red') {
                    $trigger = sprintf('RH %s %%', $reading['rh']);
                } elseif ($tempLevel === 'orange') {
                    $trigger = sprintf('TEMP %s °C', $reading['temp']);
                } else {
                    $trigger = sprintf('RH %s %%', $reading['rh']);
                }

                $subject = sprintf(
                    // '%s [%s] RH-TEMP Alert - %s - %s',
                    '%s RH-TEMP Alert - %s - %s',
                    $emoji,
                    // strtoupper($currentLevel),
                    $location,
                    $trigger
                );

                $body = implode("\n", [
                    'TSPI RH-TEMP Alert',
                    '',
                    "Location: {$location}",
                    // "Device IP: {$device->ip}",
                    'Previous status: ' . strtoupper($previousLevel ?? 'UNKNOWN'),
                    'Current status: ' . strtoupper($currentLevel),
                    '',
                    "Temperature: {$reading['temp']} °C ({$tempLevel})",
                    "Humidity: {$reading['rh']} % ({$rhLevel})",
                    '',
                    'Time: ' . now()->toDateTimeString(),
                ]);

                try {
                    Mail::raw($body, function ($message) use ($recipients, $subject) {
                        $message->to($recipients)->subject($subject);
                    });

                    // Mark the incident as notified only after email succeeds.
                    $cache->forever($incidentNotifiedKey, true);

                    $alertsSent++;

                    $this->warn("ALERT SENT: {$location} - " . strtoupper($currentLevel));
                } catch (Throwable $e) {
                    $this->error(
                        "Email failed for {$device->ip}: {$e->getMessage()}"
                    );

                    report($e);

                    $failed++;
                }
            }
        }

        $this->info(
            "Polling complete. Devices read: {$polled}, " .
                "emails sent: {$alertsSent}, failures: {$failed}."
        );

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Parse the device's HTML/text response.
     */
    private function parseDeviceResponse(string $text): array
    {
        preg_match(
            '/Temperature\s*:?\s*(-?(?:\d+(?:\.\d*)?|\.\d+))/i',
            $text,
            $tempMatch
        );

        preg_match(
            '/Humidity\s*:?\s*(-?(?:\d+(?:\.\d*)?|\.\d+))/i',
            $text,
            $rhMatch
        );

        return [
            'temp' => isset($tempMatch[1])
                ? (float) $tempMatch[1]
                : null,

            'rh' => isset($rhMatch[1])
                ? (float) $rhMatch[1]
                : null,
        ];
    }

    /**
     * Return green, orange, or red using the same rules as React.
     */
    private function getLevel(
        float $value,
        $min,
        $max,
        $critMin,
        $critMax
    ): string {
        $lo = $critMin ?? $min;
        $hi = $critMax ?? $max;

        if (
            ($lo !== null && $value < $lo) ||
            ($hi !== null && $value > $hi)
        ) {
            return 'red';
        }

        if (
            ($min !== null && $value < $min) ||
            ($max !== null && $value > $max)
        ) {
            return 'orange';
        }

        return 'green';
    }

    /**
     * The worst status between temperature and humidity wins.
     */
    private function getOverallLevel(
        string $tempLevel,
        string $rhLevel
    ): string {
        $rank = [
            'green' => 0,
            'orange' => 1,
            'red' => 2,
        ];

        return $rank[$tempLevel] >= $rank[$rhLevel]
            ? $tempLevel
            : $rhLevel;
    }
}
