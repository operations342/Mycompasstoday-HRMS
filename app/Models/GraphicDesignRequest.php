<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GraphicDesignRequest extends Model
{
    protected $fillable = [
        'title',
        'description',
        'reference_images',
        'priority',
        'deadline',
        'requester_id',
        'designer_id',
        'approval_status',
        'final_files',
    ];

    protected $casts = [
        'reference_images' => 'array',
        'final_files' => 'array',
        'deadline' => 'date',
    ];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function designer()
    {
        return $this->belongsTo(User::class, 'designer_id');
    }
}
