<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Jobs\SyncDeviceData; // We'll create this next
use Illuminate\Console\Command;

class FetchDeviceRecordings extends Command
{
    // Remove that tilde (~) at the end of the signature
    protected $signature = 'app:fetch-device-recordings';
    protected $description = 'Dispatches sync jobs for all Omega ISD devices';

    public function handle()
    {
        $devices = Device::all();

        if ($devices->isEmpty()) {
            $this->warn('No devices found in the database.');
            return;
        }

        foreach ($devices as $device) {
            // Dispatch the Job to the queue
            SyncDeviceData::dispatch($device);
        }

        $this->info("Dispatched sync jobs for {$devices->count()} devices.");
    }
}
