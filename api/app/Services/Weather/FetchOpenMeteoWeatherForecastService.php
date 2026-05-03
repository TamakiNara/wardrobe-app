<?php

namespace App\Services\Weather;

use App\Support\WeatherRecordSupport;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\RequestException;
use Illuminate\Validation\ValidationException;

class FetchOpenMeteoWeatherForecastService
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
    ): array {
        $resolvedTimezone = $this->resolveTimezone($timezone);

        try {
            $response = $this->http
                ->acceptJson()
                ->timeout(10)
                ->get('https://api.open-meteo.com/v1/jma', [
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
                    ]),
                ])
                ->throw();
        } catch (RequestException) {
            throw new FetchWeatherForecastException(
                'Open-Meteo から天気予報を取得できませんでした。時間をおいて再度お試しください。'
            );
        }

        $payload = $response->json();

        if (! is_array($payload)) {
            throw new FetchWeatherForecastException(
                'Open-Meteo の予報レスポンスを解釈できませんでした。'
            );
        }

        $daily = $payload['daily'] ?? null;

        if (! is_array($daily)) {
            throw new FetchWeatherForecastException(
                'Open-Meteo の daily 予報を取得できませんでした。'
            );
        }

        $time = $daily['time'] ?? null;

        if (! is_array($time)) {
            throw new FetchWeatherForecastException(
                'Open-Meteo の daily 日付を取得できませんでした。'
            );
        }

        $index = array_search($weatherDate, $time, true);

        if (! is_int($index)) {
            throw ValidationException::withMessages([
                'weather_date' => '指定した日付の Open-Meteo 予報が見つかりませんでした。',
            ]);
        }

        $rawWeatherCode = $this->normalizeIntValue($daily['weather_code'][$index] ?? null);

        return [
            'weather_date' => $weatherDate,
            'weather_code' => WeatherRecordSupport::normalizeOpenMeteoWeatherCodeToWeatherCode($rawWeatherCode),
            'raw_weather_code' => $rawWeatherCode,
            'temperature_high' => $this->normalizeFloatValue($daily['temperature_2m_max'][$index] ?? null),
            'temperature_low' => $this->normalizeFloatValue($daily['temperature_2m_min'][$index] ?? null),
            'precipitation' => $this->normalizeFloatValue($daily['precipitation_sum'][$index] ?? null),
            'rain_sum' => $this->normalizeFloatValue($daily['rain_sum'][$index] ?? null),
            'snowfall_sum' => $this->normalizeFloatValue($daily['snowfall_sum'][$index] ?? null),
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
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
}
