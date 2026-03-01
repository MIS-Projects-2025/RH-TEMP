<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Restroom extends Model
{
  protected $table = 'restrooms';
  public $timestamps = false;

  public function location()
  {
    return $this->belongsTo(Location::class, 'location_id');
  }

  public function fixtures()
  {
    return $this->hasMany(Fixture::class, 'restroom_id', 'id');
  }
}
