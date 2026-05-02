<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserWeatherLocation;
use App\Models\WeatherRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WeatherEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function issueCsrfToken(): string
    {
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        return session()->token();
    }

    public function test_weather_locations_can_be_created_updated_deleted_and_keep_a_single_default(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();

        $this->actingAs($user, 'web');

        $firstResponse = $this->postJson('/api/settings/weather-locations', [
            'name' => '川口',
            'forecast_area_code' => '110000',
            'jma_forecast_region_code' => '110010',
            'jma_forecast_office_code' => '110000',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $firstResponse->assertCreated()
            ->assertJsonPath('location.name', '川口')
            ->assertJsonPath('location.jma_forecast_region_code', '110010')
            ->assertJsonPath('location.jma_forecast_office_code', '110000')
            ->assertJsonPath('location.is_default', true)
            ->assertJsonPath('location.display_order', 1);

        $firstLocation = UserWeatherLocation::query()->firstOrFail();

        $secondResponse = $this->postJson('/api/settings/weather-locations', [
            'name' => '東京23区',
            'forecast_area_code' => '130010',
            'jma_forecast_region_code' => '130010',
            'jma_forecast_office_code' => '130000',
            'is_default' => true,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $secondResponse->assertCreated()
            ->assertJsonPath('location.name', '東京23区')
            ->assertJsonPath('location.jma_forecast_region_code', '130010')
            ->assertJsonPath('location.jma_forecast_office_code', '130000')
            ->assertJsonPath('location.is_default', true)
            ->assertJsonPath('location.display_order', 2);

        $firstLocation->refresh();
        $secondLocation = UserWeatherLocation::query()
            ->where('name', '東京23区')
            ->firstOrFail();

        $this->assertFalse($firstLocation->is_default);
        $this->assertTrue($secondLocation->is_default);

        $updateResponse = $this->patchJson("/api/settings/weather-locations/{$firstLocation->id}", [
            'is_default' => true,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('location.id', $firstLocation->id)
            ->assertJsonPath('location.is_default', true);

        $firstLocation->refresh();
        $secondLocation->refresh();

        $this->assertTrue($firstLocation->is_default);
        $this->assertFalse($secondLocation->is_default);

        $deleteResponse = $this->deleteJson("/api/settings/weather-locations/{$firstLocation->id}", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $deleteResponse->assertOk();

        $this->assertDatabaseMissing('user_weather_locations', [
            'id' => $firstLocation->id,
        ]);

        $secondLocation->refresh();
        $this->assertTrue($secondLocation->is_default);
    }

    public function test_weather_location_with_records_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();

        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110000',
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-04-30',
            'location_id' => $location->id,
            'location_name_snapshot' => '川口',
            'forecast_area_code_snapshot' => '110000',
            'weather_code' => 'sunny',
            'temperature_high' => 22,
            'temperature_low' => 13,
            'memo' => null,
            'source_type' => 'manual',
            'source_name' => 'manual',
            'source_fetched_at' => null,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->deleteJson("/api/settings/weather-locations/{$location->id}", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['location']);
    }

    public function test_weather_location_forecast_area_code_can_be_cleared(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();

        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110010',
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->patchJson("/api/settings/weather-locations/{$location->id}", [
            'forecast_area_code' => null,
            'jma_forecast_region_code' => null,
            'jma_forecast_office_code' => null,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('location.forecast_area_code', null)
            ->assertJsonPath('location.jma_forecast_region_code', null)
            ->assertJsonPath('location.jma_forecast_office_code', null);

        $this->assertDatabaseHas('user_weather_locations', [
            'id' => $location->id,
            'forecast_area_code' => null,
            'jma_forecast_region_code' => null,
            'jma_forecast_office_code' => null,
        ]);
    }

    public function test_weather_location_rejects_inconsistent_jma_region_and_office_codes(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/settings/weather-locations', [
            'name' => '川口',
            'jma_forecast_region_code' => '110010',
            'jma_forecast_office_code' => '130000',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'jma_forecast_region_code',
                'jma_forecast_office_code',
            ]);
    }

    public function test_weather_records_can_be_created_listed_updated_and_deduplicated(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();

        $firstLocation = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110000',
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);
        $secondLocation = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '東京23区',
            'forecast_area_code' => '130010',
            'latitude' => null,
            'longitude' => null,
            'is_default' => false,
            'display_order' => 2,
        ]);

        $this->actingAs($user, 'web');

        $createFirstResponse = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-04-30',
            'location_id' => $firstLocation->id,
            'weather_code' => 'sunny',
            'temperature_high' => 22.5,
            'temperature_low' => 13.0,
            'memo' => '昼は日差しが強かった',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $createFirstResponse->assertCreated()
            ->assertJsonPath('weatherRecord.location_name', '川口')
            ->assertJsonPath('weatherRecord.location_name_snapshot', '川口')
            ->assertJsonPath('weatherRecord.source_type', 'manual')
            ->assertJsonPath('weatherRecord.source_name', 'manual');

        $createSecondResponse = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-04-30',
            'location_id' => $secondLocation->id,
            'weather_code' => 'cloudy_then_rain',
            'temperature_high' => null,
            'temperature_low' => 14.5,
            'memo' => null,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $createSecondResponse->assertCreated()
            ->assertJsonPath('weatherRecord.location_name', '東京23区');

        $duplicateResponse = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-04-30',
            'location_id' => $firstLocation->id,
            'weather_code' => 'rain',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $duplicateResponse->assertStatus(422)
            ->assertJsonValidationErrors(['location_name']);

        $invalidTemperatureResponse = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-04-29',
            'location_id' => $firstLocation->id,
            'weather_code' => 'sunny',
            'temperature_high' => 10,
            'temperature_low' => 18,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $invalidTemperatureResponse->assertStatus(422)
            ->assertJsonValidationErrors(['temperature_high']);

        $invalidConditionResponse = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-04-29',
            'location_id' => $firstLocation->id,
            'weather_code' => 'storm',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $invalidConditionResponse->assertStatus(422)
            ->assertJsonValidationErrors(['weather_code']);

        $listResponse = $this->getJson('/api/weather-records?date=2026-04-30', [
            'Accept' => 'application/json',
        ]);

        $listResponse->assertOk()
            ->assertJsonCount(2, 'weatherRecords')
            ->assertJsonPath('weatherRecords.0.location_name', '川口')
            ->assertJsonPath('weatherRecords.1.location_name', '東京23区');

        $firstRecordId = (int) $createFirstResponse->json('weatherRecord.id');
        $updateResponse = $this->patchJson("/api/weather-records/{$firstRecordId}", [
            'weather_code' => 'sunny_with_occasional_rain',
            'temperature_high' => 20,
            'temperature_low' => 12,
            'memo' => '夕方から雨',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('weatherRecord.weather_code', 'sunny_with_occasional_rain')
            ->assertJsonPath('weatherRecord.memo', '夕方から雨');
    }

    public function test_weather_records_can_be_created_with_temporary_location(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-05-01',
            'location_id' => null,
            'location_name' => '旅行先',
            'weather_code' => 'cloudy',
            'temperature_high' => 18.5,
            'temperature_low' => 11.0,
            'memo' => '一時的な地域',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('weatherRecord.location_id', null)
            ->assertJsonPath('weatherRecord.location_name', '旅行先')
            ->assertJsonPath('weatherRecord.location_name_snapshot', '旅行先')
            ->assertJsonPath('weatherRecord.forecast_area_code_snapshot', null);

        $this->assertDatabaseHas('weather_records', [
            'user_id' => $user->id,
            'weather_date' => '2026-05-01',
            'location_id' => null,
            'location_name_snapshot' => '旅行先',
        ]);
        $this->assertDatabaseCount('user_weather_locations', 0);
    }

    public function test_temporary_location_duplicates_are_rejected_on_same_date(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();

        $this->actingAs($user, 'web');

        $this->postJson('/api/weather-records', [
            'weather_date' => '2026-05-01',
            'location_id' => null,
            'location_name' => '旅行先',
            'weather_code' => 'cloudy',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertCreated();

        $duplicateResponse = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-05-01',
            'location_id' => null,
            'location_name' => '旅行先',
            'weather_code' => 'rain',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $duplicateResponse->assertStatus(422)
            ->assertJsonValidationErrors(['location_name']);
    }

    public function test_temporary_location_can_be_saved_as_registered_location(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-05-01',
            'location_id' => null,
            'location_name' => '出張先',
            'save_location' => true,
            'weather_code' => 'rain_then_cloudy',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated();

        $savedLocation = UserWeatherLocation::query()
            ->where('user_id', $user->id)
            ->where('name', '出張先')
            ->firstOrFail();

        $response->assertJsonPath('weatherRecord.location_id', $savedLocation->id)
            ->assertJsonPath('weatherRecord.location_name', '出張先');
    }

    public function test_weather_records_accept_composite_weather_codes(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();

        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110000',
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-05-02',
            'location_id' => $location->id,
            'weather_code' => 'cloudy_with_occasional_rain',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('weatherRecord.weather_code', 'cloudy_with_occasional_rain');

        $this->assertDatabaseHas('weather_records', [
            'user_id' => $user->id,
            'weather_date' => '2026-05-02',
            'weather_code' => 'cloudy_with_occasional_rain',
        ]);
    }

    public function test_weather_forecast_uses_jma_when_location_has_complete_jma_codes(): void
    {
        Http::fake([
            'https://www.jma.go.jp/bosai/forecast/data/forecast/110000.json' => Http::response(
                $this->buildJmaForecastPayload([
                    'area' => ['code' => '110010', 'name' => '埼玉県南部'],
                    'weathers' => ['晴れ', '曇のち雨', '晴れ'],
                    'weatherCodes' => ['100', '212', '100'],
                    'temps' => ['13', '22', '14', '24'],
                ]),
                200,
            ),
            'https://weather.tsukumijima.net/api/forecast/city/*' => Http::response([
                'forecasts' => [
                    [
                        'date' => '2026-05-01',
                        'telop' => '晴れ',
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110000',
            'jma_forecast_region_code' => '110010',
            'jma_forecast_office_code' => '110000',
            'latitude' => null,
            'longitude' => null,
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
            ->assertJsonPath('message', 'fetched')
            ->assertJsonPath('forecast.weather_code', 'cloudy_then_rain')
            ->assertJsonPath('forecast.temperature_high', 22)
            ->assertJsonPath('forecast.temperature_low', 13)
            ->assertJsonPath('forecast.source_type', 'forecast_api')
            ->assertJsonPath('forecast.source_name', 'jma_forecast_json')
            ->assertJsonPath('forecast.raw_telop', '曇のち雨');

        Http::assertSent(fn ($request) => $request->url() === 'https://www.jma.go.jp/bosai/forecast/data/forecast/110000.json');
        Http::assertNotSent(fn ($request) => str_starts_with($request->url(), 'https://weather.tsukumijima.net/api/forecast/city/'));
    }

    public function test_weather_forecast_falls_back_to_tsukumijima_when_jma_codes_are_missing(): void
    {
        Http::fake([
            'https://weather.tsukumijima.net/api/forecast/city/*' => Http::response([
                'forecasts' => [
                    [
                        'date' => '2026-05-01',
                        'telop' => '曇りのち雨',
                        'temperature' => [
                            'max' => ['celsius' => '22'],
                            'min' => ['celsius' => '13'],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110000',
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/forecast', [
            'weather_date' => '2026-05-01',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'fetched')
            ->assertJsonPath('forecast.weather_code', 'cloudy_then_rain')
            ->assertJsonPath('forecast.temperature_high', 22)
            ->assertJsonPath('forecast.temperature_low', 13)
            ->assertJsonPath('forecast.source_type', 'forecast_api')
            ->assertJsonPath('forecast.source_name', 'tsukumijima')
            ->assertJsonPath('forecast.raw_telop', '曇りのち雨');
    }

    public function test_weather_forecast_cannot_be_fetched_for_other_users_location(): void
    {
        Http::fake();

        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $otherUser->id,
            'name' => '東京23区',
            'forecast_area_code' => '130010',
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/forecast', [
            'weather_date' => '2026-05-01',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['location_id']);
    }

    public function test_weather_forecast_returns_validation_error_when_jma_codes_are_incomplete(): void
    {
        Http::fake();

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '出張先',
            'forecast_area_code' => '130010',
            'jma_forecast_region_code' => '130010',
            'jma_forecast_office_code' => null,
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/forecast', [
            'weather_date' => '2026-05-01',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['location_id'])
            ->assertJsonPath('errors.location_id.0', 'JMA予報区域の設定が不完全です。地域設定を確認してください。');
    }

    public function test_weather_forecast_requires_jma_or_legacy_forecast_codes(): void
    {
        Http::fake();

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '出張先',
            'forecast_area_code' => null,
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/forecast', [
            'weather_date' => '2026-05-01',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['location_id'])
            ->assertJsonPath('errors.location_id.0', '予報区域の設定がありません。地域設定を確認してください。');
    }

    public function test_weather_forecast_returns_error_when_date_is_not_in_forecasts(): void
    {
        Http::fake([
            'https://weather.tsukumijima.net/api/forecast/city/*' => Http::response([
                'forecasts' => [
                    [
                        'date' => '2026-05-02',
                        'telop' => '晴れ',
                        'temperature' => [
                            'max' => ['celsius' => '24'],
                            'min' => ['celsius' => '11'],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110000',
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/forecast', [
            'weather_date' => '2026-05-01',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['weather_date']);
    }

    public function test_weather_forecast_maps_unknown_telop_to_other_and_allows_partial_temperatures(): void
    {
        Http::fake([
            'https://weather.tsukumijima.net/api/forecast/city/*' => Http::response([
                'forecasts' => [
                    [
                        'date' => '2026-05-01',
                        'telop' => '雷',
                        'temperature' => [
                            'max' => ['celsius' => null],
                            'min' => ['celsius' => '9'],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110000',
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/forecast', [
            'weather_date' => '2026-05-01',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('forecast.weather_code', 'other')
            ->assertJsonPath('forecast.temperature_high', null)
            ->assertJsonPath('forecast.temperature_low', 9);
    }

    public function test_weather_forecast_maps_short_telop_variants(): void
    {
        Http::fake([
            'https://weather.tsukumijima.net/api/forecast/city/*' => Http::response([
                'forecasts' => [
                    [
                        'date' => '2026-05-01',
                        'telop' => '晴時々曇',
                        'temperature' => [
                            'max' => ['celsius' => '21'],
                            'min' => ['celsius' => '12'],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110010',
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/forecast', [
            'weather_date' => '2026-05-01',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('forecast.weather_code', 'sunny_with_occasional_clouds')
            ->assertJsonPath('forecast.raw_telop', '晴時々曇');
    }

    /**
     * @param  array{
     *     area: array{code: string, name: string},
     *     weathers: array<int, string>,
     *     weatherCodes: array<int, string>,
     *     temps: array<int, string>|null
     * }  $definition
     * @return array<int, array<string, mixed>>
     */
    private function buildJmaForecastPayload(array $definition): array
    {
        $payload = [
            [
                'publishingOffice' => '気象庁',
                'reportDatetime' => '2026-05-01T05:00:00+09:00',
                'timeSeries' => [
                    [
                        'timeDefines' => [
                            '2026-05-01T00:00:00+09:00',
                            '2026-05-02T00:00:00+09:00',
                            '2026-05-03T00:00:00+09:00',
                        ],
                        'areas' => [
                            [
                                'area' => $definition['area'],
                                'weathers' => $definition['weathers'],
                                'weatherCodes' => $definition['weatherCodes'],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        if ($definition['temps'] !== null) {
            $payload[] = [
                'publishingOffice' => '気象庁',
                'reportDatetime' => '2026-05-01T05:00:00+09:00',
                'timeSeries' => [
                    [
                        'timeDefines' => [
                            '2026-05-02T00:00:00+09:00',
                            '2026-05-02T09:00:00+09:00',
                            '2026-05-03T00:00:00+09:00',
                            '2026-05-03T09:00:00+09:00',
                        ],
                        'areas' => [
                            [
                                'area' => $definition['area'],
                                'temps' => $definition['temps'],
                            ],
                        ],
                    ],
                ],
            ];
        }

        return $payload;
    }

    public function test_weather_forecast_returns_error_when_upstream_api_fails(): void
    {
        Http::fake([
            'https://weather.tsukumijima.net/api/forecast/city/*' => Http::response([], 500),
        ]);

        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110000',
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records/forecast', [
            'weather_date' => '2026-05-01',
            'location_id' => $location->id,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(502)
            ->assertJsonPath('message', '天気情報を取得できませんでした。手入力で登録できます。');
    }

    public function test_weather_records_can_store_forecast_source_metadata(): void
    {
        $user = User::factory()->create();
        $token = $this->issueCsrfToken();
        $location = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110000',
            'latitude' => null,
            'longitude' => null,
            'is_default' => true,
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-05-03',
            'location_id' => $location->id,
            'weather_code' => 'sunny_then_cloudy',
            'source_type' => 'forecast_api',
            'source_name' => 'tsukumijima',
            'source_fetched_at' => '2026-05-01T10:00:00+09:00',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('weatherRecord.source_type', 'forecast_api')
            ->assertJsonPath('weatherRecord.source_name', 'tsukumijima')
            ->assertJsonPath('weatherRecord.source_fetched_at', '2026-05-01T10:00:00.000000Z');
    }
}
