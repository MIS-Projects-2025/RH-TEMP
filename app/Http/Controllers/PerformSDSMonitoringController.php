<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Chemicals;
use App\Models\ChemicalSDS;
use App\Models\ChemicalSDSMonitoringInstance;
use Inertia\Inertia;

class PerformSDSMonitoringController extends Controller
{
    public function index(Request $request)
    {
        $chemicals = Chemicals::all();

        return Inertia::render('PerformChemicalSDSPage', [
            'chemicals' => $chemicals
        ]);
    }

    public function recordResult(Request $request)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.status' => 'required|string',
            'items.*.remarks' => 'nullable|string|max:500',
            'items.*.chemical_id' => 'required|integer|exists:chemicals,id',
        ]);

        $notes = $validated['notes'] ?? null;
        $chemical_sds = $validated['items'];
        $user_id = session('emp_data')['emp_id'] ?? null;
        $checkedBy = $user_id;

        $checklistInstance = ChemicalSDSMonitoringInstance::create([
            'created_by' => $checkedBy,
            'notes' => $notes,
        ]);

        $checklistInstanceId = $checklistInstance->id;

        $insertData = array_map(function ($item) use ($checklistInstanceId, $checkedBy) {
            return [
                'chemical_id' => $item['chemical_id'],
                'checked_by' => $checkedBy,
                'status' => $item['status'],
                'remarks' => $item['remarks'] ?? null,
                'chemical_sds_id' => $checklistInstanceId
            ];
        }, $chemical_sds);

        ChemicalSDS::insert($insertData);

        return response()->json(['status' => 'ok']);
    }
}
