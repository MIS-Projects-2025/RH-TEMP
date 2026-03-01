<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

trait HasUniqueCombinationRule
{
  public function uniqueCombinationRule(string $table, array $otherColumns = [], ?string $modelToResolve = null)
  {
    return function ($id, $fields) use ($table, $otherColumns, $modelToResolve) {
      return function ($attribute, $value, $fail) use ($id, $fields, $table, $otherColumns, $modelToResolve) {
        $query = DB::table($table)->where($attribute, $value);

        $displayParts = [$attribute => $value];

        foreach ($otherColumns as $col) {
          $colValue = $fields[$col] ?? null;

          if ($modelToResolve && is_subclass_of($modelToResolve, Model::class)) {
            $resolved = $modelToResolve::find($colValue);
            if ($resolved) {
              $colValue = $resolved->code ?? $resolved->name ?? $colValue;
            }
          }

          $query->where($col, $fields[$col] ?? null);
          $displayParts[$col] = $colValue;
        }

        if (is_numeric($id)) {
          $query->where('id', '!=', $id);
        }

        if ($query->exists()) {
          $fail("The combination " . implode(" + ", $displayParts) . " already exists.");
        }
      };
    };
  }
}
