<?php

namespace App\Models;

use App\Models\Checklist;
use Illuminate\Database\Eloquent\Model;

class GlobalPm extends Model
{
  protected $table = 'global_preventative_maintenances';
  public $timestamps = false;

  protected $fillable = [
    'maintenance_name',
    'maintenance_description',
  ];
}
