<?php

namespace App\Models;

use App\Models\EntityChecklistItemSchedule;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
  protected $table = 'schedules';
  public $timestamps = false;

  protected $fillable = [
    'recurrence_type',
    'schedule_name',
    'schedule_description',
    'interval_unit',
    'interval_value',
    'days_of_week',
    'days_of_month',
    'nth_weekday',
    'weekday_of_month',
    'months',
    'day_times',
  ];

  public function entityChecklistItemSchedules()
  {
    return $this->hasMany(EntityChecklistItemSchedule::class, 'schedule_id');
  }
}
