<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Restroom;
use App\Models\ChemicalSDS;
use App\Models\RestroomMonitoring;
use App\Models\RestroomMonitoringInstance;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class PerformRestroomMonitoringController extends Controller
{
    public function index(Request $request)
    {
        $restrooms = Restroom::all();

        $selectedRestroomId = $request->input('restroom_id', $restrooms->first()?->id);
        Log::info("selectedRestroomId: " . $selectedRestroomId);
        $selectedRestroom = Restroom::with('fixtures')->find($selectedRestroomId);

        return Inertia::render('PerformRestroomMonitoringPage', [
            'restrooms' => $restrooms,
            'selectedRestroom' => $selectedRestroom ?? null
        ]);
    }

    public function recordResult(Request $request)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.status' => 'required|string',
            'items.*.remarks' => 'nullable|string|max:500',
            'restroom_id' => 'required|integer|exists:restrooms,id',
        ]);

        $notes = $validated['notes'] ?? null;
        $restroom_id = $validated['restroom_id'];
        $fixtures = $validated['items'];
        $user_id = session('emp_data')['emp_id'] ?? null;
        $checkedBy = $user_id;

        $restroomMonitoringInstance = RestroomMonitoringInstance::create([
            'created_by' => $checkedBy,
            'notes' => $notes,
        ]);

        $restroomMonitoringInstanceId = $restroomMonitoringInstance->id;

        $insertData = array_map(function ($item) use ($restroomMonitoringInstanceId, $checkedBy, $restroom_id) {
            return [
                'restroom_id' => $restroom_id,
                'checked_by' => $checkedBy,
                'status' => $item['status'],
                'remarks' => $item['remarks'] ?? null,
                'restroom_monitoring_instance_id' => $restroomMonitoringInstanceId
            ];
        }, $fixtures);

        RestroomMonitoring::insert($insertData);

        return response()->json(['status' => 'ok']);
    }
}
