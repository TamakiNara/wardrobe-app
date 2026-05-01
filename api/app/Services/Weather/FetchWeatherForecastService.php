<?php

namespace App\Services\Weather;

use App\Models\UserWeatherLocation;
use App\Support\WeatherRecordSupport;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\RequestException;
use Illuminate\Validation\ValidationException;

class FetchWeatherForecastService
{
    public function __construct(
        private readonly HttpFactory $http,
    ) {}

    /**
     * @return array{
     *     weather_date: string,
     *     location_id: int,
     *     location_name: string,
     *     forecast_area_code: string,
     *     weather_code: string,
     *     temperature_high: int|null,
     *     temperature_low: int|null,
     *     source_type: string,
     *     source_name: string,
     *     source_fetched_at: string,
     *     raw_telop: string|null
     * }
     */
    public function fetch(int $userId, int $locationId, string $weatherDate): array
    {
        $location = UserWeatherLocation::query()
            ->where('user_id', $userId)
            ->find($locationId);

        if ($location === null) {
            throw ValidationException::withMessages([
                'location_id' => '選択した地域が見つかりません。',
            ]);
        }

        $forecastAreaCode = trim((string) ($location->forecast_area_code ?? ''));

        if ($forecastAreaCode === '') {
            throw ValidationException::withMessages([
                'location_id' => '予報API用地域コードが設定された地域で取得できます。',
            ]);
        }

        try {
            $response = $this->http
                ->acceptJson()
                ->timeout(10)
                ->get("https://weather.tsukumijima.net/api/forecast/city/{$forecastAreaCode}")
                ->throw();
        } catch (RequestException) {
            throw new FetchWeatherForecastException(
                '天気情報を取得できませんでした。手入力で登録できます。'
            );
        }

        $payload = $response->json();
        $forecasts = is_array($payload['forecasts'] ?? null)
            ? $payload['forecasts']
            : null;

        if ($forecasts === null) {
            throw new FetchWeatherForecastException(
                '天気情報を取得できませんでした。手入力で登録できます。'
            );
        }

        $matchedForecast = collect($forecasts)
            ->first(static fn (mixed $forecast): bool => is_array($forecast)
                && ($forecast['date'] ?? null) === $weatherDate);

        if (! is_array($matchedForecast)) {
            throw ValidationException::withMessages([
                'weather_date' => '指定日の天気情報が取得できませんでした。手入力で登録できます。',
            ]);
        }

        $rawTelop = is_string($matchedForecast['telop'] ?? null)
            ? $matchedForecast['telop']
            : null;

        return [
            'weather_date' => $weatherDate,
            'location_id' => $location->id,
            'location_name' => $location->name,
            'forecast_area_code' => $forecastAreaCode,
            'weather_code' => WeatherRecordSupport::normalizeTelopToWeatherCode($rawTelop),
            'temperature_high' => $this->normalizeTemperatureValue($matchedForecast['temperature']['max']['celsius'] ?? null),
            'temperature_low' => $this->normalizeTemperatureValue($matchedForecast['temperature']['min']['celsius'] ?? null),
            'source_type' => 'forecast_api',
            'source_name' => 'tsukumijima',
            'source_fetched_at' => CarbonImmutable::now()->toIso8601String(),
            'raw_telop' => $rawTelop,
        ];
    }

    private function normalizeTemperatureValue(mixed $value): ?int
    {
        if (! is_string($value) && ! is_int($value) && ! is_float($value)) {
            return null;
        }

        if (! is_numeric((string) $value)) {
            return null;
        }

        return (int) round((float) $value);
    }
}
