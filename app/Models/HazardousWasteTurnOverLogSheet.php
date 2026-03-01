<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HazardousWasteTurnOverLogSheet extends Model
{
  protected $table = 'hazardous_waste_material_turn_over_logsheet';
  protected $primaryKey = 'id';
  public $timestamps = false;
  protected $fillable = [
    'reference_no',
    'requestor',
    'date',
  ];

  public function requestor()
  {
    return $this->belongsTo(Employee::class, 'requestor', 'EMPLOYID');
  }

  protected $casts = [
    'id' => 'string',
  ];
}
