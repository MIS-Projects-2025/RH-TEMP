<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\Checklist;
use App\Services\AssetsService;
use App\Support\CacheKeys;

class ChecklistsService
{
  public function getAllChecklistsWithDueAssets()
  {
    $assetsService = new AssetsService();

    $checklists = Checklist::select('id', 'name', 'instruction')
      ->get()
      ->keyBy(fn($item) => (string)$item->id);

    $assetsQuery = $assetsService->getDueAssetsQuery();

    $assetStats = DB::table(DB::raw("({$assetsQuery->toSql()}) as sub"))
      ->mergeBindings($assetsQuery->getQuery())
      ->select(
        'sub.checklist_id',
        DB::raw('COUNT(DISTINCT sub.id) AS total_assets_count'),
        DB::raw('COUNT(DISTINCT CASE WHEN sub.due_items > 0 THEN sub.id END) AS assets_with_due'),
        DB::raw('COUNT(DISTINCT CASE WHEN sub.done_items > 0 THEN sub.id END) AS assets_with_done')
      )
      ->groupBy('sub.checklist_id')
      ->get()
      ->keyBy('checklist_id');

    $checklists->transform(function ($checklist) use ($assetStats) {
      $stats = $assetStats->get($checklist->id);

      $checklist->total_assets_with_due  = $stats->assets_with_due ?? 0;
      $checklist->total_assets_with_done = $stats->assets_with_done ?? 0;
      $checklist->total_assets_count     = $stats->total_assets_count ?? 0;

      return $checklist;
    });

    return [
      'checklistArray' => $checklists->values(),
      'checklistMap'   => $checklists,
    ];
  }
}
