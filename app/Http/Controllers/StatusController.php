<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Status;
use App\Models\Manipulator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Constants\DeviceTempThresholdConstants;

class StatusController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'devices'    => Device::orderBy('location')->get(),
            'thresholds' => $this->thresholdConfig(),
        ]);
    }

    /**
     * Evaluate a reading and save to DB if out of range.
     */
    public function log(Request $request)
    {
        $request->validate([
            'device_id'    => 'required|exists:devices,id',
            'temp'         => 'required|string',
            'rh'           => 'required|string',
            'is_recording' => 'required|string',
        ]);

        $device     = Device::find($request->device_id);
        $outOfRange = $this->isOutOfRange(
            (float) $request->temp,
            (float) $request->rh,
            $device->location
        );

        if ($outOfRange) {
            $device->statuses()->create([
                'temp'         => $request->temp,
                'rh'           => $request->rh,
                'is_recording' => $request->is_recording === 'ON',
            ]);
        }

        return response()->json([
            'out_of_range' => $outOfRange,
            'saved'        => $outOfRange,
        ]);
    }

    // -----------------------------------------------------------------------

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

    private function thresholdConfig(): array
    {
        return [
            'standard'      => DeviceTempThresholdConstants::STANDARD,
            'pl3'           => DeviceTempThresholdConstants::PL3,
            'pl3_locations' => DeviceTempThresholdConstants::PL3_LOCATIONS,
        ];
    }
}
