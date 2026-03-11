<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'spec',
    ];

    protected $casts = [
        'colors' => 'array',
        'seasons' => 'array',
        'tpos' => 'array',
        'spec' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function outfitItems(): HasMany
    {
        return $this->hasMany(OutfitItem::class);
    }
}
