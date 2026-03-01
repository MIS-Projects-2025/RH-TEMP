<?php

namespace App\Models;

use App\Models\Checklist;
use Illuminate\Database\Eloquent\Model;

class RestroomMonitoringInstance extends Model
{
  protected $table = 'restroom_monitoring_instances';
  public $timestamps = false;

  protected $casts = [
    'results' => 'array',
  ];

  protected $fillable = [
    'created_by',
    'notes',
  ];

  public function results()
  {
    return $this->hasMany(RestroomMonitoring::class, 'restroom_monitoring_instance_id');
  }

  public function creator()
  {
    return $this->belongsTo(Employee::class, 'created_by', 'EMPLOYID');
  }

  public function verifier()
  {
    return $this->belongsTo(Employee::class, 'verified_by', 'EMPLOYID');
  }
}
