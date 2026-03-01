<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

trait MassDeletesByIds
{
  protected function massDeleteByIds(
    Request $request,
    string $modelClass,
    ?string $cacheKey = null
  ) {
    $ids = $request->input('ids');

    if (!is_array($ids) || empty($ids)) {
      return response()->json([
        'status' => 'error',
        'message' => 'No IDs provided.',
      ], 422);
    }

    if (!is_subclass_of($modelClass, Model::class)) {
      abort(500, 'Invalid model class.');
    }

    try {
      $deleted = $modelClass::whereIn('id', $ids)->delete();
    } catch (\Exception $e) {
      Log::info("Exception: " . json_encode($e));
      Log::info("ddException: " . json_encode($e->getCode()));
      Log::info("ddException: " . json_encode($e->getCode()));
      Log::info("ddException: " . json_encode($e->getCode()));

      if ($e->getCode() === '23000') {
        return response()->json([
          'status' => 'error',
          'message' => 'Some items cannot be deleted because they are still used elsewhere. Please review these items before deleting them.',
        ], 400);
      }
    }

    if ($cacheKey) {
      Cache::forget($cacheKey);
    }

    return response()->json([
      'success' => true,
      'deleted_count' => $deleted,
    ]);
  }
}
