<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThresholdProfile extends Model
{
  protected $fillable = [
    'name',
    'temp_min',
    'temp_max',
    'rh_min',
    'rh_max',
    'temp_crit_min',
    'temp_crit_max',
    'rh_crit_min',
    'rh_crit_max',
  ];

  protected $casts = [
    'temp_min' => 'float',
    'temp_max' => 'float',
    'rh_min'   => 'float',
    'rh_max'   => 'float',
  ];

  public function devices()
  {
    return $this->hasMany(Device::class);
  }
  public function isTempBreached(float $temp): bool
  {
    return $temp < $this->temp_min || $temp > $this->temp_max;
  }

  public function isRhBreached(float $rh): bool
  {
    return $rh < $this->rh_min || $rh > $this->rh_max;
  }
}
