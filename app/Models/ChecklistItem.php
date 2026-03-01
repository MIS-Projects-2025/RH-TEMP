<?php

namespace App\Models;

use App\Models\Checklist;
use App\Models\EntityChecklistItemSchedule;
use App\Models\CheckItem;
use Illuminate\Database\Eloquent\Model;

class ChecklistItem extends Model
{
  protected $table = 'checklist_items';
  public $timestamps = false;

  protected $fillable = [
    'checklist_id',
    'item_id',
    'criteria',
    'modified_by',
    'input_type',
    'allowed_values',
    'modified_at',
  ];

  protected $casts = [
    'allowed_values' => 'array',
  ];

  public function checklist()
  {
    return $this->belongsTo(Checklist::class, 'checklist_id');
  }

  public function item()
  {
    return $this->belongsTo(CheckItem::class, 'item_id');
  }

  public function entitySchedule()
  {
    return $this->hasOne(EntityChecklistItemSchedule::class, 'checklist_item_id');
  }

  public function schedule()
  {
    return $this->hasOneThrough(
      Schedule::class,
      EntityChecklistItemSchedule::class,
      'checklist_item_id', // FK on entity_schedules
      'id',           // PK on schedules
      'id',           // PK on checklists
      'schedule_id'   // FK on entity_schedules
    );
  }
}
