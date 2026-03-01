<?php


namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait ValidateEmployeeExistenceTrait
{
  protected function validateEmployID($id, $field = 'Employee ID')
  {
    $exists = DB::connection('masterlist')
      ->table('employee_masterlist')
      ->where('EMPLOYID', $id)
      ->exists();

    if (!$exists) {
      abort(response()->json([
        'status' => 'error',
        'message' => $field . ' does not exist',
        'data' => null
      ], 404));
    }
  }
}
