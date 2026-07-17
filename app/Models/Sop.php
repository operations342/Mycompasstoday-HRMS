<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sop extends Model
{
    protected $fillable = [
        'department',
        'title',
        'instructions',
        'attachment_paths',
        'author_id',
        'approval_status',
        'approved_by',
        'version',
    ];

    protected $casts = [
        'attachment_paths' => 'array',
        'version' => 'integer',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
