<?php

namespace App\Models;

use App\Models\Schedule;
use App\Models\ChecklistItem;
use Illuminate\Database\Eloquent\Model;

class GlobalPMSchedule extends Model
{
  protected $table = 'entity_global_pm_schedules';
  public $timestamps = false;

  protected $fillable = [
    'schedule_id',
    'global_pm_id',
  ];

  public function schedule()
  {
    return $this->belongsTo(Schedule::class, 'schedule_id');
  }

  public function globalPm()
  {
    return $this->belongsTo(GlobalPm::class, 'global_pm_id');
  }
}
