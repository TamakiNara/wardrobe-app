<?php

namespace Tests\Feature;

use App\Services\Weather\FetchOpenMeteoWeatherForecastService;
use App\Services\Weather\FetchWeatherForecastException;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class FetchOpenMeteoWeatherForecastServiceTest extends TestCase
{
    public function test_open_meteo_forecast_can_be_parsed_for_matching_date(): void
    {
        Http::fake([
            'https://api.open-meteo.com/v1/jma*' => Http::response([
                'daily' => [
                    'time' => ['2026-05-02'],
                    'weather_code' => [61],
                    'temperature_2m_max' => [22.1],
                    'temperature_2m_min' => [13.4],
                    'precipitation_sum' => [3.2],
                    'rain_sum' => [3.2],
                    'snowfall_sum' => [0.0],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoWeatherForecastService::class);
        $forecast = $service->fetch(35.8617, 139.6455, 'Asia/Tokyo', '2026-05-02');

        $this->assertSame('2026-05-02', $forecast['weather_date']);
        $this->assertSame('rain', $forecast['weather_code']);
        $this->assertSame(61, $forecast['raw_weather_code']);
        $this->assertSame(22.1, $forecast['temperature_high']);
        $this->assertSame(13.4, $forecast['temperature_low']);
        $this->assertSame(3.2, $forecast['precipitation']);
        $this->assertSame(3.2, $forecast['rain_sum']);
        $this->assertSame(0.0, $forecast['snowfall_sum']);
        $this->assertSame('forecast_api', $forecast['source_type']);
        $this->assertSame('open_meteo_jma_forecast', $forecast['source_name']);
        $this->assertNull($forecast['raw_weather_text']);
    }

    public function test_open_meteo_forecast_uses_asia_tokyo_when_timezone_is_missing(): void
    {
        Http::fake([
            'https://api.open-meteo.com/v1/jma*' => Http::response([
                'daily' => [
                    'time' => ['2026-05-02'],
                    'weather_code' => [0],
                    'temperature_2m_max' => [24.0],
                    'temperature_2m_min' => [14.0],
                    'precipitation_sum' => [0.0],
                    'rain_sum' => [0.0],
                    'snowfall_sum' => [0.0],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoWeatherForecastService::class);
        $service->fetch(35.8617, 139.6455, null, '2026-05-02');

        Http::assertSent(function ($request): bool {
            return str_starts_with($request->url(), 'https://api.open-meteo.com/v1/jma')
                && str_contains($request->url(), 'timezone=Asia%2FTokyo');
        });
    }

    public function test_open_meteo_forecast_returns_null_precipitation_values_when_missing(): void
    {
        Http::fake([
            'https://api.open-meteo.com/v1/jma*' => Http::response([
                'daily' => [
                    'time' => ['2026-05-02'],
                    'weather_code' => [3],
                    'temperature_2m_max' => [19.0],
                    'temperature_2m_min' => [11.0],
                    'precipitation_sum' => [null],
                    'rain_sum' => [null],
                    'snowfall_sum' => [null],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoWeatherForecastService::class);
        $forecast = $service->fetch(35.8617, 139.6455, 'Asia/Tokyo', '2026-05-02');

        $this->assertSame('cloudy', $forecast['weather_code']);
        $this->assertNull($forecast['precipitation']);
        $this->assertNull($forecast['rain_sum']);
        $this->assertNull($forecast['snowfall_sum']);
    }

    public function test_open_meteo_forecast_throws_validation_error_when_date_is_missing(): void
    {
        Http::fake([
            'https://api.open-meteo.com/v1/jma*' => Http::response([
                'daily' => [
                    'time' => ['2026-05-03'],
                    'weather_code' => [0],
                    'temperature_2m_max' => [24.0],
                    'temperature_2m_min' => [14.0],
                    'precipitation_sum' => [0.0],
                    'rain_sum' => [0.0],
                    'snowfall_sum' => [0.0],
                ],
            ], 200),
        ]);

        $service = $this->app->make(FetchOpenMeteoWeatherForecastService::class);

        try {
            $service->fetch(35.8617, 139.6455, 'Asia/Tokyo', '2026-05-02');
            $this->fail('ValidationException was not thrown.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('weather_date', $exception->errors());
        }
    }

    public function test_open_meteo_forecast_throws_exception_when_upstream_api_fails(): void
    {
        Http::fake([
            'https://api.open-meteo.com/v1/jma*' => Http::response([], 500),
        ]);

        $service = $this->app->make(FetchOpenMeteoWeatherForecastService::class);

        $this->expectException(FetchWeatherForecastException::class);

        $service->fetch(35.8617, 139.6455, 'Asia/Tokyo', '2026-05-02');
    }
}
