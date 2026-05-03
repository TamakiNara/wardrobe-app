<?php

namespace Tests\Feature;

use App\Services\Weather\FetchOpenMeteoHistoricalWeatherService;
use App\Services\Weather\FetchWeatherForecastException;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class FetchOpenMeteoHistoricalWeatherServiceTest extends TestCase
{
    public function test_open_meteo_historical_can_be_parsed_for_matching_date(): void
    {
        Http::fake([
            'https://archive-api.open-meteo.com/v1/archive*' => Http::response([
                'daily' => [
                    'time' => ['2026-05-02'],
                    'weather_code' => [61],
                    'temperature_2m_max' => [22.1],
                    'temperature_2m_min' => [13.4],
                    'precipitation_sum' => [3.2],
                    'rain_sum' => [3.2],
                    'snowfall_sum' => [0.0],
                    'precipitation_hours' => [4.0],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoHistoricalWeatherService::class);
        $observed = $service->fetch(35.8617, 139.6455, 'Asia/Tokyo', '2026-05-02');

        $this->assertSame('2026-05-02', $observed['weather_date']);
        $this->assertSame('rain', $observed['weather_code']);
        $this->assertSame(61, $observed['raw_weather_code']);
        $this->assertSame(22.1, $observed['temperature_high']);
        $this->assertSame(13.4, $observed['temperature_low']);
        $this->assertSame(3.2, $observed['precipitation']);
        $this->assertSame(3.2, $observed['rain_sum']);
        $this->assertSame(0.0, $observed['snowfall_sum']);
        $this->assertSame(4.0, $observed['precipitation_hours']);
        $this->assertSame('historical_api', $observed['source_type']);
        $this->assertSame('open_meteo_historical', $observed['source_name']);
        $this->assertNull($observed['raw_weather_text']);
    }

    public function test_open_meteo_historical_uses_asia_tokyo_when_timezone_is_missing(): void
    {
        Http::fake([
            'https://archive-api.open-meteo.com/v1/archive*' => Http::response([
                'daily' => [
                    'time' => ['2026-05-02'],
                    'weather_code' => [0],
                    'temperature_2m_max' => [24.0],
                    'temperature_2m_min' => [14.0],
                    'precipitation_sum' => [0.0],
                    'rain_sum' => [0.0],
                    'snowfall_sum' => [0.0],
                    'precipitation_hours' => [0.0],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoHistoricalWeatherService::class);
        $service->fetch(35.8617, 139.6455, null, '2026-05-02');

        Http::assertSent(function ($request): bool {
            return str_starts_with($request->url(), 'https://archive-api.open-meteo.com/v1/archive')
                && str_contains($request->url(), 'timezone=Asia%2FTokyo');
        });
    }

    public function test_open_meteo_historical_returns_null_precipitation_values_when_missing(): void
    {
        Http::fake([
            'https://archive-api.open-meteo.com/v1/archive*' => Http::response([
                'daily' => [
                    'time' => ['2026-05-02'],
                    'weather_code' => [45],
                    'temperature_2m_max' => [19.0],
                    'temperature_2m_min' => [11.0],
                    'precipitation_sum' => [null],
                    'rain_sum' => [null],
                    'snowfall_sum' => [null],
                    'precipitation_hours' => [null],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoHistoricalWeatherService::class);
        $observed = $service->fetch(35.8617, 139.6455, 'Asia/Tokyo', '2026-05-02');

        $this->assertSame('fog', $observed['weather_code']);
        $this->assertNull($observed['precipitation']);
        $this->assertNull($observed['rain_sum']);
        $this->assertNull($observed['snowfall_sum']);
        $this->assertNull($observed['precipitation_hours']);
    }

    public function test_open_meteo_historical_throws_validation_error_when_date_is_missing(): void
    {
        Http::fake([
            'https://archive-api.open-meteo.com/v1/archive*' => Http::response([
                'daily' => [
                    'time' => ['2026-05-03'],
                    'weather_code' => [0],
                    'temperature_2m_max' => [24.0],
                    'temperature_2m_min' => [14.0],
                    'precipitation_sum' => [0.0],
                    'rain_sum' => [0.0],
                    'snowfall_sum' => [0.0],
                    'precipitation_hours' => [0.0],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoHistoricalWeatherService::class);

        try {
            $service->fetch(35.8617, 139.6455, 'Asia/Tokyo', '2026-05-02');
            $this->fail('ValidationException was not thrown.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('weather_date', $exception->errors());
        }
    }

    public function test_open_meteo_historical_throws_exception_when_upstream_api_fails(): void
    {
        Http::fake([
            'https://archive-api.open-meteo.com/v1/archive*' => Http::response([], 500),
        ]);

        $service = $this->app->make(FetchOpenMeteoHistoricalWeatherService::class);

        $this->expectException(FetchWeatherForecastException::class);

        $service->fetch(35.8617, 139.6455, 'Asia/Tokyo', '2026-05-02');
    }
}
