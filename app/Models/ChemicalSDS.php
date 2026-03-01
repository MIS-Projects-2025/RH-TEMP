<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Chemicals;

class ChemicalSDS extends Model
{
  protected $table = 'chemical_sds_monitoring';
  public $timestamps = false;
  protected $fillable = [
    'chemical_id',
    'checked_by',
    'chemical_sds_id',
    'status',
    'remarks',
  ];

  public function chemical()
  {
    return $this->belongsTo(Chemicals::class, 'chemical_id');
  }
}
