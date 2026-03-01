<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestroomMonitoring extends Model
{
  protected $table = 'restroom_monitoring';
  public $timestamps = false;

  protected $fillable = [
    'restroom_id',
    'checked_by',
    'restroom_monitoring_instance_id',
    'status',
    'remarks',
  ];

  public function restroom()
  {
    return $this->belongsTo(Restroom::class, 'restroom_id', 'id');
  }
}
