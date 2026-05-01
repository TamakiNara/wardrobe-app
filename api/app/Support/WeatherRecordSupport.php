<?php

namespace App\Support;

class WeatherRecordSupport
{
    /**
     * @var array<int, array{
     *     code: string,
     *     label: string,
     *     primary_weather: string,
     *     icon: string,
     *     fallback_icon: string,
     *     has_rain_possibility: bool,
     *     accessory_icon: string|null
     * }>
     */
    public const WEATHER_CODE_DEFINITIONS = [
        [
            'code' => 'sunny',
            'label' => '晴れ',
            'primary_weather' => 'sunny',
            'icon' => 'Sun',
            'fallback_icon' => 'Sun',
            'has_rain_possibility' => false,
            'accessory_icon' => null,
        ],
        [
            'code' => 'cloudy',
            'label' => 'くもり',
            'primary_weather' => 'cloudy',
            'icon' => 'Cloud',
            'fallback_icon' => 'Cloud',
            'has_rain_possibility' => false,
            'accessory_icon' => null,
        ],
        [
            'code' => 'rain',
            'label' => '雨',
            'primary_weather' => 'rain',
            'icon' => 'CloudRain',
            'fallback_icon' => 'Cloud',
            'has_rain_possibility' => true,
            'accessory_icon' => 'Umbrella',
        ],
        [
            'code' => 'snow',
            'label' => '雪',
            'primary_weather' => 'snow',
            'icon' => 'CloudSnow',
            'fallback_icon' => 'Snowflake',
            'has_rain_possibility' => false,
            'accessory_icon' => null,
        ],
        [
            'code' => 'other',
            'label' => 'その他',
            'primary_weather' => 'other',
            'icon' => 'Cloud',
            'fallback_icon' => 'Cloud',
            'has_rain_possibility' => false,
            'accessory_icon' => null,
        ],
        [
            'code' => 'sunny_then_cloudy',
            'label' => '晴れのちくもり',
            'primary_weather' => 'sunny',
            'icon' => 'CloudSun',
            'fallback_icon' => 'Sun',
            'has_rain_possibility' => false,
            'accessory_icon' => null,
        ],
        [
            'code' => 'cloudy_then_sunny',
            'label' => 'くもりのち晴れ',
            'primary_weather' => 'cloudy',
            'icon' => 'CloudSun',
            'fallback_icon' => 'Cloud',
            'has_rain_possibility' => false,
            'accessory_icon' => null,
        ],
        [
            'code' => 'cloudy_then_rain',
            'label' => 'くもりのち雨',
            'primary_weather' => 'cloudy',
            'icon' => 'CloudRain',
            'fallback_icon' => 'Cloud',
            'has_rain_possibility' => true,
            'accessory_icon' => 'Umbrella',
        ],
        [
            'code' => 'rain_then_cloudy',
            'label' => '雨のちくもり',
            'primary_weather' => 'rain',
            'icon' => 'CloudRain',
            'fallback_icon' => 'Cloud',
            'has_rain_possibility' => true,
            'accessory_icon' => 'Umbrella',
        ],
        [
            'code' => 'sunny_with_occasional_clouds',
            'label' => '晴れ時々くもり',
            'primary_weather' => 'sunny',
            'icon' => 'CloudSun',
            'fallback_icon' => 'Sun',
            'has_rain_possibility' => false,
            'accessory_icon' => null,
        ],
        [
            'code' => 'cloudy_with_occasional_rain',
            'label' => 'くもり時々雨',
            'primary_weather' => 'cloudy',
            'icon' => 'CloudRain',
            'fallback_icon' => 'Cloud',
            'has_rain_possibility' => true,
            'accessory_icon' => 'Umbrella',
        ],
        [
            'code' => 'sunny_with_occasional_rain',
            'label' => '晴れ時々雨',
            'primary_weather' => 'sunny',
            'icon' => 'CloudSunRain',
            'fallback_icon' => 'CloudRain',
            'has_rain_possibility' => true,
            'accessory_icon' => 'Umbrella',
        ],
    ];

    public const SOURCE_TYPES = [
        'manual',
        'forecast_api',
        'historical_api',
    ];

    /**
     * @return list<string>
     */
    public static function weatherCodes(): array
    {
        return array_values(array_map(
            static fn (array $definition): string => $definition['code'],
            self::WEATHER_CODE_DEFINITIONS
        ));
    }

    /**
     * @return array<string, array{
     *     code: string,
     *     label: string,
     *     primary_weather: string,
     *     icon: string,
     *     fallback_icon: string,
     *     has_rain_possibility: bool,
     *     accessory_icon: string|null
     * }
     */
    public static function weatherCodeDefinitionsByCode(): array
    {
        $definitions = [];

        foreach (self::WEATHER_CODE_DEFINITIONS as $definition) {
            $definitions[$definition['code']] = $definition;
        }

        return $definitions;
    }

    public static function normalizeWeatherCodeForImport(mixed $value): mixed
    {
        if ($value === 'storm') {
            return 'other';
        }

        return $value;
    }

    public static function normalizeTelopToWeatherCode(?string $telop): string
    {
        if (! is_string($telop)) {
            return 'other';
        }

        $normalized = preg_replace('/\s+/u', '', trim($telop));

        if (! is_string($normalized) || $normalized === '') {
            return 'other';
        }

        return match ($normalized) {
            '晴れ' => 'sunny',
            'くもり', '曇り' => 'cloudy',
            '雨' => 'rain',
            '雪' => 'snow',
            '晴れのちくもり', '晴れのち曇り' => 'sunny_then_cloudy',
            'くもりのち晴れ', '曇りのち晴れ' => 'cloudy_then_sunny',
            'くもりのち雨', '曇りのち雨' => 'cloudy_then_rain',
            '雨のちくもり', '雨のち曇り' => 'rain_then_cloudy',
            '晴れ時々くもり', '晴れ時々曇り' => 'sunny_with_occasional_clouds',
            'くもり時々雨', '曇り時々雨' => 'cloudy_with_occasional_rain',
            '晴れ時々雨' => 'sunny_with_occasional_rain',
            default => 'other',
        };
    }

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
