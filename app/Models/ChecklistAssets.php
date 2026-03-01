<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChecklistAssets extends Model
{
  protected $table = 'checklist_assets';
  public $timestamps = false;
  protected $fillable = [
    'asset_id',
    'checklist_id',
    'modified_by',
    'modified_at',
  ];

  public function asset()
  {
    return $this->belongsTo(Asset::class, 'asset_id');
  }

  public function checklist()
  {
    return $this->belongsTo(Checklist::class, 'checklist_id');
  }
}
