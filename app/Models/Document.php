<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'parent_id',
        'is_folder',
        'name',
        'file_path',
        'file_size',
        'file_type',
        'uploader_id',
        'allowed_roles',
    ];

    protected $casts = [
        'is_folder' => 'boolean',
        'allowed_roles' => 'array',
        'file_size' => 'integer',
    ];

    public function parent()
    {
        return $this->belongsTo(Document::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Document::class, 'parent_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploader_id');
    }
}
