<?php

namespace App\Services\Weather;

use App\Support\OpenMeteoRepresentativeWeatherSupport;
use App\Support\WeatherRecordSupport;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class FetchOpenMeteoHistoricalWeatherService
{
    public function __construct(
        private readonly HttpFactory $http,
    ) {}

    /**
     * @return array{
     *     weather_date: string,
     *     weather_code: string,
     *     raw_weather_code: int|null,
     *     temperature_high: float|null,
     *     temperature_low: float|null,
     *     precipitation: float|null,
     *     rain_sum: float|null,
     *     snowfall_sum: float|null,
     *     precipitation_hours: float|null,
     *     time_block_weather: array{
     *         morning: string|null,
     *         daytime: string|null,
     *         night: string|null
     *     }|null,
     *     has_rain_in_time_blocks: bool,
     *     source_type: string,
     *     source_name: string,
     *     source_fetched_at: string,
     *     raw_weather_text: null
     * }
     */
    public function fetch(
        float $latitude,
        float $longitude,
        ?string $timezone,
        string $weatherDate,
        array $logContext = [],
    ): array {
        $startedAt = microtime(true);
        $resolvedTimezone = $this->resolveTimezone($timezone);
        $baseContext = $this->buildBaseLogContext(
            $latitude,
            $longitude,
            $resolvedTimezone,
            $weatherDate,
            $logContext,
        );

        try {
            $response = $this->http
                ->acceptJson()
                ->timeout(10)
                ->get('https://archive-api.open-meteo.com/v1/archive', [
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'timezone' => $resolvedTimezone,
                    'start_date' => $weatherDate,
                    'end_date' => $weatherDate,
                    'daily' => implode(',', [
                        'weather_code',
                        'temperature_2m_max',
                        'temperature_2m_min',
                        'precipitation_sum',
                        'rain_sum',
                        'snowfall_sum',
                        'precipitation_hours',
                    ]),
                    'hourly' => implode(',', [
                        'weather_code',
                        'precipitation',
                    ]),
                ])
                ->throw();
        } catch (RequestException $exception) {
            Log::warning('weather.historical.fetch.failed', [
                ...$baseContext,
                'result' => 'failed',
                'http_status' => $exception->response?->status(),
                'exception_class' => $exception::class,
                'message' => $exception->getMessage(),
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);

            throw new FetchWeatherForecastException(
                'Open-Meteo Historical から実績データを取得できませんでした。時間をおいて再度お試しください。'
            );
        }

        $payload = $response->json();

        if (! is_array($payload)) {
            Log::warning('weather.historical.fetch.failed', [
                ...$baseContext,
                'result' => 'invalid_response',
                'reason' => 'payload_not_array',
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);

            throw new FetchWeatherForecastException(
                'Open-Meteo Historical のレスポンスを解釈できませんでした。'
            );
        }

        $daily = $payload['daily'] ?? null;

        if (! is_array($daily)) {
            Log::warning('weather.historical.fetch.failed', [
                ...$baseContext,
                'result' => 'invalid_response',
                'reason' => 'missing_daily',
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);

            throw new FetchWeatherForecastException(
                'Open-Meteo Historical の daily データを取得できませんでした。'
            );
        }

        $time = $daily['time'] ?? null;

        if (! is_array($time)) {
            Log::warning('weather.historical.fetch.failed', [
                ...$baseContext,
                'result' => 'invalid_response',
                'reason' => 'missing_daily_time',
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);

            throw new FetchWeatherForecastException(
                'Open-Meteo Historical の対象日一覧を取得できませんでした。'
            );
        }

        $index = array_search($weatherDate, $time, true);

        if (! is_int($index)) {
            Log::warning('weather.historical.fetch.failed', [
                ...$baseContext,
                'result' => 'not_found',
                'reason' => 'missing_weather_date',
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);

            throw ValidationException::withMessages([
                'weather_date' => '指定した日付の実績データが見つかりませんでした。',
            ]);
        }

        $rawWeatherCode = $this->normalizeIntValue($daily['weather_code'][$index] ?? null);
        $dailyWeatherCode = WeatherRecordSupport::normalizeOpenMeteoWeatherCodeToWeatherCode($rawWeatherCode);
        $hourlySummary = OpenMeteoRepresentativeWeatherSupport::summarizeHourlyWeather(
            is_array($payload['hourly'] ?? null) ? $payload['hourly'] : [],
            $weatherDate,
            $dailyWeatherCode,
        );

        return [
            'weather_date' => $weatherDate,
            'weather_code' => $hourlySummary['representative_weather_code'] ?? $dailyWeatherCode,
            'raw_weather_code' => $rawWeatherCode,
            'temperature_high' => $this->normalizeFloatValue($daily['temperature_2m_max'][$index] ?? null),
            'temperature_low' => $this->normalizeFloatValue($daily['temperature_2m_min'][$index] ?? null),
            'precipitation' => $this->normalizeFloatValue($daily['precipitation_sum'][$index] ?? null),
            'rain_sum' => $this->normalizeFloatValue($daily['rain_sum'][$index] ?? null),
            'snowfall_sum' => $this->normalizeFloatValue($daily['snowfall_sum'][$index] ?? null),
            'precipitation_hours' => $this->normalizeFloatValue($daily['precipitation_hours'][$index] ?? null),
            'time_block_weather' => $hourlySummary['time_block_weather'],
            'has_rain_in_time_blocks' => $hourlySummary['has_rain_in_time_blocks'],
            'source_type' => 'historical_api',
            'source_name' => 'open_meteo_historical',
            'source_fetched_at' => CarbonImmutable::now()->toIso8601String(),
            'raw_weather_text' => null,
        ];
    }

    private function resolveTimezone(?string $timezone): string
    {
        $normalized = trim((string) ($timezone ?? ''));

        return $normalized === '' ? 'Asia/Tokyo' : $normalized;
    }

    private function normalizeIntValue(mixed $value): ?int
    {
        if (! is_numeric($value)) {
            return null;
        }

        return (int) round((float) $value);
    }

    private function normalizeFloatValue(mixed $value): ?float
    {
        if (! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }

    private function buildBaseLogContext(
        float $latitude,
        float $longitude,
        string $timezone,
        string $weatherDate,
        array $logContext,
    ): array {
        return array_merge([
            'operation' => 'weather.historical.fetch.failed',
            'provider' => 'open_meteo',
            'source_type' => 'historical',
            'weather_date' => $weatherDate,
            'latitude' => round($latitude, 4),
            'longitude' => round($longitude, 4),
            'timezone' => $timezone,
        ], $logContext);
    }

    private function elapsedMilliseconds(float $startedAt): int
    {
        return (int) round((microtime(true) - $startedAt) * 1000);
    }
}
