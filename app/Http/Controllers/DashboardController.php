<?php

namespace App\Http\Controllers;

use App\Constants\RunningHours;
use App\Repositories\CheckItemsResultRepository;
use App\Services\AssetsService;
use App\Services\ChecklistsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ChecklistInstance;
use App\Models\Checklist;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function getOverallChecklistState()
    {
        $sub = (new AssetsService())->getDueAssetsQuery();

        $assetsCollapsed = DB::table(DB::raw("({$sub->toSql()}) as sub"))
            ->mergeBindings($sub->getQuery())
            ->select([
                'sub.id',
                'sub.code',
                'sub.location_name',
                DB::raw('SUM(sub.due_items) as due_items'),
                DB::raw('SUM(sub.done_items) as done_items'),
                DB::raw('SUM(sub.overdue_items) as overdue_items'),
            ])
            ->groupBy('sub.id', 'sub.code', 'sub.location_name');

        $assetDetails = $assetsCollapsed->get();

        Log::info("query get" . json_encode($assetsCollapsed->get()));

        $summary = [
            'total_assets'      => $assetDetails->count(),
            'assets_complete'   => $assetDetails->filter(fn($a) => $a->due_items == 0 && $a->done_items > 0)->values(),
            'assets_partial'    => $assetDetails->filter(fn($a) => $a->due_items > 0 && $a->done_items > 0)->values(),
            'assets_not_started' => $assetDetails->filter(fn($a) => $a->due_items > 0 && $a->done_items == 0)->values(),
            'assets_idle'       => $assetDetails->filter(fn($a) => $a->due_items == 0 && $a->done_items == 0)->values(),
            'assets_overdue'    => $assetDetails->filter(fn($a) => $a->overdue_items > 0)->values(),
        ];

        return $summary;
    }

    public function index(Request $request)
    {
        $vacuumChecklistId = Checklist::where('slug', 'vacuum_pump')->value('id');
        $airCompressorChecklistId = Checklist::where('slug', 'revised_air_compressor_unit')->value('id');

        $CheckItemsResultsRepo = new CheckItemsResultRepository();

        $vacuumLatestResults = $CheckItemsResultsRepo->getlatestCheckItemsStatusByChecklist($vacuumChecklistId);
        $airCompressorLatestResults = $CheckItemsResultsRepo->getlatestCheckItemsStatusByChecklist($airCompressorChecklistId);

        // $vacuumLatestResults = $vacuumLatestResults
        //     ->map(
        //         fn($items) =>
        //         $items->filter(fn($item) => in_array(strtolower($item->item_name), ['running hours', 'Vacuum Pump']))->values()
        //     )
        //     ->filter(fn($items) => $items->isNotEmpty());

        $allLatestStatusResults = $CheckItemsResultsRepo->getAllStatusResults();
        $assetsOverview = self::getOverallChecklistState();
        $checklistsOverview = (new ChecklistsService())->getAllChecklistsWithDueAssets();

        $unverifiedToday = ChecklistInstance::whereNull('verified_at')->whereDate('created_at', Carbon::today())->count();
        $unverifiedTotal = ChecklistInstance::whereNull('verified_at')->count();

        return Inertia::render('Dashboard', [
            'vacuum_latest_results' => $vacuumLatestResults,
            'air_compressor_latest_result' => $airCompressorLatestResults,
            'vacuum_running_hours_ok' => RunningHours::VACUUM_RUNNING_HOURS_OK,
            'vacuum_running_hours_warning' => RunningHours::VACUUM_RUNNING_HOURS_WARNING,
            'vacuum_running_hours_danger' => RunningHours::VACUUM_RUNNING_HOURS_DANGER,
            'air_compressor_running_hours_ok' => RunningHours::AIR_COMPRESSOR_RUNNING_HOURS_OK,
            'air_compressor_running_hours_warning' => RunningHours::AIR_COMPRESSOR_RUNNING_HOURS_WARNING,
            'air_compressor_running_hours_danger' => RunningHours::AIR_COMPRESSOR_RUNNING_HOURS_DANGER,

            'assets_due' => $assetsOverview,
            'checklists_overview' => $checklistsOverview,
            'unverified_today' => $unverifiedToday,
            'unverified_total' => $unverifiedTotal,

            'all_latest_status_results' => $allLatestStatusResults
        ]);
    }
}
