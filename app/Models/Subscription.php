<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Subscription extends Model
{
    protected $table = 'subscriptions';

    protected $fillable = [
        'name',
        'plan',
        'type',
        'amount',
        'start_date',
        'end_date',
        'users_count',
        'notes',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'amount' => 'decimal:2',
        'users_count' => 'integer',
    ];

    protected $appends = ['days_left'];

    /**
     * Get the dynamic days left until subscription expires.
     * If negative, the subscription has already expired.
     */
    public function getDaysLeftAttribute()
    {
        $today = Carbon::today();
        $endDate = Carbon::parse($this->end_date);
        
        // Use diffInDays with absolute parameter as false to get negative numbers for past dates
        return (int) $today->diffInDays($endDate, false);
    }

    /**
     * Get historical renewals for this subscription.
     */
    public function renewals()
    {
        return $this->hasMany(SubscriptionRenewal::class)->orderBy('created_at', 'desc');
    }
}
