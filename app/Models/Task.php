<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'department',
        'creator_id',
        'priority',
        'start_date',
        'due_date',
        'estimated_hours',
        'status',
        'tags',
        'recurring_settings',
        'time_tracked_seconds',
        'is_time_tracking_active',
        'time_tracker_start',
        'dependencies',
    ];

    protected $casts = [
        'tags' => 'array',
        'recurring_settings' => 'array',
        'dependencies' => 'array',
        'start_date' => 'date',
        'due_date' => 'date',
        'is_time_tracking_active' => 'boolean',
        'time_tracker_start' => 'datetime',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function assignees()
    {
        return $this->belongsToMany(User::class, 'task_user');
    }

    public function checklists()
    {
        return $this->hasMany(TaskChecklist::class);
    }

    public function comments()
    {
        return $this->hasMany(TaskComment::class)->orderBy('created_at', 'desc');
    }

    public function histories()
    {
        return $this->hasMany(TaskHistory::class)->orderBy('created_at', 'desc');
    }
}
