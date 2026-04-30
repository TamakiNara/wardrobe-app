<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WearLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'event_date',
        'display_order',
        'source_outfit_id',
        'memo',
        'outdoor_temperature_feel',
        'indoor_temperature_feel',
        'overall_rating',
        'feedback_tags',
        'feedback_memo',
    ];

    protected $casts = [
        'event_date' => 'date:Y-m-d',
        'feedback_tags' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sourceOutfit(): BelongsTo
    {
        return $this->belongsTo(Outfit::class, 'source_outfit_id');
    }

    public function wearLogItems(): HasMany
    {
        return $this->hasMany(WearLogItem::class)->orderBy('sort_order');
    }
}
