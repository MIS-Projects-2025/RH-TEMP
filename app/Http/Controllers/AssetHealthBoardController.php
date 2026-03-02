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

class AssetHealthBoardController extends Controller
{
    public function index(Request $request)
    {
        $checklists = Checklist::all();
        $selectedChecklistId = $request->input('checklist_id', $checklists->first()?->id);
        $assetSearchName = $request->input('search', null);
        $selectedChecklist = Checklist::with('checklistItems.item')->find($selectedChecklistId);
        $CheckItemsResultsRepo = new CheckItemsResultRepository();

        $latestResults = $CheckItemsResultsRepo->getlatestCheckItemsStatusByChecklist($selectedChecklistId, $assetSearchName);

        return Inertia::render('AssetHealthBoardPage', [
            'latestResults' => $latestResults,
            'checklists' => $checklists,
            'search' => $assetSearchName,
            'selectedChecklist' => $selectedChecklist
        ]);
    }
}
