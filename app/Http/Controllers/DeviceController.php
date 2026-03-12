<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Status;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DeviceController extends Controller
{
    public function index()
    {
        return Inertia::render('Devices/Index', [
            'devices' => Device::orderBy('location')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ip'       => ['required', 'unique:devices,ip'],
            'location' => ['required', 'string', 'max:255'],
        ]);

        Device::create($validated);

        return redirect()->route('devices.index')->with('success', "{$validated['ip']} successfully added");
    }

    public function update(Request $request, Device $device)
    {
        $validated = $request->validate([
            'ip'       => ['required', Rule::unique('devices', 'ip')->ignore($device->id)],
            'location' => ['required', 'string', 'max:255'],
        ]);

        $device->update($validated);

        return redirect()->route('devices.index')->with('success', "{$device->ip} successfully updated");
    }

    public function destroy(Device $device)
    {
        $device->delete();

        return redirect()->route('devices.index')->with('success', "{$device->ip} successfully removed");
    }

    public function export(Request $request): StreamedResponse
    {
        $request->validate([
            'from' => ['required', 'date'],
            'to'   => ['required', 'date', 'after_or_equal:from'],
        ]);

        $statuses = Status::with('device')
            ->where('is_recording', false)
            ->whereBetween('created_at', [
                $request->from . ' 00:00:00',
                $request->to   . ' 23:59:59',
            ])
            ->get();

        $filename = 'failed_rh_temp_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($statuses) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Device IP', 'Location', 'RH', 'Temp', 'Is Recording', 'Recorded At']);
            foreach ($statuses as $s) {
                fputcsv($handle, [
                    $s->device->ip       ?? 'N/A',
                    $s->device->location ?? 'N/A',
                    $s->rh,
                    $s->temp,
                    $s->is_recording ? 'Yes' : 'No',
                    $s->created_at,
                ]);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
