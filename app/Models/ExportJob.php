<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExportJob extends Model
{
    protected $fillable = [
        'requested_by',
        'params',
        'status',
        'progress',
        'file_path',
        'error',
        'completed_at',
    ];

    protected $casts = [
        'params'       => 'array',
        'completed_at' => 'datetime',
    ];

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path
            ? route('export.download', $this->id)
            : null;
    }
}
