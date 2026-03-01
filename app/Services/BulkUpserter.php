<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class BulkUpserter
{
  protected Model $model;
  protected array $dateColumns = [];
  protected array $columnRules = [];
  protected array $columnHandlers = [];
  protected array $attributeNames = [];

  /**
   * @param Model $model Eloquent model
   * @param array $columnRules Laravel validation rules per column
   * @param array $dateColumns Columns to normalize as dates
   * @param array $columnHandlers Optional custom normalization per column
   *        Format: 'column_name' => fn($value) => $normalizedValue|null
   */
  public function __construct(
    Model $model,
    array $columnRules = [],
    array $dateColumns = [],
    array $columnHandlers = [],
    array $attributeNames = []
  ) {
    $this->model = $model;
    $this->columnRules = $columnRules;
    $this->dateColumns = $dateColumns;
    $this->columnHandlers = $columnHandlers;
    $this->attributeNames = $attributeNames;
  }

  protected function isNewRow($id): bool
  {
    if ($id === null) return true;
    return is_string($id) && str_starts_with($id, 'new-');
  }

  /**
   * Perform bulk update
   *
   * @param array $rows Array of rowId => fields
   * @param int|null $modifiedBy Optional user id for tracking
   * @return array Result summary with updated ids and errors
   */
  public function update(array $rows): array
  {
    $errors = [];
    $errorMessages = [];
    $insertedIds = [];
    $updatedIds = [];

    DB::transaction(function () use ($rows, &$errors, &$updatedIds, &$insertedIds) {
      foreach ($rows as $row) {
        $id = $row['id'] ?? null;
        $fields = $row;
        if (empty($fields)) continue;
        $isNew = $this->isNewRow($id);

        Log::info(($isNew ? "Inserting" : "Updating") . " row: " . json_encode($fields));

        // $modelInstance = $this->model->find($id);
        // if (!$modelInstance) continue;

        $fieldsForValidation = $fields;

        foreach ($fieldsForValidation as $column => $value) {
          if (isset($this->columnHandlers[$column]) && is_callable($this->columnHandlers[$column])) {
            $fieldsForValidation[$column] = call_user_func($this->columnHandlers[$column], $value);
          }
        }

        $rules = [];
        foreach ($this->columnRules as $column => $rule) {
          $rules[$column] = $rule instanceof \Closure
            ? $rule($isNew ? null : $id, $fieldsForValidation)
            : $rule;
        }

        $validator = Validator::make(
          $fieldsForValidation,
          $rules,
          [
            '*.integer' => 'Invalid value :input for column :attribute. Must be an integer.',
            '*.string' => 'Invalid value :input for column :attribute. Must be a string.',
            '*.date' => 'Invalid date :input for column :attribute.',
            '*.exists' => 'Value :input for column :attribute does not exist.',
            '*.unique' => 'Value :input for column :attribute already exists.',
          ],
          $this->attributeNames
        );

        $normalizedData = $this->normalizeFields($fields);

        if ($validator->fails()) {
          $errors[$id] = $validator->errors()->messages();
          continue;
        }

        if ($isNew) {
          $modelInstance = $this->model->create($normalizedData);
          $insertedIds[] = $modelInstance->getKey();
        } else {
          $modelInstance = $this->model->find($id);
          if (!$modelInstance) continue;
          $modelInstance->update($normalizedData);
          $updatedIds[] = $id;
        }
      }
    });

    if (!empty($errors)) {
      $maxErrorRows = 20;

      foreach ($errors as $rowId => $columns) {
        foreach ($columns as $column => $messages) {
          foreach ($messages as $msg) {

            $cleanMsg = str_replace($column, $column, $msg);
            $errorMessages[] = "Row " . ($rowId ?? '?') . ": {$cleanMsg}";

            if (count($errorMessages) >= $maxErrorRows) {
              break 3;
            }
          }
        }
      }
    }

    return [
      'updated' => $updatedIds,
      'inserted' => $insertedIds,
      'errors' => $errors,
      'errorMessages' => $errorMessages
    ];
  }

  protected function normalizeFields(array $fields): array
  {
    $normalized = [];

    foreach ($fields as $column => $value) {

      if (in_array($column, $this->dateColumns)) {
        $normalized[$column] = $this->normalizeDate($value);
        continue;
      }

      if (is_array($value) && isset($value['id'])) {
        $normalized[$column] = $value['id'];
        continue;
      }

      $normalized[$column] = $value;
    }

    return $normalized;
  }

  protected function normalizeDate(string|null $value): ?string
  {
    if ($value === null) return null;

    $value = trim($value);

    // date-only
    if (strlen($value) === 10) {
      $dt = \DateTime::createFromFormat('Y-m-d', $value);
      return $dt ? $dt->format('Y-m-d') : null;
    }

    // datetime with minutes
    if (strlen($value) === 16) {
      $dt = \DateTime::createFromFormat('Y-m-d H:i', str_replace('T', ' ', $value));
      return $dt ? $dt->format('Y-m-d H:i:s') : null;
    }

    // datetime with seconds
    if (strlen($value) === 19) {
      $dt = \DateTime::createFromFormat('Y-m-d H:i:s', str_replace('T', ' ', $value));
      return $dt ? $dt->format('Y-m-d H:i:s') : null;
    }

    return null;
  }
}
