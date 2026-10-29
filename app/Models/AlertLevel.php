<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlertLevel extends Model
{
    public $timestamps = false;

    protected $fillable = ['name'];
}
