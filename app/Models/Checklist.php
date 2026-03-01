<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Checklist extends Model
{
  protected $table = 'checklists';
  public $timestamps = false;
  protected $fillable = [
    'name',
    'description',
    'instruction'
  ];

  public function checklistItems()
  {
    return $this->hasMany(ChecklistItem::class, 'checklist_id', 'id');
  }

  public function items()
  {
    return $this->hasManyThrough(
      CheckItem::class,       // Target model
      ChecklistItem::class,   // Intermediate model
      'checklist_id',         // Foreign key on ChecklistItem
      'id',                   // Foreign key on CheckItem
      'id',                   // Local key on Checklist
      'item_id'               // Local key on ChecklistItem
    );
  }
}
