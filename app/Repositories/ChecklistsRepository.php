<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Checklist;

class ChecklistsRepository
{
  public function getChecklistsQuery($search = null)
  {
    return Checklist::query()
      ->with(['checklistItems.item'])
      ->when(
        $search,
        fn($query) =>
        $query->where('name', 'like', "%{$search}%")
          ->orWhere('form_control_no', 'like', "%{$search}%")
      )
      ->orderBy('name');
  }
}
