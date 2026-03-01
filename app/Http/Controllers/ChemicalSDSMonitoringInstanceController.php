<?php

namespace App\Http\Controllers;

use App\Traits\ParseRequestTrait;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Traits\MassDeletesByIds;
use Exception;
use Illuminate\Support\Facades\Log;
use App\Models\ChecklistInstance;
use App\Models\ChemicalSDSMonitoringInstance;
use Illuminate\Support\Facades\DB;

class ChemicalSDSMonitoringInstanceController extends Controller
{
  use MassDeletesByIds;
  use ParseRequestTrait;

  public function index(Request $request)
  {
    $query = ChemicalSDSMonitoringInstance::with([
      'results',
      'results.chemical',
      'creator:EMPLOYID,FIRSTNAME,LASTNAME,JOB_TITLE',
    ]);
    $hasCreatedAtStart = $request->filled('created_at_start') ? Carbon::parse($request->created_at_start) : null;
    $hasCreatedAtEnd = $request->filled('created_at_end') ? Carbon::parse($request->created_at_end) : null;
    $perPage = $request->integer('perPage', 30);
    $totalEntries = $query->count();

    if ($hasCreatedAtStart && $hasCreatedAtEnd) {
      $hasCreatedAtStart = Carbon::parse($request->created_at_start);
      $hasCreatedAtEnd   = Carbon::parse($request->created_at_end);
      $query->whereBetween('created_at', [$hasCreatedAtStart, $hasCreatedAtEnd]);
    }

    $instances = $query->orderByDesc('created_at')
      ->paginate($perPage);

    if ($request->wantsJson()) {
      return response()->json([
        'sdsInstance' => $instances,
        'createdAtStart' => $hasCreatedAtStart ?? null,
        'createdAtEnd' => $hasCreatedAtEnd ?? null,
        'perPage' => $perPage,
        'totalEntries' => $totalEntries,
      ]);
    }

    return Inertia::render('ChemicalSDSMonitoringInstanceList', [
      'sdsInstance' => $instances,
      'createdAtStart' => $hasCreatedAtStart ?? null,
      'createdAtEnd' => $hasCreatedAtEnd ?? null,
      'perPage' => $perPage,
      'totalEntries' => $totalEntries,
    ]);
  }
}
