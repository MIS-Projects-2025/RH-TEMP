<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use App\Models\Asset;
use Illuminate\Validation\Rule;
use App\Models\ChecklistItemResult;
use App\Constants\DueScheduleQuery;

class AssetsService
{
  public function getDueAssetsQuery($checklistId = null)
  {
    $latestChecklistItemResult = ChecklistItemResult::select('checklist_item_id', 'asset_id', DB::raw('MAX(checked_at) as checked_at'))
      ->groupBy('checklist_item_id', 'asset_id');

    $dueCondition = DueScheduleQuery::dueCondition();
    $overdueCondition = DueScheduleQuery::overdueCondition();

    $assetsQuery = Asset::query()
      ->select([
        'assets.*',
        'l.location_name',
        'ca.checklist_id',
        DB::raw('COUNT(ci.id) AS total_items'),
        DB::raw("SUM(CASE WHEN {$dueCondition} THEN 1 ELSE 0 END) AS due_items"),
        DB::raw("SUM(CASE WHEN cir.checked_at IS NOT NULL AND NOT {$dueCondition} THEN 1 ELSE 0 END) AS done_items"),
        DB::raw("SUM(CASE WHEN {$overdueCondition} THEN 1 ELSE 0 END) AS overdue_items"),
      ])
      ->with(['location'])

      ->join('checklist_assets as ca', 'ca.asset_id', '=', 'assets.id')
      ->leftJoin('locations as l', 'l.id', '=', 'assets.location_id') // add this
      ->leftjoin('checklist_items as ci', 'ci.checklist_id', '=', 'ca.checklist_id')
      ->leftjoin('entity_checklist_item_schedules as ecs', 'ecs.checklist_item_id', '=', 'ci.id')
      ->leftjoin('schedules as s', 's.id', '=', 'ecs.schedule_id')

      ->leftJoinSub($latestChecklistItemResult, 'cir', function ($join) {
        $join->on('cir.checklist_item_id', '=', 'ci.id')
          ->on('cir.asset_id', '=', 'assets.id');
      })

      ->when($checklistId, function ($query) use ($checklistId) {
        $query->where('ca.checklist_id', $checklistId);
      })
      ->groupBy('assets.id', 'ca.checklist_id');

    return $assetsQuery;
  }

  public function getDueAssetsWithItems($checklistId = null)
  {
    return $this->getDueAssetsQuery($checklistId)
      ->with(['checklistItems' => function ($query) use ($checklistId) {
        $query->when($checklistId, fn($q) => $q->where('checklist_id', $checklistId));
      }]);
  }
}
