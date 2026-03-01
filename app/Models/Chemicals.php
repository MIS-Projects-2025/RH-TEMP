<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chemicals extends Model
{
  protected $table = 'chemicals';
  public $timestamps = false;
  protected $fillable = [
    'name',
    'description',
  ];
}
