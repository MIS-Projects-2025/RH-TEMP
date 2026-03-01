<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\ChecklistItem;
use App\Models\Employee;
use Illuminate\Validation\Rule;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;
use App\Traits\MassDeletesByIds;
use App\Constants\DueScheduleQuery;
use App\Services\BulkUpserter;
use App\Models\Checklist;

class ChecklistItemsController extends Controller
{
  use MassDeletesByIds;

  public function index(Request $request)
  {
    $allChecklists = Checklist::all();
    $selectedChecklistId = $request->input('checklist_id', $allChecklists->first()?->id);
    Log::info("selectedChecklistId: " . $selectedChecklistId);
    $selectedChecklist = Checklist::with('checklistItems.item')->find($selectedChecklistId);

    if ($request->wantsJson()) {
      return response()->json([
        'checklists' => $allChecklists,
        'selectedChecklist' => $selectedChecklist
      ]);
    }

    return Inertia::render('ChecklistItemList', [
      'checklists' => $allChecklists,
      'selectedChecklist' => $selectedChecklist
    ]);
  }

  public function getAllCheckItems(Request $request)
  {
    $checklistID = $request->input('checklist_id');

    return ChecklistItem::where('checklist_id', $checklistID)
      // ->select('criteria')
      // ->with(['item', 'schedule:id,schedule_name'])
      ->with(['item', 'schedule'])
      ->get();
  }

  private function validateEntry(Request $request, $id = null)
  {
    return $request->validate(
      [
        'checklist_id' => 'required|integer|exists:checklists,id',
        'item_id'      => 'required|integer',
        'criteria'     => [
          'required',
          'string',
          'max:255',
          Rule::unique('checklist_items')
            ->where(
              fn($q) => $q
                ->where('checklist_id', $request->checklist_id)
                ->where('item_id', $request->item_id)
            )
            ->ignore($id),
        ]
      ],
      [
        'criteria.unique' =>
        'This combination of checklist, item, and criteria already exists.',
        'checklist_id.exists' =>
        'The selected checklist was not found. Please double-check and try again.',
      ],
    );
  }

  public function massGenocide(Request $request)
  {
    Log::info("Fjlaksjdfklsdajflsdjlsjfljdflsdjfldjfldj");

    return $this->massDeleteByIds(
      $request,
      ChecklistItem::class
    );
  }

  public function getScheduledCheckItems(Request $request)
  {
    $assetId = $request->input('assetId');
    $checklistId = $request->input('checklistId');

    $latestResults = DB::table('checklist_item_results')
      ->select(
        'checklist_item_id',
        'asset_id',
        DB::raw('MAX(checked_at) as checked_at')
      )
      ->where('asset_id', $assetId)
      ->groupBy('checklist_item_id', 'asset_id');

    $query =
      ChecklistItem::query()
      ->from('checklist_items as ci')
      ->select([
        'ci.id',
        'i.name',
        'ci.item_id',
        'ci.input_type',
        'ci.allowed_values',
        'cs.verified_by',
        'cs.created_by',
        'ci.criteria',
        's.schedule_name',
        'cir.checked_at',
        DB::raw("s.id IS NULL as is_no_schedule"),
      ])
      ->addSelect(DueScheduleQuery::dueRaw())
      ->join('check_items as i', 'ci.item_id', '=', 'i.id')
      ->join('checklist_assets as ca', function ($join) use ($assetId) {
        $join->on('ca.checklist_id', '=', 'ci.checklist_id')
          ->where('ca.asset_id', $assetId);
      })
      ->leftjoin('entity_checklist_item_schedules as ecs', 'ecs.checklist_item_id', '=', 'ci.id')
      ->leftjoin('schedules as s', 's.id', '=', 'ecs.schedule_id')
      ->leftJoinSub($latestResults, 'latest', function ($join) {
        $join->on('latest.checklist_item_id', '=', 'ci.id');
      })
      ->leftJoin('checklist_item_results as cir', function ($join) {
        $join->on('cir.checklist_item_id', '=', 'latest.checklist_item_id')
          ->on('cir.asset_id', '=', 'latest.asset_id')
          ->on('cir.checked_at', '=', 'latest.checked_at');
      })
      ->leftJoin('checklist_instances as cs', 'cs.id', '=', 'cir.checklist_instance_id')
      ->where('ci.checklist_id', $checklistId)
      ->orderBy('s.schedule_name')
      ->orderBy('i.name');

    $results = $query->get();

    $verifierIds = $results->pluck('created_by')
      ->filter()
      ->unique();

    $employees = Employee::whereIn('EMPLOYID', $verifierIds)
      ->select('EMPLOYID', 'FIRSTNAME', 'JOB_TITLE', 'LASTNAME')
      ->get()
      ->keyBy('EMPLOYID');


    $results->transform(function ($item) use ($employees) {
      $item->created_by = $employees[$item->created_by] ?? null;
      $item->verified_by = $employees[$item->verified_by] ?? null;
      return $item;
    });

    return response()->json($results);
  }

  public function bulkUpdate(Request $request)
  {
    $rows = $request->all();
    $user = session('emp_data');

    $columnRules = [
      'item_id' => fn($id, $fields) => [
        'required',
        'int',
        Rule::unique('checklist_items', 'item_id')
          ->where('checklist_id', $fields['checklist_id'] ?? null)
          ->ignore($id),
      ],
      // might TODO: checkbox can also be used. So how can you enforced 2 values? another column for checkbox_value?
      'input_type'     => ['required', 'string', Rule::in(['text', 'number', 'select'])],
      'allowed_values' => 'nullable|array',
      'schedule_id' => fn($id) => [
        'sometimes',
        'nullable',
        'int',
        Rule::exists('schedules', 'id'),
      ],
      'checklist_id' => fn($id) => [
        'required',
        'int',
        Rule::exists('checklists', 'id'),
      ]
    ];

    $rows = array_map(function ($row) use ($user) {
      $row['modified_by'] = $user['emp_id'] ?? null;
      return $row;
    }, $rows);

    $bulkUpdater = new BulkUpserter(new ChecklistItem(), $columnRules, [], []);

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

    $entry = ChecklistItem::create([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'Checklist item created successfully',
      'data'    => $entry,
    ], 201);
  }

  public function upsert($id = null)
  {
    $item = $id ? ChecklistItem::findOrFail($id) : null;

    return Inertia::render('ChecklistItemUpsert', [
      'toBeEdit' => $item,
    ]);
  }

  public function update(Request $request, $id)
  {
    $item = ChecklistItem::findOrFail($id);

    $validated = $this->validateEntry($request, $id);
    $user_id = session('emp_data')['emp_id'] ?? null;

    $item->update([
      ...$validated,
      'modified_by' => $user_id,
      'modified_at' => Carbon::now(),
    ]);

    return response()->json([
      'message' => 'Checklist item updated successfully',
      'data'    => $item,
    ]);
  }

  public function destroy($id)
  {
    try {
      $item = ChecklistItem::findOrFail($id);
      $item->delete();

      return response()->json([
        'success' => true,
        'message' => 'Checklist item deleted successfully',
      ]);
    } catch (ModelNotFoundException $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'Checklist item not found. Please verify the ID.',
      ], 404);
    }
  }
}
