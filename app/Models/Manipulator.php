<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Manipulator extends Model
{
    protected $fillable = ['doktor_mode'];

    protected $casts = [
        'doktor_mode' => 'boolean',
    ];
}
