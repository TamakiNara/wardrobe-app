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
            ], 200),
            'https://www.jma.go.jp/*' => Http::response([], 500),
            'https://weather.tsukumijima.net/*' => Http::response([], 500),
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
            ->assertJsonPath('forecast.weather_code', 'rain')
            ->assertJsonPath('forecast.raw_weather_code', 61)
            ->assertJsonPath('forecast.temperature_high', 22.1)
            ->assertJsonPath('forecast.temperature_low', 13.4)
            ->assertJsonPath('forecast.precipitation', 3.2)
            ->assertJsonPath('forecast.rain_sum', 3.2)
            ->assertJsonPath('forecast.snowfall_sum', 0)
            ->assertJsonPath('forecast.source_name', 'open_meteo_jma_forecast')
            ->assertJsonPath('forecast.raw_telop', null);

        Http::assertSentCount(1);
        Http::assertSent(fn ($request): bool => str_starts_with($request->url(), 'https://api.open-meteo.com/v1/jma'));
    }

    public function test_weather_forecast_falls_back_to_jma_when_coordinates_are_missing(): void
    {
        Http::fake([
            'https://www.jma.go.jp/bosai/forecast/data/forecast/110000.json' => Http::response($this->buildJmaForecastPayload(), 200),
            'https://api.open-meteo.com/*' => Http::response([], 500),
            'https://weather.tsukumijima.net/*' => Http::response([], 500),
        ]);

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口 JMA',
            'forecast_area_code' => null,
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

        $response->assertOk()
            ->assertJsonPath('forecast.source_name', 'jma_forecast_json')
            ->assertJsonPath('forecast.weather_code', 'cloudy_then_rain')
            ->assertJsonPath('forecast.raw_weather_code', null)
            ->assertJsonPath('forecast.precipitation', null)
            ->assertJsonPath('forecast.raw_telop', '曇のち雨');
    }

    public function test_weather_forecast_falls_back_to_tsukumijima_when_only_legacy_code_exists(): void
    {
        Http::fake([
            'https://weather.tsukumijima.net/api/forecast/city/110010' => Http::response([
                'forecasts' => [
                    [
                        'date' => '2026-05-02',
                        'telop' => '晴れ',
                        'temperature' => [
                            'max' => ['celsius' => '24'],
                            'min' => ['celsius' => '12'],
                        ],
                    ],
                ],
            ], 200),
            'https://api.open-meteo.com/*' => Http::response([], 500),
            'https://www.jma.go.jp/*' => Http::response([], 500),
        ]);

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口 legacy',
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

        $response = $this->postJson('/api/weather-records/forecast', [
            'weather_date' => '2026-05-02',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('forecast.source_name', 'tsukumijima')
            ->assertJsonPath('forecast.weather_code', 'sunny')
            ->assertJsonPath('forecast.raw_weather_code', null)
            ->assertJsonPath('forecast.precipitation', null)
            ->assertJsonPath('forecast.raw_telop', '晴れ');
    }

    public function test_weather_forecast_returns_validation_error_when_no_provider_configuration_exists(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '未設定',
            'forecast_area_code' => null,
            'jma_forecast_region_code' => null,
            'jma_forecast_office_code' => null,
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
            ->assertJsonPath('errors.location_id.0', '予報区域の設定がありません。地域設定を確認してください。');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildJmaForecastPayload(): array
    {
        return [[
            'timeSeries' => [
                [
                    'timeDefines' => [
                        '2026-05-02T00:00:00+09:00',
                        '2026-05-03T00:00:00+09:00',
                    ],
                    'areas' => [
                        [
                            'area' => ['code' => '110010', 'name' => '埼玉県南部'],
                            'weathers' => ['曇のち雨', '晴れ'],
                            'weatherCodes' => ['212', '100'],
                        ],
                    ],
                ],
                [
                    'timeDefines' => [
                        '2026-05-02T00:00:00+09:00',
                        '2026-05-02T06:00:00+09:00',
                        '2026-05-02T12:00:00+09:00',
                        '2026-05-02T18:00:00+09:00',
                    ],
                    'areas' => [
                        [
                            'area' => ['code' => '110010', 'name' => '埼玉県南部'],
                            'pops' => ['10', '20', '60', '70'],
                        ],
                    ],
                ],
                [
                    'timeDefines' => [
                        '2026-05-02T00:00:00+09:00',
                        '2026-05-02T09:00:00+09:00',
                    ],
                    'areas' => [
                        [
                            'area' => ['code' => '43241', 'name' => 'さいたま'],
                            'temps' => ['13', '22'],
                        ],
                    ],
                ],
            ],
        ]];
    }
}
