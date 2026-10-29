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
            'devices' => Device::with('thresholdProfile')
                ->whereNotIn('location', [
                    'PL3 Line 3 Ω2',
                    'PL3 Line 3 Ω1',
                    'ADLT PMC',
                    'Legacy PMC',
                ])
                ->orderBy('location')
                ->get(),
        ]);
    }

    public function indexMap()
    {
        return Inertia::render('DashboardMap', [
            'devices' => Device::with('thresholdProfile')
                ->whereNotIn('location', [
                    'PL3 Line 3 Ω2',
                    'PL3 Line 3 Ω1',
                    'ADLT PMC',
                    'Legacy PMC',
                ])
                ->orderBy('location')
                ->get(),
        ]);
    }

    public function facilityIndex()
    {
        return Inertia::render('Dashboard', [
            'devices' => Device::with('thresholdProfile')->orderBy('location')->get(),
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

        $device = Device::with('thresholdProfile')->find($request->device_id);
        $outOfRange = $device->isTempBreached($request->temp) || $device->isRhBreached($request->rh);

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
}
