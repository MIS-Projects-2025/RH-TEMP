<?php

namespace App\Http\Controllers;

use App\Traits\ValidateEmployeeExistenceTrait;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\HazardousWasteTurnOverLogSheet as HazardWaste;
use Illuminate\Validation\Rule;
use App\Services\BulkUpserter;

class HazardousWasteTurnOverLogSheetController extends Controller
{
  use ValidateEmployeeExistenceTrait;

  public function index(Request $request)
  {
    $search = $request->input('search', '');
    $perPage = $request->input('perPage', 10);
    $totalEntries = HazardWaste::count();

    $hazardousWaste = HazardWaste::query()
      // ->with([
      //   'requestor:EMPLOYID,EMPNAME,JOB_TITLE,DEPARTMENT',
      // ])
      ->when($search, function ($query, $search) {
        // todo : add search for performed_by and verified_by using the name
        $query->where(function ($q) use ($search) {
          $q->orWhere('requestor', 'like', "%{$search}%");
          $q->orWhere('id', 'like', "%{$search}%");
        });
      })
      ->orderBy('date', 'desc')
      ->paginate($perPage)
      ->withQueryString();

    Log::info("utilityTrash: ", [$hazardousWaste]);

    return Inertia::render('HazardousWasteLogSheetList', [
      'hazardousWaste' => $hazardousWaste,
      'search' => $search,
      'perPage' => $perPage,
      'totalEntries' => $totalEntries,
    ]);
  }

  public function bulkUpdate(Request $request)
  {
    $rows = $request->all();
    $user = session('emp_data');

    $columnRules = [
      'reference_no' => fn($id) => [
        'required',
        'string',
        Rule::unique('hazardous_waste_material_turn_over_logsheet', 'reference_no')
          ->ignore($id),
      ],
      'requestor' => [
        'required',
        'int',
      ],
    ];

    $rows = array_map(function ($row) use ($user) {
      $row['modified_by'] = $user['emp_id'] ?? null;
      return $row;
    }, $rows);

    $bulkUpdater = new BulkUpserter(new HazardWaste(), $columnRules, [], []);

    $result = $bulkUpdater->update($rows ?? null);

    if (!empty($result['errors'])) {
      return response()->json([
        'status' => 'error',
        'message' => 'You have ' . count($result['errors']) . ' error/s',
        'data' => $result['errors']
      ], 422);
    }

    return response()->json([
      'status' => 'ok',
      'message' => 'Updated successfully',
      'updated' => $result['updated']
    ]);
  }

  private function validatePart(Request $request, $id = null)
  {
    return $request->validate([
      'date' => 'required|date',
      'requestor' => 'required|int',
      'reference_no' => 'required|string',
    ]);
  }

  public function store(Request $request)
  {
    $exists = HazardWaste::where('reference_no', $request->reference_no)->exists();

    if ($exists) {
      return response()->json([
        'status' => 'error',
        'message' => 'Reference number already exists',
        'data' => null
      ], 409);
    }

    $this->validateEmployID($request['requestor'], field: 'requestor');

    $validated = $this->validatePart($request);


    $part = HazardWaste::create($validated);

    return response()->json([
      'message' => 'Part added successfully',
      'data' => $part,
    ]);
  }

  public function upsert($reference_no = null)
  {
    Log::info("reference_no: ", [$reference_no]);
    $hazardWasteToBeEdit = $reference_no ? HazardWaste::findOrFail($reference_no) : null;
    Log::info("hazardWasteToBeEdit: ", [$hazardWasteToBeEdit]);

    return Inertia::render('HazardousWasteUpsert', [
      'hazardWasteToBeEdit' => $hazardWasteToBeEdit,
    ]);
  }

  public function update(Request $request, $reference_no)
  {
    $hazardWaste = HazardWaste::findOrFail($reference_no);
    Log::info("reference_no: ", [$reference_no]);

    $validated = $this->validatePart($request, $reference_no);
    Log::info("validated: ", [$validated]);
    $empId = session('emp_data.emp_id');

    if (!$empId) {
      return response()->json([
        'status' => 'error',
        'message' => 'User not authenticated',
        'data' => null
      ], 401);
    }

    $this->validateEmployID($validated['requestor'], field: 'requestor');

    $hazardWaste->update($validated);

    return response()->json([
      'message' => 'Entry updated successfully',
      'data' => $hazardWaste,
    ]);
  }

  public function destroy($reference_no)
  {
    $part = HazardWaste::findOrFail($reference_no);
    $part->delete();

    return response()->json([
      'success' => true,
      'message' => 'Entry deleted successfully',
    ]);
  }
}
