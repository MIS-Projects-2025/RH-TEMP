<?php

namespace App\Models;

use App\Models\Checklist;
use Illuminate\Database\Eloquent\Model;

class ChecklistItemResult extends Model
{
  protected $table = 'checklist_item_results';
  public $timestamps = false;
  protected $fillable = [
    'asset_id',
    'checklist_item_id',
    'checked_by',
    'remarks',
    'item_status',
    'modified_by',
    'modified_at',
    'checklist_instance_id',
  ];

  public function asset()
  {
    return $this->belongsTo(Asset::class, 'asset_id');
  }

  public function item()
  {
    return $this->belongsTo(ChecklistItem::class, 'checklist_item_id');
  }

  public function checkedBy()
  {
    return $this->belongsTo(Employee::class, 'checked_by', 'EMPLOYID');
  }
}
