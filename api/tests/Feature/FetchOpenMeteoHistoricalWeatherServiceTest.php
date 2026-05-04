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
                'hourly' => [
                    'time' => [
                        '2026-05-02T06:00',
                        '2026-05-02T07:00',
                        '2026-05-02T10:00',
                        '2026-05-02T11:00',
                        '2026-05-02T17:00',
                        '2026-05-02T18:00',
                    ],
                    'weather_code' => [61, 61, 3, 3, 0, 0],
                    'precipitation' => [1.0, 0.8, 0.0, 0.0, 0.0, 0.0],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoHistoricalWeatherService::class);
        $observed = $service->fetch(35.8617, 139.6455, 'Asia/Tokyo', '2026-05-02');

        $this->assertSame('2026-05-02', $observed['weather_date']);
        $this->assertSame('cloudy', $observed['weather_code']);
        $this->assertSame(61, $observed['raw_weather_code']);
        $this->assertSame(22.1, $observed['temperature_high']);
        $this->assertSame(13.4, $observed['temperature_low']);
        $this->assertSame(3.2, $observed['precipitation']);
        $this->assertSame(3.2, $observed['rain_sum']);
        $this->assertSame(0.0, $observed['snowfall_sum']);
        $this->assertSame(4.0, $observed['precipitation_hours']);
        $this->assertSame([
            'morning' => 'rain',
            'daytime' => 'cloudy',
            'night' => 'sunny',
        ], $observed['time_block_weather']);
        $this->assertTrue($observed['has_rain_in_time_blocks']);
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
                'hourly' => [
                    'time' => ['2026-05-02T10:00'],
                    'weather_code' => [0],
                    'precipitation' => [0.0],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoHistoricalWeatherService::class);
        $service->fetch(35.8617, 139.6455, null, '2026-05-02');

        Http::assertSent(function ($request): bool {
            return str_starts_with($request->url(), 'https://archive-api.open-meteo.com/v1/archive')
                && str_contains($request->url(), 'timezone=Asia%2FTokyo')
                && str_contains($request->url(), 'hourly=weather_code%2Cprecipitation');
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
                'hourly' => [
                    'time' => ['2026-05-02T10:00'],
                    'weather_code' => [45],
                    'precipitation' => [0.0],
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

    public function test_open_meteo_historical_uses_morning_when_daytime_block_is_missing(): void
    {
        Http::fake([
            'https://archive-api.open-meteo.com/v1/archive*' => Http::response([
                'daily' => [
                    'time' => ['2026-05-02'],
                    'weather_code' => [0],
                    'temperature_2m_max' => [20.0],
                    'temperature_2m_min' => [10.0],
                    'precipitation_sum' => [0.0],
                    'rain_sum' => [0.0],
                    'snowfall_sum' => [0.0],
                    'precipitation_hours' => [0.0],
                ],
                'hourly' => [
                    'time' => ['2026-05-02T06:00', '2026-05-02T07:00'],
                    'weather_code' => [61, 61],
                    'precipitation' => [1.1, 0.7],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoHistoricalWeatherService::class);
        $observed = $service->fetch(35.8617, 139.6455, 'Asia/Tokyo', '2026-05-02');

        $this->assertSame('rain', $observed['weather_code']);
        $this->assertSame('rain', $observed['time_block_weather']['morning']);
        $this->assertNull($observed['time_block_weather']['daytime']);
    }

    public function test_open_meteo_historical_falls_back_to_daily_weather_code_when_hourly_data_is_missing(): void
    {
        Http::fake([
            'https://archive-api.open-meteo.com/v1/archive*' => Http::response([
                'daily' => [
                    'time' => ['2026-05-02'],
                    'weather_code' => [3],
                    'temperature_2m_max' => [19.0],
                    'temperature_2m_min' => [11.0],
                    'precipitation_sum' => [0.0],
                    'rain_sum' => [0.0],
                    'snowfall_sum' => [0.0],
                    'precipitation_hours' => [0.0],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoHistoricalWeatherService::class);
        $observed = $service->fetch(35.8617, 139.6455, 'Asia/Tokyo', '2026-05-02');

        $this->assertSame('cloudy', $observed['weather_code']);
        $this->assertSame([
            'morning' => null,
            'daytime' => null,
            'night' => null,
        ], $observed['time_block_weather']);
        $this->assertFalse($observed['has_rain_in_time_blocks']);
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
