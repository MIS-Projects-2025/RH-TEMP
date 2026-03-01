<?php


namespace App\Traits;

use Illuminate\Http\Request;

trait ParseRequestTrait
{
  protected function parseChecklists(Request $request, string $inputName = 'checklistIds'): array
  {
    $input = $request->input($inputName, '') ?? '';
    $checklists = explode(',', $input);
    return array_filter($checklists, fn($p) => !empty($p));
  }
}
