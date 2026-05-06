<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserWeatherLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OpenMeteoForecastEndpointTest extends TestCase
{
    use RefreshDatabase;

    private function issueCsrfToken(): string
    {
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        return session()->token();
    }

    public function test_weather_forecast_uses_open_meteo_when_location_has_coordinates(): void
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
                'hourly' => [
                    'time' => [
                        '2026-05-02T02:00',
                        '2026-05-02T03:00',
                        '2026-05-02T10:00',
                        '2026-05-02T11:00',
                        '2026-05-02T17:00',
                    ],
                    'weather_code' => [61, 61, 3, 3, 0],
                    'precipitation' => [2.0, 1.5, 0.0, 0.0, 0.0],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口 Open-Meteo',
            'forecast_area_code' => '110010',
            'jma_forecast_region_code' => '110010',
            'jma_forecast_office_code' => '110000',
            'latitude' => 35.8617,
            'longitude' => 139.6455,
            'timezone' => 'Asia/Tokyo',
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/forecast', [
            'weather_date' => '2026-05-02',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('forecast.location_name', '川口 Open-Meteo')
            ->assertJsonPath('forecast.weather_code', 'cloudy')
            ->assertJsonPath('forecast.raw_weather_code', 61)
            ->assertJsonPath('forecast.temperature_high', 22.1)
            ->assertJsonPath('forecast.temperature_low', 13.4)
            ->assertJsonPath('forecast.precipitation', 3.2)
            ->assertJsonPath('forecast.rain_sum', 3.2)
            ->assertJsonPath('forecast.snowfall_sum', 0)
            ->assertJsonPath('forecast.time_block_weather.morning', null)
            ->assertJsonPath('forecast.time_block_weather.daytime', 'cloudy')
            ->assertJsonPath('forecast.time_block_weather.night', 'sunny')
            ->assertJsonPath('forecast.has_rain_in_time_blocks', false)
            ->assertJsonPath('forecast.source_name', 'open_meteo_jma_forecast')
            ->assertJsonPath('forecast.raw_telop', null);

        Http::assertSentCount(1);
        Http::assertSent(fn ($request): bool => str_starts_with($request->url(), 'https://api.open-meteo.com/v1/jma'));
    }

    public function test_weather_forecast_returns_validation_error_when_location_has_no_coordinates(): void
    {
        Http::fake();

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '位置情報なし',
            'forecast_area_code' => '110010',
            'jma_forecast_region_code' => '110010',
            'jma_forecast_office_code' => '110000',
            'latitude' => null,
            'longitude' => null,
            'timezone' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/forecast', [
            'weather_date' => '2026-05-02',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.location_id.0', '位置情報を設定すると、天気を取得できます。');

        Http::assertNothingSent();
    }
}
