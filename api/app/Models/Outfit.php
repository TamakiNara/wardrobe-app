<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Outfit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'name',
        'memo',
        'seasons',
        'tpos',
        'tpo_ids',
    ];

    protected $casts = [
        'seasons' => 'array',
        'tpos' => 'array',
        'tpo_ids' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function outfitItems(): HasMany
    {
        return $this->hasMany(OutfitItem::class)->orderBy('sort_order');
    }

    public function sourceWearLogs(): HasMany
    {
        return $this->hasMany(WearLog::class, 'source_outfit_id');
    }
}
