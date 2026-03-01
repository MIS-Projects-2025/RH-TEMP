<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use App\Models\ChecklistItemSchedule;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ChecklistItemSchedulesController extends Controller
{
  public function index(Request $request)
  {
    $checklistItemSchedules = ChecklistItemSchedule::query()
      ->with('schedule', 'checklistItem')
      ->get();

    if ($request->wantsJson()) {
      return response()->json([
        'checklistItemSchedules' => $checklistItemSchedules,
      ]);
    }

    return Inertia::render('ChecklistItemScheduleList', [
      'checklistItemSchedules' => $checklistItemSchedules,
    ]);
  }

  private function validateEntry(Request $request, $id = null)
  {
    return $request->validate(
      [
        'schedule_id' => 'required|integer|exists:schedules,id',
        'checklist_item_id' => [
          'required',
          'integer',
          'exists:checklist_items,id',
          Rule::unique((new ChecklistItemSchedule())->getTable())->where(function ($query) use ($request) {
            return $query->where('checklist_item_id', $request->checklist_item_id);
          })->ignore($id),
        ],
      ],
      [
        'schedule_id.exists' =>
        'The selected schedule was not found. Please double-check and try again.',
        'checklist_item_id.exists' =>
        'The selected checklist item was not found. Please double-check and try again.',
        'checklist_item_id.unique' =>
        'This checklist item already has schedule assigned. Please choose a different checklist item.',
      ],
    );
  }

  public function store(Request $request)
  {
    $validated = $this->validateEntry($request);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $entry = ChecklistItemSchedule::create([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'ChecklistItemSchedule created successfully',
      'data'    => $entry,
    ], 201);
  }

  public function upsert($id = null)
  {
    $item = $id ? ChecklistItemSchedule::findOrFail($id) : null;

    return Inertia::render('ChecklistItemScheduleUpsert', [
      'toBeEdit' => $item,
    ]);
  }

  public function update(Request $request, $id)
  {

    $user_id = session('emp_data')['emp_id'] ?? null;

    try {
      $item = ChecklistItemSchedule::findOrFail($id);
      $validated = $this->validateEntry($request, $id);
      $item->update([
        ...$validated,
        'modified_by' => $user_id,
        'modified_at' => Carbon::now(),
      ]);

      return response()->json([
        'message' => 'ChecklistItemSchedule updated successfully',
        'data'    => $item,
      ]);
    } catch (ModelNotFoundException $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'ChecklistItemSchedule not found. Please verify the ID.',
      ], 404);
    }
  }

  public function destroy($id)
  {
    try {
      $item = ChecklistItemSchedule::findOrFail($id);
      $item->delete();

      return response()->json([
        'success' => true,
        'message' => 'ChecklistItemSchedule deleted successfully',
      ]);
    } catch (ModelNotFoundException $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'ChecklistItemSchedule not found. Please verify the ID.',
      ], 404);
    }
  }
}
