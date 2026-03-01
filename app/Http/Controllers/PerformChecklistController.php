<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Services\ChecklistsService;

class PerformChecklistController extends Controller
{

    public function index(Request $request)
    {
        $checklistsOverview = (new ChecklistsService())->getAllChecklistsWithDueAssets();

        return Inertia::render('PerformChecklistPage', [
            'checklistsOverview' => $checklistsOverview
        ]);
    }
}
