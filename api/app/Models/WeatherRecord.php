<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeatherRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'weather_date',
        'location_id',
        'location_name_snapshot',
        'forecast_area_code_snapshot',
        'weather_code',
        'temperature_high',
        'temperature_low',
        'memo',
        'source_type',
        'source_name',
        'source_fetched_at',
    ];

    protected $casts = [
        'weather_date' => 'date:Y-m-d',
        'temperature_high' => 'float',
        'temperature_low' => 'float',
        'source_fetched_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(UserWeatherLocation::class, 'location_id');
    }
}
