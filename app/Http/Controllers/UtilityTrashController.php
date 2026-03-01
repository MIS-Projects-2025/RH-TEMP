<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\UtilityTrash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class UtilityTrashController extends Controller
{

  // public function index(Request $request)
  // {
  //   return Inertia::render('UtilityTrash');
  // }

  public function index(Request $request)
  {
    $search = $request->input('search', '');
    $startDate = $request->filled('startDate') ? Carbon::parse($request->startDate) : null;
    $endDate = $request->filled('endDate') ? Carbon::parse($request->endDate) : null;
    $isVerified = filter_var($request->input('isVerified'), FILTER_VALIDATE_BOOLEAN);
    $isNotVerified = filter_var($request->input('isNotVerified'), FILTER_VALIDATE_BOOLEAN);
    $perPage = $request->input('perPage', 100);
    $totalEntries = UtilityTrash::count();

    $utilityTrash = UtilityTrash::query()
      ->with([
        'performedBy:EMPLOYID,EMPNAME,JOB_TITLE,DEPARTMENT',
        'verifiedBy:EMPLOYID,EMPNAME,JOB_TITLE,DEPARTMENT',
      ])
      ->when($search, function ($query, $search) {
        // todo : add search for performed_by and verified_by using the name
        $query->where(function ($q) use ($search) {
          $q->orWhere('performed_by', 'like', "%{$search}%");
          $q->orWhere('verified_by', 'like', "%{$search}%");
        });
      })
      ->when(!$isVerified || !$isNotVerified, function ($query) use ($isVerified, $isNotVerified) {
        if ($isVerified && !$isNotVerified) {
          $query->whereNotNull('verified_by');
        } elseif (!$isVerified && $isNotVerified) {
          $query->whereNull('verified_by');
        }
      })
      ->when($startDate && $endDate, function ($query) use ($startDate, $endDate) {
        $query->whereBetween('date', [$startDate, $endDate]);
      })
      ->orderBy('date', 'desc')
      ->paginate($perPage)
      ->withQueryString();

    Log::info("utilityTrash: ", [$utilityTrash]);


    return Inertia::render('UtilityTrash/UtilityTrashList', [
      'utilityTrash' => $utilityTrash,
      'isNotVerified' => $isNotVerified,
      'isVerified' => $isVerified,
      'search' => $search,
      'perPage' => $perPage,
      'totalEntries' => $totalEntries,
    ]);
  }

  public function bulkVerify(Request $request)
  {
    $rows = $request->all();
    $user = session('emp_data');
    Log::info($user);
    DB::transaction(function () use ($rows, $user) {

      foreach ($rows as $id => $fields) {
        Log::info("ID: " . $id);

        Log::info($rows);
        Log::info($rows['id']);

        $model = UtilityTrash::find($rows['id']);

        if (!$model) {
          Log::info('No model found for id ' . $id);
          continue;
        }

        $updateData['verified_by'] = $user['emp_id'] ?? null;
        Log::info($updateData);

        if (!empty($updateData)) {
          $model->update($updateData);
        }
      }
    });

    return response()->json(['status' => 'ok']);
  }

  public function perform(Request $request)
  {
    $performDate = Carbon::parse($request->input('date'))->setTimezone('Asia/Manila');
    Log::info($performDate);
    Log::info($performDate);
    Log::info($performDate);
    Log::info($performDate);
    Log::info($performDate);
    Log::info($performDate);
    Log::info($performDate);
    $user = session('emp_data');

    $updateData['date'] = $performDate;
    $updateData['performed_by'] = $user['emp_id'] ?? null;

    if (!empty($updateData)) {
      UtilityTrash::insert($updateData);
    }

    return response()->json(['status' => 'ok']);
  }
}
