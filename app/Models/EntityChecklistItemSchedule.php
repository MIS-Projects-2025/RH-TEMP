<?php

namespace App\Models;

use App\Models\ChecklistItem;
use App\Models\Schedule;
use Illuminate\Database\Eloquent\Model;

class EntityChecklistItemSchedule extends Model
{
  protected $table = 'entity_checklist_item_schedules';
  public $timestamps = false;

  protected $fillable = [
    'schedule_id',
    'checklist_item_id',
  ];

  public function schedule()
  {
    return $this->belongsTo(Schedule::class, 'schedule_id');
  }

  public function checklistItem()
  {
    return $this->belongsTo(ChecklistItem::class, 'checklist_id');
  }
}
