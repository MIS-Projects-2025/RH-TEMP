<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\ChecklistAssets;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Middleware\ValidatePathEncoding;
use Illuminate\Support\Facades\Validator;
use App\Models\Checklist;
use App\Traits\MassDeletesByIds;
use App\Services\BulkUpserter;
use App\Traits\HasUniqueCombinationRule;
use App\Models\Asset;

class ChecklistAssetsController extends Controller
{
  use MassDeletesByIds;
  use HasUniqueCombinationRule;

  public function index(Request $request)
  {
    $search = $request->input('search', '');
    $perPage = $request->input('perPage', 30);
    $checklistId = $request->input('checklistId', null); // optional filter
    $totalEntries = ChecklistAssets::count();

    if (!$checklistId) {
      $checklistId = Checklist::first()->id;
    }

    $checklistAssetsQuery = ChecklistAssets::query()
      ->with(['asset', 'checklist'])
      // $assetsQuery = ChecklistAssets::query()
      ->when($search, function ($query, $search) {
        $query->whereHas('asset', fn($q) => $q->where('code', 'like', "%{$search}%"));
      })
      //   // optional checklist filter
      ->when($checklistId, function ($query) use ($checklistId) {
        $query->where(function ($q) use ($checklistId) {
          $q->where('checklist_id', $checklistId);
        });
      });

    // paginated result
    $checklistAssets = $checklistAssetsQuery->paginate($perPage);

    if ($request->wantsJson()) {
      return response()->json([
        'assets' => $checklistAssets,
        'search' => $search,
        'perPage' => $perPage,
        'checklistId' => $checklistId,
        'totalEntries' => $totalEntries,
      ]);
    }

    Log::info('assets: ', [$checklistAssets]);
    return Inertia::render('ChecklistAssetList', [
      'assets' => $checklistAssets,
      'search' => $search,
      'perPage' => $perPage,
      'checklistId' => $checklistId,
      'totalEntries' => $totalEntries,
    ]);
  }

  public function getAllAssets(Request $request)
  {
    $checklistID = $request->input('checklist_id');

    return ChecklistAssets::where('checklist_id', $checklistID)
      ->with(['location'])
      ->get();
  }

  private function rules($id, $asset_id)
  {
    return [
      'asset_id' => [
        'required',
        'integer',
        'exists:assets,id',
      ],
      'checklist_id' => [
        'required',
        'integer',
        Rule::unique('checklist_assets')
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
      'The selected checklist was not found. Please double-check and try again.',
      'checklist_id.unique' =>
      'This combination of checklist id and asset id already exists.',
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
      ChecklistAssets::class
    );
  }

  public function bulkUpdate(Request $request)
  {
    $rows = $request->all();
    $user = session('emp_data');

    $columnRules = [
      'asset_id' => fn($id, $fields) => [
        'required',
        'integer',
        'exists:assets,id',
        $this->uniqueCombinationRule('checklist_assets', ['checklist_id'], Checklist::class)($id, $fields),
      ],
      'checklist_id' => fn($id, $fields) => [
        'required',
        'integer',
        $this->uniqueCombinationRule('checklist_assets', ['asset_id'], Asset::class)($id, $fields),
      ],
    ];

    $rows = array_map(function ($row) use ($user) {
      $row['modified_by'] = $user['emp_id'] ?? null;
      return $row;
    }, $rows);

    $bulkUpdater = new BulkUpserter(new ChecklistAssets(), $columnRules, [], []);

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

  public function store(Request $request)
  {
    $validated = $this->validateEntry($request);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $entry = ChecklistAssets::create([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'Asset created successfully',
      'data'    => $entry,
    ], 201);
  }

  public function upsert($id = null)
  {
    $item = $id ? ChecklistAssets::findOrFail($id) : null;

    return Inertia::render('AssetUpsert', [
      'toBeEdit' => $item,
    ]);
  }

  public function update(Request $request, $id)
  {
    $item = ChecklistAssets::findOrFail($id);

    $validated = $this->validateEntry($request, $id);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $item->update([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'Asset updated successfully',
      'data'    => $item,
    ]);
  }

  public function destroy($id)
  {
    try {
      $item = ChecklistAssets::findOrFail($id);
      $item->delete();

      return response()->json([
        'success' => true,
        'message' => 'Asset deleted successfully',
      ]);
    } catch (ModelNotFoundException $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'Asset not found. Please verify the ID.',
      ], 404);
    }
  }
}
