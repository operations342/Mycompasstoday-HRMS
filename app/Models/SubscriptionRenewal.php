<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionRenewal extends Model
{
    protected $table = 'subscription_renewals';

    protected $fillable = [
        'subscription_id',
        'plan',
        'type',
        'amount',
        'start_date',
        'end_date',
        'users_count',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'amount' => 'decimal:2',
        'users_count' => 'integer',
    ];

    /**
     * Get the subscription this renewal record belongs to.
     */
    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }
}
