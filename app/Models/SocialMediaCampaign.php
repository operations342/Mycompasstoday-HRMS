<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SocialMediaCampaign extends Model
{
    protected $fillable = [
        'campaign_name',
        'platform',
        'content',
        'design_attachment_path',
        'caption',
        'schedule_date',
        'approval_status',
        'approved_by',
        'analytics_clicks',
        'analytics_engagement',
    ];

    protected $casts = [
        'schedule_date' => 'datetime',
        'analytics_clicks' => 'integer',
        'analytics_engagement' => 'integer',
    ];

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
