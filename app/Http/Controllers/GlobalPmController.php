<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use App\Models\GlobalPm;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class GlobalPmController extends Controller
{
  public function index(Request $request)
  {
    $globalPMs = GlobalPm::query()
      ->get();

    if ($request->wantsJson()) {
      return response()->json([
        'globalPMs' => $globalPMs,
      ]);
    }

    return Inertia::render('GlobalPmList', [
      'globalPMs' => $globalPMs,
    ]);
  }

  private function validateEntry(Request $request, $id = null)
  {
    return $request->validate(
      [
        'maintenance_name' => [
          'required',
          'string',
          'max:255',
          Rule::unique((new GlobalPm())->getTable())->where(function ($query) use ($request) {
            return $query->where('maintenance_name', $request->maintenance_name);
          })->ignore($id),
        ],
        'maintenance_description' => 'nullable|string',
      ],
      [
        'maintenance_name.unique' =>
        'The maintenance name provided already exists.',

      ]
    );
  }

  public function store(Request $request)
  {
    $validated = $this->validateEntry($request);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $entry = GlobalPm::create([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'Preventative Maintenance created successfully',
      'data'    => $entry,
    ], 201);
  }

  public function upsert($id = null)
  {
    $item = $id ? GlobalPm::findOrFail($id) : null;

    return Inertia::render('GlobalPmUpsert', [
      'toBeEdit' => $item,
    ]);
  }

  public function update(Request $request, $id)
  {
    $item = GlobalPm::findOrFail($id);

    $validated = $this->validateEntry($request, $id);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $item->update([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'Preventative Maintenance updated successfully',
      'data'    => $item,
    ]);
  }

  public function destroy($id)
  {
    try {
      $item = GlobalPm::findOrFail($id);
      $item->delete();

      return response()->json([
        'success' => true,
        'message' => 'Preventative Maintenance deleted successfully',
      ]);
    } catch (ModelNotFoundException $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'Preventative Maintenance not found. Please verify the ID.',
      ], 404);
    }
  }
}
