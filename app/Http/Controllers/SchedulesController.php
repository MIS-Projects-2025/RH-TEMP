<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\Schedule;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class SchedulesController extends Controller
{
  public function index(Request $request)
  {
    $schedules = Schedule::query()->get();

    if ($request->wantsJson()) {
      return response()->json([
        'schedules' => $schedules,
      ]);
    }

    return Inertia::render('SchedulesList', [
      'schedules' => $schedules,
    ]);
  }

  private function validateEntry(Request $request, $id = null)
  {
    return $request->validate(
      [
        'recurrence_type' => 'required|string|max:10',
        'schedule_name' => 'required|string|max:255',
        'schedule_description' => 'nullable|string',
        'interval_unit' => 'nullable|integer',
        'interval_value' => 'nullable|integer',
        'days_of_week' => 'nullable|array',
        'days_of_month' => 'nullable|array',
        'nth_weekday' => 'nullable|integer',
        'weekday_of_month' => 'nullable|integer',
        'months' => 'nullable|array',
        'day_times' => 'nullable|array',
      ],
    );
  }

  public function store(Request $request)
  {
    $validated = $this->validateEntry($request);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $entry = Schedule::create([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'Schedule created successfully',
      'data'    => $entry,
    ], 201);
  }

  public function upsert($id = null)
  {
    $item = $id ? Schedule::findOrFail($id) : null;

    return Inertia::render('ScheduleUpsert', [
      'toBeEdit' => $item,
    ]);
  }

  public function update(Request $request, $id)
  {
    $item = Schedule::findOrFail($id);

    $validated = $this->validateEntry($request, $id);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $item->update([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'Schedule updated successfully',
      'data'    => $item,
    ]);
  }

  public function destroy($id)
  {
    try {
      $item = Schedule::findOrFail($id);
      $item->delete();

      return response()->json([
        'success' => true,
        'message' => 'Schedule deleted successfully',
      ]);
    } catch (ModelNotFoundException $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'Schedule not found. Please verify the ID.',
      ], 404);
    }
  }
}
