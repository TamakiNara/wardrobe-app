<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserWeatherLocation;
use App\Models\WeatherRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $firstResponse->assertCreated()
            ->assertJsonPath('location.name', '川口')
            ->assertJsonPath('location.is_default', true)
            ->assertJsonPath('location.display_order', 1);

        $firstLocation = UserWeatherLocation::query()->firstOrFail();

        $secondResponse = $this->postJson('/api/settings/weather-locations', [
            'name' => '東京23区',
            'forecast_area_code' => '130010',
            'is_default' => true,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $secondResponse->assertCreated()
            ->assertJsonPath('location.name', '東京23区')
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
            'weather_condition' => 'sunny',
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
            'weather_condition' => 'sunny',
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
            'weather_condition' => 'cloudy',
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
            'weather_condition' => 'rain',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $duplicateResponse->assertStatus(422)
            ->assertJsonValidationErrors(['location_name']);

        $invalidTemperatureResponse = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-04-29',
            'location_id' => $firstLocation->id,
            'weather_condition' => 'sunny',
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
            'weather_condition' => 'foggy',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $invalidConditionResponse->assertStatus(422)
            ->assertJsonValidationErrors(['weather_condition']);

        $listResponse = $this->getJson('/api/weather-records?date=2026-04-30', [
            'Accept' => 'application/json',
        ]);

        $listResponse->assertOk()
            ->assertJsonCount(2, 'weatherRecords')
            ->assertJsonPath('weatherRecords.0.location_name', '川口')
            ->assertJsonPath('weatherRecords.1.location_name', '東京23区');

        $firstRecordId = (int) $createFirstResponse->json('weatherRecord.id');
        $updateResponse = $this->patchJson("/api/weather-records/{$firstRecordId}", [
            'weather_condition' => 'rain',
            'temperature_high' => 20,
            'temperature_low' => 12,
            'memo' => '夕方から雨',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('weatherRecord.weather_condition', 'rain')
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
            'weather_condition' => 'cloudy',
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
            'weather_condition' => 'cloudy',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertCreated();

        $duplicateResponse = $this->postJson('/api/weather-records', [
            'weather_date' => '2026-05-01',
            'location_id' => null,
            'location_name' => '旅行先',
            'weather_condition' => 'rain',
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
            'weather_condition' => 'rain',
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
}
