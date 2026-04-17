<?php

namespace App\Jobs;

use App\Models\Device;
use App\Models\Recording;
use App\Services\OmegaIsdService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncDeviceData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected Device $device) {}

    public function handle(OmegaIsdService $omega): void
    {
        Log::info("Starting sync for Device: " . $this->device->ip);
        $data = $omega->fetchLiveStatus($this->device->ip);
        Log::info("Finished sync for Device: " . $this->device->ip);

        if ($data['status'] === 'offline' || $data['temp'] === 'Offline') {
            return;
        }

        Recording::updateOrCreate(
            [
                'device_id'   => $this->device->id,
                'recorded_at' => now()->second(0),
            ],
            [
                'temperature' => (float) $data['temp'],
                'humidity'    => (float) $data['rh'],
            ]
        );
    }
}
