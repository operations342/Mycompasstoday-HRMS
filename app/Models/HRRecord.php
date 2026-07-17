<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HRRecord extends Model
{
    protected $table = 'hr_records';

    protected $fillable = [
        'record_type',
        'user_id',
        'date_from',
        'date_to',
        'status',
        'details',
        'score',
        'reviewer_id',
    ];

    protected $casts = [
        'date_from' => 'date',
        'date_to' => 'date',
        'score' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
