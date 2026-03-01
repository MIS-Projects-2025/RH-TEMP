<?php

namespace App\Models;

use App\Models\Checklist;
use Illuminate\Database\Eloquent\Model;

class ChecklistInstance extends Model
{
  protected $table = 'checklist_instances';
  public $timestamps = false;

  protected $casts = [
    'results' => 'array',
  ];

  protected $fillable = [
    'checklist_id',
    'created_by',
    'notes',
    'verified_at',
    'verified_by',
  ];

  public function results()
  {
    return $this->hasMany(ChecklistItemResult::class, 'checklist_instance_id');
  }

  public function checklist()
  {
    return $this->belongsTo(Checklist::class, 'checklist_id');
  }

  public function verifier()
  {
    return $this->belongsTo(Employee::class, 'verified_by', 'EMPLOYID');
  }

  public function creator()
  {
    return $this->belongsTo(Employee::class, 'created_by', 'EMPLOYID');
  }
}
