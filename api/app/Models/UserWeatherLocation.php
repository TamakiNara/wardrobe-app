<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserWeatherLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'forecast_area_code',
        'latitude',
        'longitude',
        'is_default',
        'display_order',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function weatherRecords(): HasMany
    {
        return $this->hasMany(WeatherRecord::class, 'location_id');
    }
}
