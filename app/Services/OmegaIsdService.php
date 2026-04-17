<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class OmegaIsdService
{
    private const PERIOD_MAP = [
        'day'   => 1,
        'week'  => 2,
        'month' => 3,
        'year'  => 4,
    ];

    public function fetchLiveStatus(string $ip): array
    {
        // The 'a' parameter is a timestamp to prevent browser/proxy caching
        $url = "http://{$ip}/postReadHtml?a=" . (int) (microtime(true) * 1000);

        try {
            $response = Http::timeout(2)->get($url);

            if (!$response->successful()) {
                return $this->offlineResponse();
            }

            $text = $response->body();

            preg_match('/Temperature\s+([\d.]+)/', $text, $tempMatch);
            preg_match('/Humidity\s+([\d.]+)/', $text, $rhMatch);
            preg_match('/Recording\s+(\w+)/', $text, $recMatch);

            return [
                'temp'         => $tempMatch[1] ?? 'Offline',
                'rh'           => $rhMatch[1] ?? 'Offline',
                'is_recording' => ($recMatch[1] ?? 'Off') === 'On', // Convert to boolean
                'status'       => 'online',
            ];
        } catch (\Exception $e) {
            return $this->offlineResponse();
        }
    }

    private function offlineResponse(): array
    {
        return [
            'temp'         => 'Offline',
            'rh'           => 'Offline',
            'is_recording' => false,
            'status'       => 'offline',
        ];
    }

    public function fetchRecordings(
        string $ip,
        int $year,
        int $month,
        int $day,
        int $period = 1
    ): Collection {
        $lock = Cache::lock("omega_retrieval_{$ip}", 30);

        if (!$lock->get()) {
            throw new \RuntimeException("Device {$ip} is already being polled.");
        }

        try {
            $response = Http::timeout(20)
                ->withHeaders([
                    'Referer' => "http://{$ip}/pLoadWbPg?pgNo=30",
                    'Origin'  => "http://{$ip}",
                ])
                ->asForm()
                ->post("http://{$ip}/downloadRecordData", [
                    'Year'   => $year,
                    'Month'  => $month,
                    'Day'    => $day,
                    'Period' => $period,
                    'none'   => 1,
                ]);

            if (!$response->successful()) {
                throw new \RuntimeException("Device {$ip} returned HTTP {$response->status()}");
            }

            return $this->parse($response->body());
        } finally {
            $lock->release();
        }
    }

    public function parse(string $body): Collection
    {
        return collect(explode("\n", trim($body)))
            ->filter(fn($line) => str_starts_with(trim($line), '#'))
            ->map(function ($line) {
                $line  = ltrim(trim($line), '#');
                $parts = explode(';', $line);

                [$date, $time, $temp, $humidity, $dew] = $parts;

                return [
                    'recorded_at' => Carbon::createFromFormat('Y/m/d H:i:s', "$date $time"),
                    'temperature' => (float) rtrim($temp, 'C'),
                    'humidity'    => (float) rtrim($humidity, '%'),
                    'dew_point'   => (float) ltrim(rtrim($dew, 'C'), 'D'),
                ];
            })
            ->values();
    }
}
