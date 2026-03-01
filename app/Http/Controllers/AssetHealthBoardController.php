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
        $selectedChecklist = Checklist::with('checklistItems.item')->find($selectedChecklistId);
        $CheckItemsResultsRepo = new CheckItemsResultRepository();

        $latestResults = $CheckItemsResultsRepo->getlatestCheckItemsStatusByChecklist($selectedChecklistId);

        return Inertia::render('AssetHealthBoardPage', [
            'latestResults' => $latestResults,
            'checklists' => $checklists,
            'selectedChecklist' => $selectedChecklist
        ]);
    }
}
