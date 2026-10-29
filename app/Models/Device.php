<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $fillable = ['ip', 'location', 'map_x', 'map_y', 'label_x', 'label_y', 'threshold_profile_id'];

    protected $casts = [
        'map_x' => 'float',
        'map_y' => 'float',
        'label_x' => 'float',
        'label_y' => 'float',
    ];

    public function statuses()
    {
        return $this->hasMany(Status::class);
    }

    public static function existsByIp(string $ip): bool
    {
        return static::where('ip', $ip)->exists();
    }

    public function thresholdProfile()
    {
        return $this->belongsTo(ThresholdProfile::class);
    }

    public function isTempBreached(float $temp): bool
    {
        return $this->thresholdProfile->isTempBreached($temp);
    }

    public function isRhBreached(float $rh): bool
    {
        return $this->thresholdProfile->isRhBreached($rh);
    }
}
