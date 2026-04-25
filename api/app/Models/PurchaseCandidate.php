<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseCandidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'group_id',
        'group_order',
        'status',
        'priority',
        'name',
        'category_id',
        'brand_name',
        'price',
        'release_date',
        'sale_price',
        'sale_ends_at',
        'discount_ends_at',
        'purchase_url',
        'memo',
        'wanted_reason',
        'size_gender',
        'size_label',
        'size_note',
        'size_details',
        'spec',
        'is_rain_ok',
        'converted_item_id',
        'converted_at',
    ];

    protected $casts = [
        'price' => 'integer',
        'group_order' => 'integer',
        'release_date' => 'date',
        'sale_price' => 'integer',
        'sale_ends_at' => 'datetime',
        'discount_ends_at' => 'datetime',
        'size_details' => 'array',
        'spec' => 'array',
        'is_rain_ok' => 'boolean',
        'converted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(PurchaseCandidateGroup::class, 'group_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(CategoryMaster::class, 'category_id');
    }

    public function convertedItem(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'converted_item_id');
    }

    public function colors(): HasMany
    {
        return $this->hasMany(PurchaseCandidateColor::class);
    }

    public function seasons(): HasMany
    {
        return $this->hasMany(PurchaseCandidateSeason::class);
    }

    public function tpos(): HasMany
    {
        return $this->hasMany(PurchaseCandidateTpo::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(PurchaseCandidateImage::class);
    }

    public function materials(): HasMany
    {
        return $this->hasMany(PurchaseCandidateMaterial::class);
    }
}
