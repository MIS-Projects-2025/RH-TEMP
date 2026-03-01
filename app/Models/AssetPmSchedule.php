<?php

namespace App\Models;

use App\Models\Asset;
use App\Models\Schedule;
use Illuminate\Database\Eloquent\Model;

class AssetPmSchedule extends Model
{
  protected $table = 'entity_asset_pm_schedules';
  public $timestamps = false;

  protected $fillable = [
    'schedule_id',
    'asset_id',
  ];
  public function schedule()
  {
    return $this->belongsTo(Schedule::class, 'schedule_id');
  }

  public function assets()
  {
    return $this->belongsTo(Asset::class, 'asset_id');
  }
}
