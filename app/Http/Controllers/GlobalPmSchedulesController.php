<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use App\Models\GlobalPMSchedule;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class GlobalPmSchedulesController extends Controller
{
  public function index(Request $request)
  {
    $globalPMSchedules = GlobalPMSchedule::query()
      ->with('schedule', 'globalPm')
      ->get();

    if ($request->wantsJson()) {
      return response()->json([
        'globalPMSchedules' => $globalPMSchedules,
      ]);
    }

    return Inertia::render('GlobalPmScheduleList', [
      'globalPMSchedules' => $globalPMSchedules,
    ]);
  }

  private function validateEntry(Request $request, $id = null)
  {
    return $request->validate(
      [
        'schedule_id' => 'required|integer|exists:schedules,id',
        'global_pm_id' => [
          'required',
          'integer',
          'exists:global_preventative_maintenances,id',
          Rule::unique((new GlobalPMSchedule())->getTable())->where(function ($query) use ($request) {
            return $query->where('global_pm_id', $request->global_pm_id);
          })->ignore($id),
        ],
      ],
      [
        'schedule_id.exists' =>
        'The selected schedule was not found. Please double-check and try again.',
        'global_pm_id.exists' =>
        'The selected global PM was not found. Please double-check and try again.',
        'global_pm_id.unique' =>
        'This global PM already has schedule assigned. Please choose a different global PM.',
      ],
    );
  }

  public function store(Request $request)
  {
    $validated = $this->validateEntry($request);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $entry = GlobalPMSchedule::create([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'GlobalPMSchedule created successfully',
      'data'    => $entry,
    ], 201);
  }

  public function upsert($id = null)
  {
    $item = $id ? GlobalPMSchedule::findOrFail($id) : null;

    return Inertia::render('GlobalPmScheduleUpsert', [
      'toBeEdit' => $item,
    ]);
  }

  public function update(Request $request, $id)
  {
    $item = GlobalPMSchedule::findOrFail($id);

    $validated = $this->validateEntry($request, $id);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $item->update([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'GlobalPMSchedule updated successfully',
      'data'    => $item,
    ]);
  }

  public function destroy($id)
  {
    try {
      $item = GlobalPMSchedule::findOrFail($id);
      $item->delete();

      return response()->json([
        'success' => true,
        'message' => 'GlobalPMSchedule deleted successfully',
      ]);
    } catch (ModelNotFoundException $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'GlobalPMSchedule not found. Please verify the ID.',
      ], 404);
    }
  }
}
