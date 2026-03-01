<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
  /** @use HasFactory<\Database\Factories\UserFactory> */
  use HasFactory;

  protected $table = 'locations';
  public $timestamps = false;
  protected $fillable = [
    'location_name',
    'created_by',
    'modified_by',
  ];
}
