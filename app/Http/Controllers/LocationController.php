<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Cache;
use App\Models\Location;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Support\CacheKeys;
use App\Traits\MassDeletesByIds;
use App\Services\BulkUpserter;

class LocationController extends Controller
{
  use MassDeletesByIds;

  public function index(Request $request)
  {
    $search = $request->input('search', '');
    $perPage = $request->input('perPage', 999);
    $totalEntries = Location::count();

    $locations = Location::query()
      ->when($search, function ($query, $search) {
        // todo : add search for performed_by and verified_by using the name
        $query->Where('location_name', 'like', "%{$search}%");
      })
      ->orderBy('location_name')
      ->paginate($perPage)
      ->withQueryString();

    Log::info('locations: ', [$locations]);

    if ($request->wantsJson()) {
      return response()->json([
        'locations' => $locations,
        'search' => $search,
        'perPage' => $perPage,
        'totalEntries' => $totalEntries,
      ]);
    }

    return Inertia::render('LocationList', [
      'locations' => $locations,
      'search' => $search,
      'perPage' => $perPage,
      'totalEntries' => $totalEntries,
    ]);
  }

  private function validateEntry(Request $request, $id = null)
  {
    return $request->validate(
      [
        'location_name' => [
          'required',
          'string',
          'max:255',
          Rule::unique((new Location())->getTable())->where(function ($query) use ($request) {
            return $query->where('location_name', $request->location_name);
          })->ignore($id),
        ],
      ],
      [
        'location_name.unique' =>
        'The location name provided already exists.',
      ]
    );
  }

  public function store(Request $request)
  {
    $validated = $this->validateEntry($request);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $entry = Location::create([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    Cache::forget(CacheKeys::locationsAll());

    return response()->json([
      'message' => 'Location created successfully',
      'data'    => $entry,
    ], 201);
  }

  public function upsert($id = null)
  {
    $item = $id ? Location::findOrFail($id) : null;

    return Inertia::render('LocationUpsert', [
      'toBeEdit' => $item,
    ]);
  }

  public function update(Request $request, $id)
  {
    $item = Location::findOrFail($id);

    $validated = $this->validateEntry($request, $id);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $item->update([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    Cache::forget(CacheKeys::locationsAll());

    return response()->json([
      'message' => 'Location updated successfully',
      'data'    => $item,
    ]);
  }

  public function bulkUpdate(Request $request)
  {
    $rows = $request->all();
    $user = session('emp_data');

    $columnRules = [
      'location_name' => fn($id) => [
        'required',
        'string',
        Rule::unique('locations', 'location_name')
          ->ignore(is_numeric($id) ? $id : null),
      ],
    ];

    $rows = array_map(function ($row) use ($user) {
      $row['modified_by'] = $user['emp_id'] ?? null;
      return $row;
    }, $rows);

    $bulkUpdater = new BulkUpserter(new Location(), $columnRules, [], []);

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

  public function destroy($id)
  {
    try {
      $item = Location::findOrFail($id);
      $item->delete();

      Cache::forget(CacheKeys::locationsAll());
      return response()->json([
        'success' => true,
        'message' => 'Location deleted successfully',
      ]);
    } catch (ModelNotFoundException $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'Location not found. Please verify the ID.',
      ], 404);
    }
  }

  public function massGenocide(Request $request)
  {
    return $this->massDeleteByIds(
      $request,
      Location::class,
      CacheKeys::locationsAll()
    );
  }

  public function getAllLocation(Request $request)
  {

    return Cache::remember(CacheKeys::locationsAll(), CacheKeys::defaultCacheDuration(), function () {
      // return Location::all();
      return Location::select('id', 'location_name')->get();
    });
  }
}
