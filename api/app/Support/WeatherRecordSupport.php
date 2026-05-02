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
            'icon' => 'Snowflake',
            'fallback_icon' => 'CloudSnow',
            'has_rain_possibility' => false,
            'accessory_icon' => null,
        ],
        [
            'code' => 'thunder',
            'label' => '雷',
            'primary_weather' => 'thunder',
            'icon' => 'CloudLightning',
            'fallback_icon' => 'Zap',
            'has_rain_possibility' => true,
            'accessory_icon' => 'Umbrella',
        ],
        [
            'code' => 'fog',
            'label' => '霧',
            'primary_weather' => 'fog',
            'icon' => 'CloudFog',
            'fallback_icon' => 'Cloud',
            'has_rain_possibility' => false,
            'accessory_icon' => null,
        ],
        [
            'code' => 'windy',
            'label' => '強風',
            'primary_weather' => 'windy',
            'icon' => 'Wind',
            'fallback_icon' => 'Cloud',
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
     * }>
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
        return self::normalizeWeatherTextToWeatherCode($telop);
    }

    public static function normalizeWeatherTextForDisplay(?string $weatherText): ?string
    {
        if (! is_string($weatherText)) {
            return null;
        }

        $normalized = str_replace("\u{3000}", ' ', trim($weatherText));
        $normalized = preg_replace('/\s+/u', ' ', $normalized);

        if (! is_string($normalized)) {
            return null;
        }

        $normalized = trim($normalized);

        return $normalized === '' ? null : $normalized;
    }

    public static function normalizeWeatherTextToWeatherCode(?string $weatherText): string
    {
        $normalized = self::normalizeWeatherText($weatherText);

        if ($normalized === null) {
            return 'other';
        }

        $directMatch = match ($normalized) {
            '晴' => 'sunny',
            '曇' => 'cloudy',
            '雨' => 'rain',
            '雪' => 'snow',
            '雷' => 'thunder',
            '霧' => 'fog',
            '強風' => 'windy',
            '晴のち曇' => 'sunny_then_cloudy',
            '曇のち晴' => 'cloudy_then_sunny',
            '曇のち雨' => 'cloudy_then_rain',
            '雨のち曇' => 'rain_then_cloudy',
            '晴時々曇' => 'sunny_with_occasional_clouds',
            '曇時々雨' => 'cloudy_with_occasional_rain',
            '曇一時雨' => 'cloudy_with_occasional_rain',
            '晴時々雨' => 'sunny_with_occasional_rain',
            '晴一時雨' => 'sunny_with_occasional_rain',
            default => null,
        };

        if (is_string($directMatch)) {
            return $directMatch;
        }

        return self::matchTransitionWeatherCode($normalized) ?? 'other';
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

    private static function normalizeWeatherText(?string $weatherText): ?string
    {
        $displayNormalized = self::normalizeWeatherTextForDisplay($weatherText);

        if ($displayNormalized === null) {
            return null;
        }

        $normalized = preg_replace('/\s+/u', '', $displayNormalized);

        if (! is_string($normalized) || $normalized === '') {
            return null;
        }

        return strtr($normalized, [
            '晴れ' => '晴',
            'はれ' => '晴',
            'くもり' => '曇',
            '曇り' => '曇',
        ]);
    }

    private static function matchTransitionWeatherCode(string $normalized): ?string
    {
        $transitionPatterns = [
            ['prefix' => '晴', 'suffix' => '曇', 'code' => 'sunny_then_cloudy'],
            ['prefix' => '曇', 'suffix' => '晴', 'code' => 'cloudy_then_sunny'],
            ['prefix' => '曇', 'suffix' => '雨', 'code' => 'cloudy_then_rain'],
            ['prefix' => '雨', 'suffix' => '曇', 'code' => 'rain_then_cloudy'],
        ];

        foreach ($transitionPatterns as $pattern) {
            if (
                str_starts_with($normalized, $pattern['prefix']) &&
                str_ends_with($normalized, $pattern['suffix'])
            ) {
                $middle = mb_substr(
                    $normalized,
                    mb_strlen($pattern['prefix']),
                    mb_strlen($normalized) - mb_strlen($pattern['prefix']) - mb_strlen($pattern['suffix'])
                );

                if (self::isSupportedTransitionMiddle($middle)) {
                    return $pattern['code'];
                }
            }
        }

        return null;
    }

    private static function isSupportedTransitionMiddle(string $middle): bool
    {
        if ($middle === '') {
            return false;
        }

        $normalizedMiddle = str_replace('から', '', $middle);

        return in_array($normalizedMiddle, [
            'のち',
            '夜のはじめ頃',
            '夕方',
            '昼過ぎ',
            '午後',
            '夜',
        ], true);
    }
}
