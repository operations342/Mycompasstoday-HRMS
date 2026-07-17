<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyWorkLog extends Model
{
    protected $fillable = [
        'user_id',
        'log_date',
        'today_work',
        'completed_tasks',
        'pending_tasks',
        'issues_faced',
        'tomorrow_plan',
        'working_hours',
        'attachment_path',
        'manager_remarks',
        'manager_id',
    ];

    protected $casts = [
        'log_date' => 'date',
        'working_hours' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }
}
