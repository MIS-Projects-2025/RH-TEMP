<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceAlert extends Model
{
    /** Threshold snapshot columns, copied from the device's threshold profile. */
    public const THRESHOLDS = [
        'temp_min',
        'temp_max',
        'temp_crit_min',
        'temp_crit_max',
        'rh_min',
        'rh_max',
        'rh_crit_min',
        'rh_crit_max',
    ];

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'alerted_at' => 'datetime',
        'temp' => 'float',
        'rh' => 'float',
        'temp_min' => 'float',
        'temp_max' => 'float',
        'temp_crit_min' => 'float',
        'temp_crit_max' => 'float',
        'rh_min' => 'float',
        'rh_max' => 'float',
        'rh_crit_min' => 'float',
        'rh_crit_max' => 'float',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(AlertLevel::class);
    }

    public function previousLevel(): BelongsTo
    {
        return $this->belongsTo(AlertLevel::class, 'previous_level_id');
    }

    public function tempLevel(): BelongsTo
    {
        return $this->belongsTo(AlertLevel::class, 'temp_level_id');
    }

    public function rhLevel(): BelongsTo
    {
        return $this->belongsTo(AlertLevel::class, 'rh_level_id');
    }

    public function scopeInRange(Builder $query, $from, $to): Builder
    {
        return $query->whereBetween('alerted_at', [$from, $to]);
    }
}
