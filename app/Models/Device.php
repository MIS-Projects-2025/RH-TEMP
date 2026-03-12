<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $fillable = ['ip', 'location'];

    public function statuses()
    {
        return $this->hasMany(Status::class);
    }

    public static function existsByIp(string $ip): bool
    {
        return static::where('ip', $ip)->exists();
    }
}
