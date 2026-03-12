<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    protected $fillable = ['device_id', 'rh', 'temp', 'is_recording'];

    protected $casts = [
        'is_recording' => 'boolean',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
