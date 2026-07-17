<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bug extends Model
{
    protected $fillable = [
        'title',
        'description',
        'priority',
        'severity',
        'environment',
        'developer_id',
        'reporter_id',
        'status',
        'attachment_path',
        'expected_result',
        'actual_result',
        'resolution',
    ];

    public function developer()
    {
        return $this->belongsTo(User::class, 'developer_id');
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }
}
