<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Recording extends Model
{
  protected $fillable = [
    'device_id',
    'recorded_at',
    'temperature',
    'humidity',
  ];

  protected $casts = [
    'recorded_at' => 'datetime',
  ];

  public function device(): BelongsTo
  {
    return $this->belongsTo(Device::class);
  }
}
