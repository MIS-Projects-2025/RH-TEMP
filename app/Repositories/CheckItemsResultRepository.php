<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Checklist;
use App\Models\ChecklistItemResult;
use App\Constants\DueScheduleQuery;
use App\Constants\CheckItemStatusDashboard;

class CheckItemsResultRepository
{
  private static function getLatestResults($checklistId, $checkItemNames = [])
  {
    $latestResults = DB::table('checklist_item_results as cir2')
      ->select('cir2.asset_id', 'cir2.checklist_item_id', DB::raw('MAX(cir2.checked_at) as latest_checked'))
      ->join('checklist_items as ci2', 'ci2.id', '=', 'cir2.checklist_item_id')
      ->join('check_items as ct2', 'ct2.id', '=', 'ci2.item_id')
      ->when(!empty($checklistId), fn($q) => $q->where('ci2.checklist_id', $checklistId))
      ->when(!empty($checkItemNames), fn($q) => $q->whereIn('ct2.name', $checkItemNames))
      ->groupBy('cir2.asset_id', 'cir2.checklist_item_id');

    return ChecklistItemResult::query()
      ->with('checkedBy:EMPLOYID,FIRSTNAME,LASTNAME,JOB_TITLE')
      ->from('checklist_item_results as cir')
      ->select(
        [
          'cir.checked_at',
          'ct.name as item_name',
          'cir.item_status',
          'a.code as asset_name',
          'l.location_name as asset_location',
          'cir.checked_by',
          DB::raw("s.id IS NULL as is_no_schedule"),
        ]
      )
      ->addSelect(DueScheduleQuery::dueRaw())
      ->join('checklist_items as ci', 'ci.id', '=', 'cir.checklist_item_id')
      ->leftjoin('entity_checklist_item_schedules as ecs', 'ecs.checklist_item_id', '=', 'ci.id')
      ->leftjoin('schedules as s', 's.id', '=', 'ecs.schedule_id')
      ->join('check_items as ct', 'ct.id', '=', 'ci.item_id')
      ->join('assets as a', 'a.id', '=', 'cir.asset_id')
      ->join('locations as l', 'l.id', '=', 'a.location_id')
      ->joinSub($latestResults, 'latest', function ($join) {
        $join->on('latest.asset_id', '=', 'cir.asset_id')
          ->on('latest.checklist_item_id', '=', 'cir.checklist_item_id')
          ->on('latest.latest_checked', '=', 'cir.checked_at');
      })
      ->when(!empty($checklistId), fn($q) => $q->where('ci.checklist_id', $checklistId))
      ->when(!empty($checkItemNames), fn($q) => $q->whereIn('ct.name', $checkItemNames));
  }

  public static function getAllStatusResults()
  {
    $results  = self::getLatestResults(null, null)
      ->whereRaw(
        'LOWER(cir.item_status) IN (' . implode(',', array_fill(0, count(CheckItemStatusDashboard::CHECK_ITEM_STATUS), '?')) . ')',
        array_map('strtolower', CheckItemStatusDashboard::CHECK_ITEM_STATUS)
      )
      ->groupBy('cir.item_status')
      ->select('cir.item_status', DB::raw('COUNT(DISTINCT a.code) as asset_count'))
      ->get()
      ->keyBy(fn($row) => strtolower($row->item_status));

    return collect(CheckItemStatusDashboard::CHECK_ITEM_STATUS)->map(fn($status) => [
      'item_status' => $status,
      'asset_count' => $results->has(strtolower($status)) ? $results[strtolower($status)]->asset_count : 0,
    ]);
  }

  public static function getLatestCheckItemsStatusByChecklist(int $checklistId)
  {
    return self::getLatestResults($checklistId, [])
      ->get()
      ->groupBy(fn($row) => strtolower($row->asset_name));
  }
}
