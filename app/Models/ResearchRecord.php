<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResearchRecord extends Model
{
    protected $fillable = [
        'topic',
        'assigned_to',
        'reporter_id',
        'deadline',
        'sources',
        'references',
        'attachment_paths',
        'findings',
        'status',
    ];

    protected $casts = [
        'attachment_paths' => 'array',
        'deadline' => 'date',
    ];

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }
}
