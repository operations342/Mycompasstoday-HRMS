<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeBaseArticle extends Model
{
    protected $fillable = [
        'title',
        'description',
        'steps',
        'challenges_faced',
        'solution',
        'category',
        'attachment_paths',
        'related_tasks',
        'author_id',
        'approval_status',
        'approved_by',
        'version',
    ];

    protected $casts = [
        'attachment_paths' => 'array',
        'related_tasks' => 'array',
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
