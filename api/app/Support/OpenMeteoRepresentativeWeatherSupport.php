<?php

namespace App\Support;

class OpenMeteoRepresentativeWeatherSupport
{
    /**
     * @var array<string, array{start_hour: int, end_hour: int}>
     */
    private const TIME_BLOCKS = [
        'morning' => ['start_hour' => 6, 'end_hour' => 10],
        'daytime' => ['start_hour' => 10, 'end_hour' => 17],
        'night' => ['start_hour' => 17, 'end_hour' => 22],
    ];

    /**
     * @var array<string, int>
     */
    private const WEATHER_PRIORITY = [
        'thunder' => 0,
        'snow' => 1,
        'rain' => 2,
        'fog' => 3,
        'windy' => 4,
        'cloudy' => 5,
        'sunny' => 6,
        'other' => 7,
    ];

    /**
     * @param  array{
     *     time?: mixed,
     *     weather_code?: mixed,
     *     precipitation?: mixed
     * }  $hourly
     * @return array{
     *     time_block_weather: array{
     *         morning: string|null,
     *         daytime: string|null,
     *         night: string|null
     *     },
     *     representative_weather_code: string|null,
     *     has_rain_in_time_blocks: bool
     * }
     */
    public static function summarizeHourlyWeather(array $hourly, string $weatherDate, ?string $dailyWeatherCode = null): array
    {
        $votesByBlock = [
            'morning' => [],
            'daytime' => [],
            'night' => [],
        ];
        $hasRainInTimeBlocks = false;

        $time = $hourly['time'] ?? null;
        $weatherCodes = $hourly['weather_code'] ?? null;
        $precipitation = $hourly['precipitation'] ?? null;

        if (! is_array($time) || ! is_array($weatherCodes)) {
            return [
                'time_block_weather' => [
                    'morning' => null,
                    'daytime' => null,
                    'night' => null,
                ],
                'representative_weather_code' => $dailyWeatherCode,
                'has_rain_in_time_blocks' => false,
            ];
        }

        foreach ($time as $index => $timestamp) {
            if (! is_string($timestamp) || ! str_starts_with($timestamp, $weatherDate.'T')) {
                continue;
            }

            $hour = self::extractHour($timestamp);

            if ($hour === null) {
                continue;
            }

            $block = self::resolveTimeBlock($hour);

            if ($block === null) {
                continue;
            }

            $rawWeatherCode = $weatherCodes[$index] ?? null;
            $appWeatherCode = WeatherRecordSupport::normalizeOpenMeteoWeatherCodeToWeatherCode($rawWeatherCode);
            $precipitationValue = self::normalizeFloatValue($precipitation[$index] ?? null);

            if (self::isRainRiskWeather($appWeatherCode, $precipitationValue)) {
                $hasRainInTimeBlocks = true;
            }

            $votesByBlock[$block][] = self::normalizeHourlyVoteWeatherCode(
                $appWeatherCode,
                $precipitationValue,
            );
        }

        $timeBlockWeather = [
            'morning' => self::resolveBlockRepresentativeWeatherCode($votesByBlock['morning']),
            'daytime' => self::resolveBlockRepresentativeWeatherCode($votesByBlock['daytime']),
            'night' => self::resolveBlockRepresentativeWeatherCode($votesByBlock['night']),
        ];

        return [
            'time_block_weather' => $timeBlockWeather,
            'representative_weather_code' => self::resolveRepresentativeWeatherCode(
                $timeBlockWeather,
                $dailyWeatherCode,
            ),
            'has_rain_in_time_blocks' => $hasRainInTimeBlocks,
        ];
    }

    private static function extractHour(string $timestamp): ?int
    {
        if (! preg_match('/T(\d{2}):\d{2}/', $timestamp, $matches)) {
            return null;
        }

        return (int) $matches[1];
    }

    private static function resolveTimeBlock(int $hour): ?string
    {
        foreach (self::TIME_BLOCKS as $name => $definition) {
            if ($hour >= $definition['start_hour'] && $hour < $definition['end_hour']) {
                return $name;
            }
        }

        return null;
    }

    private static function normalizeFloatValue(mixed $value): ?float
    {
        if (! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }

    private static function isRainRiskWeather(string $appWeatherCode, ?float $precipitation): bool
    {
        if ($appWeatherCode === 'thunder') {
            return true;
        }

        if ($appWeatherCode !== 'rain') {
            return false;
        }

        return $precipitation !== null && $precipitation > 0;
    }

    private static function normalizeHourlyVoteWeatherCode(string $appWeatherCode, ?float $precipitation): string
    {
        if ($appWeatherCode === 'rain' && ($precipitation === null || $precipitation <= 0)) {
            return 'cloudy';
        }

        return $appWeatherCode;
    }

    /**
     * @param  list<string>  $weatherCodes
     */
    private static function resolveBlockRepresentativeWeatherCode(array $weatherCodes): ?string
    {
        if ($weatherCodes === []) {
            return null;
        }

        $counts = [];

        foreach ($weatherCodes as $weatherCode) {
            $counts[$weatherCode] = ($counts[$weatherCode] ?? 0) + 1;
        }

        $bestWeatherCode = null;
        $bestCount = -1;
        $bestPriority = PHP_INT_MAX;

        foreach ($counts as $weatherCode => $count) {
            $priority = self::WEATHER_PRIORITY[$weatherCode] ?? self::WEATHER_PRIORITY['other'];

            if ($count > $bestCount || ($count === $bestCount && $priority < $bestPriority)) {
                $bestWeatherCode = $weatherCode;
                $bestCount = $count;
                $bestPriority = $priority;
            }
        }

        return is_string($bestWeatherCode) ? $bestWeatherCode : null;
    }

    /**
     * @param  array{
     *     morning: string|null,
     *     daytime: string|null,
     *     night: string|null
     * }  $timeBlockWeather
     */
    private static function resolveRepresentativeWeatherCode(array $timeBlockWeather, ?string $dailyWeatherCode): ?string
    {
        return $timeBlockWeather['daytime']
            ?? $timeBlockWeather['morning']
            ?? $timeBlockWeather['night']
            ?? $dailyWeatherCode;
    }
}
