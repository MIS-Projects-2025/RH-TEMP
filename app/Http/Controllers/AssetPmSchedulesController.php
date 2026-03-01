<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\AssetPmSchedule;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use App\Traits\MassDeletesByIds;
use Exception;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Services\BulkUpserter;

class AssetPmSchedulesController extends Controller
{
  use MassDeletesByIds;

  public function index(Request $request)
  {
    $search = $request->input('search', '');
    $perPage = $request->input('perPage', 30);
    $totalEntries = AssetPmSchedule::count();

    $assetPmSchedules = AssetPmSchedule::query()
      ->with(['assets.location', 'schedule'])
      ->when($search, function ($query, $search) {
        $query->whereHas('assets', fn($q) => $q->where('code', 'like', "%{$search}%"));
      })
      // ->join('assets', 'assets.id', '=', 'asset_pm_schedules.asset_id') // assuming asset_id foreign key
      // ->orderBy('assets.code')
      // ->select('asset_pm_schedules.*') // important to avoid ambiguous columns
      ->paginate($perPage)
      ->withQueryString();

    if ($request->wantsJson()) {
      return response()->json([
        'assetPmSchedules' => $assetPmSchedules,
        'search' => $search,
        'perPage' => $perPage,
        'totalEntries' => $totalEntries,
      ]);
    }

    return Inertia::render('AssetPmScheduleList', [
      'assetPmSchedules' => $assetPmSchedules,
      'search' => $search,
      'perPage' => $perPage,
      'totalEntries' => $totalEntries,
    ]);
  }

  private function rules($id, $asset_id)
  {
    return [
      'asset_id' => [
        'required',
        'integer',
        'exists:assets,id',
      ],
      'schedule_id' => [
        'required',
        'integer',
        Rule::unique('entity_asset_pm_schedules')
          ->where(function ($query) use ($asset_id) {
            return $query->where('asset_id', $asset_id);
          })
          ->ignore($id),
      ],
    ];
  }

  private function params()
  {
    return [
      'asset_id.exists' =>
      'The selected asset was not found. Please double-check and try again.',
      'schedule_id.unique' =>
      'This combination of schedule id and asset id already exists.',
    ];
  }

  private function validateEntry(Request $request, $id = null)
  {
    return $request->validate(
      self::rules($id, $request->asset_id),
      self::params()
    );
  }

  private function assetRules($id = null, $asset_id)
  {
    return self::rules($id, $asset_id);
  }

  public function massGenocide(Request $request)
  {
    return $this->massDeleteByIds(
      $request,
      AssetPmSchedule::class
    );
  }

  public function bulkUpdate(Request $request)
  {
    $rows = $request->all();
    $user = session('emp_data');

    $columnRules = [
      'asset_id' => fn($id) => [
        'required',
        'int',
        Rule::unique('assets', 'code')
          ->ignore(is_numeric($id) ? $id : null),
      ],
      'schedule_id' => fn($id) => [
        'required',
        'int',
        Rule::exists('schedules', 'id'),
      ],
    ];

    $rows = array_map(function ($row) use ($user) {
      $row['modified_by'] = $user['emp_id'] ?? null;
      return $row;
    }, $rows);

    $bulkUpdater = new BulkUpserter(new AssetPmSchedule(), $columnRules, [], []);

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

  // public function bulkUpdate(Request $request)
  // {
  //   $rows = $request->all();
  //   $user = session('emp_data');

  //   $updateData = [];
  //   $insertData = [];

  //   foreach ($rows as $key => $entry) {

  //     $row = [
  //       'asset_id' => $entry['assets']['id'] ?? null,
  //       'schedule_id' => $entry['schedule']['id'] ?? null,
  //     ];

  //     $id = is_numeric($key) ? $key : null;

  //     $validator = Validator::make(
  //       $row,
  //       $this->assetRules($id, $row['asset_id'] ?? null),
  //       $this->params()
  //     );

  //     if ($validator->fails()) {
  //       return response()->json([
  //         'status' => 'validation_error',
  //         'row' => $key,
  //         'errors' => $validator->errors(),
  //         'message' => $validator->errors()->first(),
  //       ], 422);
  //     }

  //     if ($id) {
  //       $row['id'] = $id;
  //       $updateData[] = $row;
  //     } else {
  //       $insertData[] = $row;
  //     }
  //   }
  //   // Log::info("insertdata: ", $insertData);

  //   try {
  //     DB::transaction(function () use (
  //       $insertData,
  //       $updateData,
  //       $rows,
  //       $user
  //     ) {
  //       AssetPmSchedule::upsert(
  //         array_map(fn($row) => array_merge($row, [
  //           'modified_by' => $user['emp_id'] ?? null,
  //           'modified_at' => Carbon::now(),
  //         ]), $updateData),
  //         ['id'],
  //         ['asset_id', 'schedule_id', 'modified_by', 'modified_at']
  //       );

  //       AssetPmSchedule::insert(
  //         array_map(fn($row) => array_merge($row, [
  //           'modified_by' => $user['emp_id'] ?? null,
  //           'modified_at' => Carbon::now(),
  //         ]), $insertData)
  //       );
  //     });
  //   } catch (Exception $e) {
  //     return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
  //   }

  //   return response()->json(['status' => 'ok']);
  // }

  public function store(Request $request)
  {
    $validated = $this->validateEntry($request);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $entry = AssetPmSchedule::create([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'AssetPmSchedule created successfully',
      'data'    => $entry,
    ], 201);
  }

  public function upsert($id = null)
  {
    $item = $id ? AssetPmSchedule::findOrFail($id) : null;

    return Inertia::render('AssetPmScheduleUpsert', [
      'toBeEdit' => $item,
    ]);
  }

  public function update(Request $request, $id)
  {
    $item = AssetPmSchedule::findOrFail($id);

    $validated = $this->validateEntry($request, $id);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $item->update([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'AssetPmSchedule updated successfully',
      'data'    => $item,
    ]);
  }

  public function destroy($id)
  {
    try {
      $item = AssetPmSchedule::findOrFail($id);
      $item->delete();

      return response()->json([
        'success' => true,
        'message' => 'AssetPmSchedule deleted successfully',
      ]);
    } catch (ModelNotFoundException $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'AssetPmSchedule not found. Please verify the ID.',
      ], 404);
    }
  }
}
