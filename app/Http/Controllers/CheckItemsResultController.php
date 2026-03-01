<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\CheckItem;
use App\Models\ChecklistInstance;
use App\Models\ChecklistItemResult;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckItemsResultController extends Controller
{
  public function recordResult(Request $request)
  {
    // Validate request
    $validated = $request->validate([
      'asset_id' => 'required|integer|exists:assets,id',
      'checklist_id' => 'required|integer|exists:checklists,id',
      'notes' => 'nullable|string|max:1000',
      'items' => 'required|array|min:1',
      'items.*.checklist_item_id' => 'required|integer|exists:checklist_items,id',
      'items.*.item_status' => 'nullable|string',
      'items.*.remarks' => 'nullable|string|max:500',
    ]);

    $assetId = $validated['asset_id'];
    $checklistId = $validated['checklist_id'];
    $notes = $validated['notes'] ?? null;
    $items = $validated['items'];
    $user_id = session('emp_data')['emp_id'] ?? null;
    $checkedBy = $user_id;

    $checklistInstance = ChecklistInstance::create([
      'checklist_id' => $checklistId,
      'created_by' => $checkedBy,
      'notes' => $notes,
    ]);

    $checklistInstanceId = $checklistInstance->id;

    $insertData = array_map(function ($item) use ($assetId, $checklistInstanceId, $checkedBy) {
      return [
        'asset_id' => $assetId,
        'checklist_instance_id' => $checklistInstanceId,
        'checked_by' => $checkedBy,
        'checklist_item_id' => $item['checklist_item_id'],
        'item_status' => $item['item_status'],
        'remarks' => $item['remarks'] ?? null,
      ];
    }, array_filter($items, function ($item) {
      // Ignore empty items
      return isset($item['item_status']) && trim($item['item_status']) !== '';
    }));

    ChecklistItemResult::insert($insertData);

    return response()->json(['status' => 'ok']);
  }


  public function index(Request $request)
  {
    $search = $request->input('search', '');
    $perPage = $request->input('perPage', 100);
    $totalEntries = CheckItem::count();

    $checkItems = CheckItem::query()
      ->when($search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->orWhere('name', 'like', "%{$search}%");
        });
      })
      ->orderBy('name')
      ->paginate($perPage)
      ->withQueryString();

    if ($request->wantsJson()) {
      return response()->json([
        'checkItems' => $checkItems,
        'search' => $search,
        'perPage' => $perPage,
        'totalEntries' => $totalEntries,
      ]);
    }

    return Inertia::render('CheckItemList', [
      'checkItems' => $checkItems,
      'search' => $search,
      'perPage' => $perPage,
      'totalEntries' => $totalEntries,
    ]);
  }


  public function getAllCheckItems(Request $request)
  {
    $checklistID = $request->input('checklist_id');

    return CheckItem::where('checklist_id', $checklistID)->get();
  }

  private function validateEntry(Request $request, $id = null)
  {
    return $request->validate(
      [
        'name'      => 'required|string|max:255',
        'description' => 'nullable|string',
      ],
    );
  }

  public function bulkUpdate(Request $request)
  {
    $rows = $request->all();
    $user = session('emp_data');
    Log::info("rows: " . json_encode($rows));

    DB::transaction(function () use ($rows, $user) {

      foreach ($rows as $id => $fields) {

        if (empty($fields)) {
          continue;
        }

        $model = CheckItem::find($id);

        if (!$model) {
          continue;
        }

        $updateData = [];

        foreach ($fields as $column => $value) {
          $updateData[$column] = $value;
        }

        $updateData['modified_by'] = $user['emp_id'] ?? null;
        Log::info("UPDATE DATA: " . json_encode($updateData));

        if (!empty($updateData)) {
          $model->update($updateData);
        }
      }
    });

    return response()->json(['status' => 'ok']);
  }

  public function store(Request $request)
  {
    $validated = $this->validateEntry($request);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $entry = CheckItem::create([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'Check Item created successfully',
      'data'    => $entry,
    ], 201);
  }

  public function upsert($id = null)
  {
    $item = $id ? CheckItem::findOrFail($id) : null;

    return Inertia::render('CheckItemUpsert', [
      'toBeEdit' => $item,
    ]);
  }

  public function update(Request $request, $id)
  {
    $item = CheckItem::findOrFail($id);

    $validated = $this->validateEntry($request, $id);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $item->update([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'Check Item updated successfully',
      'data'    => $item,
    ]);
  }

  public function destroy($id)
  {
    try {
      $item = CheckItem::findOrFail($id);
      $item->delete();

      return response()->json([
        'success' => true,
        'message' => 'Check Item deleted successfully',
      ]);
    } catch (ModelNotFoundException $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'Check Item not found. Please verify the ID.',
      ], 404);
    }
  }
}
