<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserWeatherLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OpenMeteoObservedEndpointTest extends TestCase
{
    use RefreshDatabase;

    private function issueCsrfToken(): string
    {
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        return session()->token();
    }

    public function test_weather_observed_uses_open_meteo_historical_when_location_has_coordinates(): void
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

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口 observed',
            'forecast_area_code' => null,
            'jma_forecast_region_code' => null,
            'jma_forecast_office_code' => null,
            'latitude' => 35.8617,
            'longitude' => 139.6455,
            'timezone' => 'Asia/Tokyo',
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/observed', [
            'weather_date' => '2026-05-02',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('observed.location_name', '川口 observed')
            ->assertJsonPath('observed.weather_code', 'rain')
            ->assertJsonPath('observed.raw_weather_code', 61)
            ->assertJsonPath('observed.temperature_high', 22.1)
            ->assertJsonPath('observed.temperature_low', 13.4)
            ->assertJsonPath('observed.precipitation', 3.2)
            ->assertJsonPath('observed.rain_sum', 3.2)
            ->assertJsonPath('observed.snowfall_sum', 0)
            ->assertJsonPath('observed.precipitation_hours', 4)
            ->assertJsonPath('observed.source_type', 'historical_api')
            ->assertJsonPath('observed.source_name', 'open_meteo_historical')
            ->assertJsonPath('observed.raw_telop', null);
    }

    public function test_weather_observed_returns_validation_error_when_location_has_no_coordinates(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '位置情報なし observed',
            'forecast_area_code' => '110010',
            'jma_forecast_region_code' => null,
            'jma_forecast_office_code' => null,
            'latitude' => null,
            'longitude' => null,
            'timezone' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/observed', [
            'weather_date' => '2026-05-02',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.location_id.0', '位置情報を設定すると、実績を取得できます。');
    }

    public function test_weather_observed_returns_validation_error_when_coordinates_are_incomplete(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '不完全 observed',
            'forecast_area_code' => null,
            'jma_forecast_region_code' => null,
            'jma_forecast_office_code' => null,
            'latitude' => 35.8617,
            'longitude' => null,
            'timezone' => 'Asia/Tokyo',
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/observed', [
            'weather_date' => '2026-05-02',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.location_id.0', '位置情報の設定が不完全です。地域設定を確認してください。');
    }

    public function test_weather_observed_returns_bad_gateway_when_upstream_fails(): void
    {
        Http::fake([
            'https://archive-api.open-meteo.com/v1/archive*' => Http::response([], 500),
        ]);

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口 observed',
            'forecast_area_code' => null,
            'jma_forecast_region_code' => null,
            'jma_forecast_office_code' => null,
            'latitude' => 35.8617,
            'longitude' => 139.6455,
            'timezone' => 'Asia/Tokyo',
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/observed', [
            'weather_date' => '2026-05-02',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(502)
            ->assertJsonPath('message', 'Open-Meteo Historical から実績データを取得できませんでした。時間をおいて再度お試しください。');
    }
}
