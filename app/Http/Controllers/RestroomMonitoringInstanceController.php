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
use App\Models\RestroomMonitoringInstance;
use Illuminate\Support\Facades\DB;

class RestroomMonitoringInstanceController extends Controller
{
  use MassDeletesByIds;
  use ParseRequestTrait;

  public function index(Request $request)
  {
    $query = RestroomMonitoringInstance::with([
      'results',
      'results.restroom',
      'verifier:EMPLOYID,FIRSTNAME,LASTNAME,JOB_TITLE',
      'creator:EMPLOYID,FIRSTNAME,LASTNAME,JOB_TITLE',
    ]);
    $verified = $request->filled('verified')
      ? filter_var($request->verified, FILTER_VALIDATE_BOOLEAN)
      : false;
    $hasCreatedAtStart = $request->filled('created_at_start') ? Carbon::parse($request->created_at_start) : null;
    $hasCreatedAtEnd = $request->filled('created_at_end') ? Carbon::parse($request->created_at_end) : null;
    $perPage = $request->integer('perPage', 30);
    $totalEntries = $query->count();

    $query->when($verified, fn($q) => $q->whereNotNull('verified_at'))
      ->when(!$verified, fn($q) => $q->whereNull('verified_at'));

    if ($hasCreatedAtStart && $hasCreatedAtEnd) {
      $hasCreatedAtStart = Carbon::parse($request->created_at_start);
      $hasCreatedAtEnd   = Carbon::parse($request->created_at_end);
      $query->whereBetween('created_at', [$hasCreatedAtStart, $hasCreatedAtEnd]);
    }

    $instances = $query->orderByDesc('created_at')
      ->paginate($perPage);

    if ($request->wantsJson()) {
      return response()->json([
        'restroomMonitoringInstance' => $instances,
        'verified' => $verified,
        'createdAtStart' => $hasCreatedAtStart ?? null,
        'createdAtEnd' => $hasCreatedAtEnd ?? null,
        'perPage' => $perPage,
        'totalEntries' => $totalEntries,
      ]);
    }

    return Inertia::render('RestroomMonitoringInstanceList', [
      'restroomMonitoringInstance' => $instances,
      'verified' => $verified,
      'createdAtStart' => $hasCreatedAtStart ?? null,
      'createdAtEnd' => $hasCreatedAtEnd ?? null,
      'perPage' => $perPage,
      'totalEntries' => $totalEntries,
    ]);
  }

  public function verify(Request $request)
  {
    $ids = $request->all();
    $user = session('emp_data');
    $userId = $user['emp_id'] ?? null;

    if (!$userId || empty($ids)) {
      return response()->json([
        'message' => 'Missing user info or no instances selected.'
      ], 400);
    }

    $updated = RestroomMonitoringInstance::whereIn('id', $ids)
      ->update([
        'verified_at' => now(),
        'verified_by' => $userId,
      ]);

    return response()->json([
      'status' => 'success',
      'message' => "$updated instance(s) verified successfully."
    ]);
  }
}
