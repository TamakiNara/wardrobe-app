<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Item extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'category',
        'shape',
        'colors',
        'seasons',
        'tpos',
    ];

    protected $casts = [
        'colors' => 'array',
        'seasons' => 'array',
        'tpos' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
