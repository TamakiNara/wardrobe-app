<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'care_status',
        'name',
        'brand_name',
        'price',
        'purchase_url',
        'memo',
        'purchased_at',
        'size_gender',
        'size_label',
        'size_note',
        'size_details',
        'is_rain_ok',
        'category',
        'shape',
        'colors',
        'seasons',
        'tpos',
        'spec',
    ];

    protected $casts = [
        'price' => 'integer',
        'purchased_at' => 'date',
        'size_details' => 'array',
        'is_rain_ok' => 'boolean',
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

    public function wearLogItems(): HasMany
    {
        return $this->hasMany(WearLogItem::class, 'source_item_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ItemImage::class)->orderBy('sort_order');
    }
}
