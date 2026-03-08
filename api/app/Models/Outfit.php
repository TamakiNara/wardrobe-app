<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Outfit extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'memo',
        'seasons',
        'tpos',
    ];

    protected $casts = [
        'seasons' => 'array',
        'tpos' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function outfitItems(): HasMany
    {
        return $this->hasMany(OutfitItem::class)->orderBy('sort_order');
    }
}
