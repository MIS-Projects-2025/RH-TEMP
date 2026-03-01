<?php

namespace App\Models;

use App\Models\Schedule;
use App\Models\ChecklistItem;
use Illuminate\Database\Eloquent\Model;

class ChecklistItemSchedule extends Model
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
    return $this->belongsTo(ChecklistItem::class, 'checklist_item_id');
  }
}
