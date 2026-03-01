<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Asset;
use App\Services\AssetsService;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Validator;
use App\Traits\MassDeletesByIds;
use App\Constants\DueScheduleQuery;
use App\Services\BulkUpserter;

class AssetsController extends Controller
{
  use MassDeletesByIds;
  protected $assetsService;
  public function __construct(AssetsService $assetsService)
  {
    $this->assetsService = $assetsService;
  }

  public function index(Request $request)
  {
    $search = $request->input('search', '');
    $perPage = $request->input('perPage', 100);
    $totalEntries = Asset::count();

    $assets = Asset::query()
      ->with(['location'])
      ->when($search, function ($query, $search) {
        // todo : add search for performed_by and verified_by using the name
        $query->Where('code', 'like', "%{$search}%");
      })
      ->orderBy('code')
      ->paginate($perPage)
      ->withQueryString();

    if ($request->wantsJson()) {
      return response()->json([
        'assets' => $assets,
        'search' => $search,
        'perPage' => $perPage,
        'totalEntries' => $totalEntries,
      ]);
    }

    return Inertia::render('AssetList', [
      'assets' => $assets,
      'search' => $search,
      'perPage' => $perPage,
      'totalEntries' => $totalEntries,
    ]);
  }

  public function getDueAssets(Request $request)
  {
    $search = $request->input('search', '');
    $perPage = $request->input('perPage', 30);
    $checklistId = $request->input('checklistId', null);
    $totalEntries = Asset::count();

    $query = $this->assetsService->getDueAssetsQuery($checklistId)
      ->when($search !== '', function ($query) use ($search) {
        $query->where(function ($q) use ($search) {
          $q->where('code', 'like', "%{$search}%");
        });
      });

    if ($perPage == -1) {
      $assets = $query->get();
    } else {
      $assets = $query->paginate($perPage);
    }

    if ($request->wantsJson()) {
      return response()->json([
        'assets' => $assets,
        'search' => $search,
        'perPage' => $perPage,
        'checklistId' => $checklistId,
        'totalEntries' => $totalEntries,
      ]);
    }

    Log::info('assets: ', [$assets]);
    return Inertia::render('AssetList', [
      'assets' => $assets,
      'search' => $search,
      'perPage' => $perPage,
      'checklistId' => $checklistId,
      'totalEntries' => $totalEntries,
    ]);
  }

  public function getAllAssets(Request $request)
  {
    $checklistID = $request->input('checklist_id');

    return Asset::where('checklist_id', $checklistID)
      ->with(['location'])
      ->get();
  }

  private function validateEntry(Request $request, $id = null)
  {
    return $request->validate(
      [
        'location_id' => 'nullable|integer|exists:locations,id',
        'code'      => [
          'required',
          'string',
          'max:120',
          Rule::unique('assets')->where(function ($query) use ($request) {
            return $query->where('code', $request->code);
          })->ignore($id),
        ],
        'properties' => 'nullable|array',
      ],
      [
        'checklist_id.exists' =>
        'The selected checklist was not found. Please double-check and try again.',
        'code.unique' =>
        'The code provided already exists.',
      ],
    );
  }

  public function massGenocide(Request $request)
  {
    return $this->massDeleteByIds(
      $request,
      Asset::class
    );
  }

  public function bulkUpdate(Request $request)
  {
    $rows = $request->all();
    $user = session('emp_data');

    $columnRules = [
      'code' => fn($id) => [
        'sometimes',
        'required',
        'string',
        Rule::unique('assets', 'code')
          ->ignore(is_numeric($id) ? $id : null),
      ],
      'location_id' => fn($id) => [
        'sometimes',
        'required',
        'int',
        Rule::exists('locations', 'id'),
      ],
      'properties' => 'nullable|array',
    ];

    $rows = array_map(function ($row) use ($user) {
      $row['modified_by'] = $user['emp_id'] ?? null;
      return $row;
    }, $rows);

    $bulkUpdater = new BulkUpserter(new Asset(), $columnRules, [], []);

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

    $entry = Asset::create([
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
    $item = $id ? Asset::findOrFail($id) : null;

    return Inertia::render('AssetUpsert', [
      'toBeEdit' => $item,
    ]);
  }

  public function update(Request $request, $id)
  {
    $item = Asset::findOrFail($id);

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
      $item = Asset::findOrFail($id);
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

  public function getDueAssetsWithItems()
  {
    return (new AssetsService())->getDueAssetsWithItems()->get();
  }
}
