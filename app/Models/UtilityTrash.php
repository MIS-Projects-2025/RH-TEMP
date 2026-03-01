<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UtilityTrash extends Model
{
    /** @use HasFactory<\Database\Factories\UtilityTrashFactory> */
    use HasFactory;
    protected $table = 'utility_trash_collection';
    public $timestamps = false;
    protected $fillable = [
        'date',
        'performed_by',
        'verified_by',
    ];

    public function performedBy()
    {
        return $this->belongsTo(Employee::class, 'performed_by', 'EMPLOYID');
    }

    public function verifiedBy()
    {
        return $this->belongsTo(Employee::class, 'verified_by', 'EMPLOYID');
    }
}
