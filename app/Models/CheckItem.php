<?php

namespace App\Models;

use App\Models\Checklist;
use Illuminate\Database\Eloquent\Model;

class CheckItem extends Model
{
  protected $table = 'check_items';
  public $timestamps = false;

  protected $fillable = [
    'name',
    'description',

    // item_id
    // -> criteria
  ];
}
