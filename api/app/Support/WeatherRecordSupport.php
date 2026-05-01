<?php

namespace App\Support;

class WeatherRecordSupport
{
    public const WEATHER_CONDITIONS = [
        'sunny',
        'cloudy',
        'rain',
        'snow',
        'other',
    ];

    public const SOURCE_TYPES = [
        'manual',
        'forecast_api',
        'historical_api',
    ];

    public static function normalizeMemo(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    public static function normalizeLocationName(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
