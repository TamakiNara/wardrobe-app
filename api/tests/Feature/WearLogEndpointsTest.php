<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use App\Models\UserWeatherLocation;
use App\Models\WearLog;
use App\Models\WeatherRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WearLogEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function issueCsrfToken(): string
    {
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        return session()->token();
    }

    private function createItem(User $user, array $overrides = []): Item
    {
        return Item::query()->create(array_merge([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => 'テストアイテム',
            'category' => 'tops',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
            'seasons' => ['春'],
            'tpos' => ['休日'],
            'spec' => null,
        ], $overrides));
    }

    private function createOutfit(User $user, array $overrides = []): Outfit
    {
        return Outfit::query()->create(array_merge([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '通勤コーディネート',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['仕事'],
        ], $overrides));
    }

    private function createWearLog(User $user, array $overrides = []): WearLog
    {
        return WearLog::query()->create(array_merge([
            'user_id' => $user->id,
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'memo' => null,
        ], $overrides));
    }

    public function test_get_wear_logs_returns_only_current_users_logs_sorted_by_event_date_and_display_order(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $later = $this->createWearLog($user, [
            'status' => 'worn',
            'event_date' => '2026-03-25',
            'display_order' => 2,
        ]);
        $earlierSameDay = $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-03-25',
            'display_order' => 1,
        ]);
        $older = $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-03-20',
            'display_order' => 1,
        ]);
        $this->createWearLog($otherUser, [
            'event_date' => '2026-03-26',
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/wear-logs', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(3, 'wearLogs')
            ->assertJsonPath('wearLogs.0.id', $earlierSameDay->id)
            ->assertJsonPath('wearLogs.1.id', $later->id)
            ->assertJsonPath('wearLogs.2.id', $older->id)
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.totalAll', 3);
    }

    public function test_get_wear_logs_supports_date_asc_sort_with_same_day_display_order(): void
    {
        $user = User::factory()->create();

        $older = $this->createWearLog($user, [
            'event_date' => '2026-03-20',
            'display_order' => 1,
        ]);
        $earlierSameDay = $this->createWearLog($user, [
            'event_date' => '2026-03-25',
            'display_order' => 1,
        ]);
        $laterSameDay = $this->createWearLog($user, [
            'event_date' => '2026-03-25',
            'display_order' => 2,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/wear-logs?sort=date_asc', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('wearLogs.0.id', $older->id)
            ->assertJsonPath('wearLogs.1.id', $earlierSameDay->id)
            ->assertJsonPath('wearLogs.2.id', $laterSameDay->id);
    }

    public function test_get_wear_logs_applies_keyword_status_date_filters_and_pagination(): void
    {
        $user = User::factory()->create();
        $sourceOutfit = $this->createOutfit($user, [
            'name' => '在宅コーデ',
        ]);
        $matchedItem = $this->createItem($user, [
            'name' => '在宅パンツ',
            'category' => 'bottoms',
            'shape' => 'straight',
        ]);

        for ($index = 1; $index <= 13; $index++) {
            $wearLog = $this->createWearLog($user, [
                'status' => 'planned',
                'event_date' => '2026-03-24',
                'display_order' => $index,
                'source_outfit_id' => $sourceOutfit->id,
                'memo' => sprintf('在宅メモ%02d', $index),
            ]);
            $wearLog->wearLogItems()->create([
                'source_item_id' => $matchedItem->id,
                'sort_order' => 1,
                'item_source_type' => 'manual',
            ]);
        }

        $excludedByDate = $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-03-23',
            'display_order' => 1,
            'source_outfit_id' => $sourceOutfit->id,
            'memo' => '在宅対象外日付',
        ]);
        $excludedByDate->wearLogItems()->create([
            'source_item_id' => $matchedItem->id,
            'sort_order' => 1,
            'item_source_type' => 'manual',
        ]);

        $excludedByStatus = $this->createWearLog($user, [
            'status' => 'worn',
            'event_date' => '2026-03-24',
            'display_order' => 20,
            'source_outfit_id' => $sourceOutfit->id,
            'memo' => '在宅対象外状態',
        ]);
        $excludedByStatus->wearLogItems()->create([
            'source_item_id' => $matchedItem->id,
            'sort_order' => 1,
            'item_source_type' => 'manual',
        ]);

        $otherUser = User::factory()->create();
        $otherWearLog = $this->createWearLog($otherUser, [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'memo' => '在宅他人分',
        ]);
        $otherWearLog->wearLogItems()->create([
            'source_item_id' => $this->createItem($otherUser, ['name' => '他人パンツ'])->id,
            'sort_order' => 1,
            'item_source_type' => 'manual',
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/wear-logs?keyword=%E5%9C%A8%E5%AE%85&status=planned&date_from=2026-03-24&date_to=2026-03-24&page=2', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'wearLogs')
            ->assertJsonPath('wearLogs.0.display_order', 13)
            ->assertJsonPath('meta.total', 13)
            ->assertJsonPath('meta.totalAll', 15)
            ->assertJsonPath('meta.page', 2)
            ->assertJsonPath('meta.lastPage', 2);
    }

    public function test_get_wear_logs_returns_thumbnail_items_from_wear_log_items_even_without_source_outfit(): void
    {
        $user = User::factory()->create();
        $top = $this->createItem($user, [
            'category' => 'tops',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
        ]);
        $bottom = $this->createItem($user, [
            'name' => 'ネイビーパンツ',
            'category' => 'bottoms',
            'shape' => 'pants',
            'spec' => [
                'bottoms' => [
                    'length_type' => 'full',
                ],
            ],
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#223355',
                'label' => 'ネイビー',
            ], [
                'role' => 'sub',
                'mode' => 'preset',
                'value' => 'gray',
                'hex' => '#bbbbbb',
                'label' => 'グレー',
            ]],
        ]);
        $wearLog = $this->createWearLog($user, [
            'source_outfit_id' => null,
        ]);
        $wearLog->wearLogItems()->createMany([
            [
                'source_item_id' => $top->id,
                'sort_order' => 1,
                'item_source_type' => 'manual',
            ],
            [
                'source_item_id' => $bottom->id,
                'sort_order' => 2,
                'item_source_type' => 'manual',
            ],
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/wear-logs', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('wearLogs.0.id', $wearLog->id)
            ->assertJsonPath('wearLogs.0.source_outfit_id', null)
            ->assertJsonCount(2, 'wearLogs.0.thumbnail_items')
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.category', 'tops')
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.shape', 'tshirt')
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.sort_order', 1)
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.spec', null)
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.colors.0.hex', '#eeeeee')
            ->assertJsonPath('wearLogs.0.thumbnail_items.1.category', 'bottoms')
            ->assertJsonPath('wearLogs.0.thumbnail_items.1.shape', 'pants')
            ->assertJsonPath('wearLogs.0.thumbnail_items.1.sort_order', 2)
            ->assertJsonPath('wearLogs.0.thumbnail_items.1.spec.bottoms.length_type', 'full')
            ->assertJsonPath('wearLogs.0.thumbnail_items.1.colors.1.hex', '#bbbbbb');
    }

    public function test_get_wear_log_calendar_returns_monthly_day_summaries_with_dots_and_overflow(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $first = $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-03-05',
            'display_order' => 1,
            'overall_rating' => 'good',
        ]);
        $second = $this->createWearLog($user, [
            'status' => 'worn',
            'event_date' => '2026-03-05',
            'display_order' => 2,
        ]);
        $third = $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-03-05',
            'display_order' => 3,
        ]);
        $fourth = $this->createWearLog($user, [
            'status' => 'worn',
            'event_date' => '2026-03-05',
            'display_order' => 4,
        ]);
        $otherDay = $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-03-10',
            'display_order' => 1,
        ]);
        $wearOnlyDay = $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-03-12',
            'display_order' => 1,
        ]);
        $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-04-01',
            'display_order' => 1,
        ]);
        $this->createWearLog($otherUser, [
            'status' => 'worn',
            'event_date' => '2026-03-05',
            'display_order' => 1,
        ]);
        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-05',
            'location_id' => null,
            'location_name_snapshot' => '川口',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'rain',
            'temperature_high' => 12.0,
            'temperature_low' => 6.0,
            'memo' => null,
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
            'source_fetched_at' => '2026-03-04T21:00:00+09:00',
        ]);
        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-10',
            'location_id' => null,
            'location_name_snapshot' => '川口',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'sunny',
            'temperature_high' => 16.0,
            'temperature_low' => 7.0,
            'memo' => null,
            'source_type' => 'manual',
            'source_name' => 'manual',
            'source_fetched_at' => null,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/wear-logs/calendar?month=2026-03', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('month', '2026-03')
            ->assertJsonCount(3, 'days')
            ->assertJsonPath('days.0.date', '2026-03-05')
            ->assertJsonPath('days.0.plannedCount', 2)
            ->assertJsonPath('days.0.wornCount', 2)
            ->assertJsonPath('days.0.has_feedback', true)
            ->assertJsonPath('days.0.weather.status', 'forecast')
            ->assertJsonPath('days.0.weather.weather_code', 'rain')
            ->assertJsonPath('days.0.weather.has_weather', true)
            ->assertJsonCount(3, 'days.0.dots')
            ->assertJsonPath('days.0.dots.0.status', $first->status)
            ->assertJsonPath('days.0.dots.0.has_feedback', true)
            ->assertJsonPath('days.0.dots.1.status', $second->status)
            ->assertJsonPath('days.0.dots.1.has_feedback', false)
            ->assertJsonPath('days.0.dots.2.status', $third->status)
            ->assertJsonPath('days.0.dots.2.has_feedback', false)
            ->assertJsonPath('days.0.overflowCount', 1)
            ->assertJsonPath('days.1.date', '2026-03-10')
            ->assertJsonPath('days.1.plannedCount', 1)
            ->assertJsonPath('days.1.wornCount', 0)
            ->assertJsonPath('days.1.has_feedback', false)
            ->assertJsonPath('days.1.weather.status', 'manual')
            ->assertJsonPath('days.1.weather.weather_code', 'sunny')
            ->assertJsonPath('days.1.weather.has_weather', true)
            ->assertJsonPath('days.1.dots.0.has_feedback', false)
            ->assertJsonPath('days.1.overflowCount', 0)
            ->assertJsonPath('days.2.date', '2026-03-12')
            ->assertJsonPath('days.2.plannedCount', 1)
            ->assertJsonPath('days.2.wornCount', 0)
            ->assertJsonPath('days.2.has_feedback', false)
            ->assertJsonPath('days.2.weather.status', 'none')
            ->assertJsonPath('days.2.weather.weather_code', null)
            ->assertJsonPath('days.2.weather.has_weather', false)
            ->assertJsonPath('days.2.dots.0.status', $wearOnlyDay->status)
            ->assertJsonPath('days.2.overflowCount', 0);
    }

    public function test_get_wear_log_calendar_prioritizes_observed_then_manual_then_forecast_and_includes_weather_only_days(): void
    {
        $user = User::factory()->create();

        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-11',
            'location_id' => null,
            'location_name_snapshot' => '川口',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'cloudy',
            'temperature_high' => 18.0,
            'temperature_low' => 10.0,
            'memo' => null,
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
            'source_fetched_at' => '2026-03-10T20:00:00+09:00',
        ]);
        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-11',
            'location_id' => null,
            'location_name_snapshot' => '川口',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'rain',
            'temperature_high' => 15.0,
            'temperature_low' => 9.0,
            'memo' => null,
            'source_type' => 'historical_api',
            'source_name' => 'open_meteo_historical',
            'source_fetched_at' => '2026-03-11T22:00:00+09:00',
        ]);
        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-12',
            'location_id' => null,
            'location_name_snapshot' => '旅行先',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'sunny',
            'temperature_high' => 20.0,
            'temperature_low' => 11.0,
            'memo' => null,
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
            'source_fetched_at' => '2026-03-11T20:00:00+09:00',
        ]);
        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-12',
            'location_id' => null,
            'location_name_snapshot' => '旅行先',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'windy',
            'temperature_high' => 19.0,
            'temperature_low' => 10.0,
            'memo' => null,
            'source_type' => 'manual',
            'source_name' => 'manual',
            'source_fetched_at' => null,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/wear-logs/calendar?month=2026-03', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(2, 'days')
            ->assertJsonPath('days.0.date', '2026-03-11')
            ->assertJsonPath('days.0.weather.status', 'observed')
            ->assertJsonPath('days.0.weather.weather_code', 'rain')
            ->assertJsonPath('days.0.weather.has_weather', true)
            ->assertJsonPath('days.1.date', '2026-03-12')
            ->assertJsonPath('days.1.weather.status', 'manual')
            ->assertJsonPath('days.1.weather.weather_code', 'windy')
            ->assertJsonPath('days.1.weather.has_weather', true)
            ->assertJsonPath('days.0.plannedCount', 0)
            ->assertJsonPath('days.0.wornCount', 0)
            ->assertJsonPath('days.0.has_feedback', false)
            ->assertJsonCount(0, 'days.0.dots');
    }

    public function test_get_wear_log_calendar_prefers_default_location_then_display_order_then_lower_id_when_weather_status_priority_is_tied(): void
    {
        $user = User::factory()->create();

        $defaultLocation = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'is_default' => true,
            'display_order' => 3,
        ]);
        $earlierDisplayOrderLocation = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => 'さいたま',
            'is_default' => false,
            'display_order' => 1,
        ]);
        $laterDisplayOrderLocation = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '東京',
            'is_default' => false,
            'display_order' => 5,
        ]);
        $sameDisplayOrderLocation = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '横浜',
            'is_default' => false,
            'display_order' => 5,
        ]);

        $defaultForecast = WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-13',
            'location_id' => $defaultLocation->id,
            'location_name_snapshot' => '川口',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'cloudy',
            'temperature_high' => 18.0,
            'temperature_low' => 10.0,
            'memo' => null,
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
            'source_fetched_at' => '2026-03-12T20:00:00+09:00',
        ]);
        $travelForecast = WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-13',
            'location_id' => null,
            'location_name_snapshot' => '旅行先',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'rain',
            'temperature_high' => 15.0,
            'temperature_low' => 8.0,
            'memo' => null,
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
            'source_fetched_at' => '2026-03-12T21:00:00+09:00',
        ]);

        $this->assertTrue($defaultForecast->id < $travelForecast->id);

        $earlierDisplayForecast = WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-14',
            'location_id' => $earlierDisplayOrderLocation->id,
            'location_name_snapshot' => 'さいたま',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'rain',
            'temperature_high' => 15.0,
            'temperature_low' => 8.0,
            'memo' => null,
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
            'source_fetched_at' => '2026-03-13T20:00:00+09:00',
        ]);
        $laterDisplayForecast = WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-14',
            'location_id' => $laterDisplayOrderLocation->id,
            'location_name_snapshot' => '東京',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'sunny',
            'temperature_high' => 17.0,
            'temperature_low' => 9.0,
            'memo' => null,
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
            'source_fetched_at' => '2026-03-13T21:00:00+09:00',
        ]);

        $lowerIdForecast = WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-15',
            'location_id' => $laterDisplayOrderLocation->id,
            'location_name_snapshot' => '東京',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'fog',
            'temperature_high' => 14.0,
            'temperature_low' => 6.0,
            'memo' => null,
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
            'source_fetched_at' => '2026-03-14T20:00:00+09:00',
        ]);
        $higherIdForecast = WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-15',
            'location_id' => $sameDisplayOrderLocation->id,
            'location_name_snapshot' => '横浜',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'snow',
            'temperature_high' => 3.0,
            'temperature_low' => -1.0,
            'memo' => null,
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
            'source_fetched_at' => '2026-03-14T21:00:00+09:00',
        ]);

        $travelOnlyForecast = WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-16',
            'location_id' => null,
            'location_name_snapshot' => '旅行先',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'windy',
            'temperature_high' => 19.0,
            'temperature_low' => 11.0,
            'memo' => null,
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
            'source_fetched_at' => '2026-03-15T20:00:00+09:00',
        ]);

        $this->assertTrue($lowerIdForecast->id < $higherIdForecast->id);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/wear-logs/calendar?month=2026-03', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(4, 'days')
            ->assertJsonPath('days.0.date', '2026-03-13')
            ->assertJsonPath('days.0.weather.status', 'forecast')
            ->assertJsonPath('days.0.weather.weather_code', 'cloudy')
            ->assertJsonPath('days.0.weather.has_weather', true)
            ->assertJsonPath('days.1.date', '2026-03-14')
            ->assertJsonPath('days.1.weather.status', 'forecast')
            ->assertJsonPath('days.1.weather.weather_code', 'rain')
            ->assertJsonPath('days.1.weather.has_weather', true)
            ->assertJsonPath('days.2.date', '2026-03-15')
            ->assertJsonPath('days.2.weather.status', 'forecast')
            ->assertJsonPath('days.2.weather.weather_code', 'fog')
            ->assertJsonPath('days.2.weather.has_weather', true)
            ->assertJsonPath('days.3.date', '2026-03-16')
            ->assertJsonPath('days.3.weather.status', 'forecast')
            ->assertJsonPath('days.3.weather.weather_code', 'windy')
            ->assertJsonPath('days.3.weather.has_weather', true);
    }

    public function test_get_wear_log_calendar_returns_422_when_month_is_invalid(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/wear-logs/calendar?month=2026/03', [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['month']);
    }

    public function test_get_wear_logs_by_date_returns_day_details_in_display_order(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $outfit = $this->createOutfit($user, ['name' => '通勤コーデ']);
        $itemA = $this->createItem($user, ['name' => '白T']);
        $itemB = $this->createItem($user, [
            'name' => 'ネイビーパンツ',
            'category' => 'bottoms',
        ]);

        $later = $this->createWearLog($user, [
            'status' => 'worn',
            'event_date' => '2026-03-05',
            'display_order' => 2,
            'source_outfit_id' => null,
            'memo' => '2件目',
            'outdoor_temperature_feel' => 'slightly_cold',
            'indoor_temperature_feel' => 'comfortable',
            'overall_rating' => 'good',
            'feedback_tags' => ['temperature_gap_ready', 'morning_hot', 'rain_problem'],
        ]);
        $later->wearLogItems()->createMany([
            [
                'source_item_id' => $itemA->id,
                'sort_order' => 1,
                'item_source_type' => 'manual',
            ],
            [
                'source_item_id' => $itemB->id,
                'sort_order' => 2,
                'item_source_type' => 'manual',
            ],
        ]);

        $earlier = $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-03-05',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'memo' => '1件目',
        ]);
        $earlier->wearLogItems()->create([
            'source_item_id' => $itemA->id,
            'sort_order' => 1,
            'item_source_type' => 'outfit',
        ]);

        $weatherLocation = UserWeatherLocation::query()->create([
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
            'weather_date' => '2026-03-05',
            'location_id' => $weatherLocation->id,
            'location_name_snapshot' => '川口',
            'forecast_area_code_snapshot' => '110000',
            'weather_code' => 'sunny_with_occasional_rain',
            'temperature_high' => 22.0,
            'temperature_low' => 13.0,
            'memo' => '日中はよく晴れた',
            'source_type' => 'manual',
            'source_name' => 'manual',
            'source_fetched_at' => null,
        ]);

        $this->createWearLog($otherUser, [
            'status' => 'planned',
            'event_date' => '2026-03-05',
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/wear-logs/by-date?event_date=2026-03-05', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('event_date', '2026-03-05')
            ->assertJsonCount(2, 'wearLogs')
            ->assertJsonPath('wearLogs.0.id', $earlier->id)
            ->assertJsonPath('wearLogs.0.display_order', 1)
            ->assertJsonPath('wearLogs.0.source_outfit_name', '通勤コーデ')
            ->assertJsonPath('wearLogs.0.items_count', 1)
            ->assertJsonPath('wearLogs.0.memo', '1件目')
            ->assertJsonCount(1, 'wearLogs.0.thumbnail_items')
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.category', 'tops')
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.shape', 'tshirt')
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.sort_order', 1)
            ->assertJsonPath('wearLogs.1.id', $later->id)
            ->assertJsonPath('wearLogs.1.display_order', 2)
            ->assertJsonPath('wearLogs.1.source_outfit_name', null)
            ->assertJsonPath('wearLogs.1.items_count', 2)
            ->assertJsonPath('wearLogs.1.memo', '2件目')
            ->assertJsonPath('wearLogs.1.outdoor_temperature_feel', 'slightly_cold')
            ->assertJsonPath('wearLogs.1.indoor_temperature_feel', 'comfortable')
            ->assertJsonPath('wearLogs.1.overall_rating', 'good')
            ->assertJsonPath('wearLogs.1.feedback_tags.0', 'temperature_gap_ready')
            ->assertJsonPath('wearLogs.1.feedback_tags.1', 'morning_hot')
            ->assertJsonCount(2, 'wearLogs.1.thumbnail_items')
            ->assertJsonPath('wearLogs.1.thumbnail_items.0.category', 'tops')
            ->assertJsonPath('wearLogs.1.thumbnail_items.0.sort_order', 1)
            ->assertJsonPath('wearLogs.1.thumbnail_items.1.category', 'bottoms')
            ->assertJsonPath('weatherRecords.0.location_name', '川口')
            ->assertJsonPath('weatherRecords.0.weather_code', 'sunny_with_occasional_rain')
            ->assertJsonPath('weatherRecords.0.temperature_high', 22)
            ->assertJsonPath('weatherRecords.0.memo', '日中はよく晴れた');
    }

    public function test_get_wear_logs_by_date_returns_weather_records_in_calendar_priority_order(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $defaultLocation = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'is_default' => true,
            'display_order' => 2,
        ]);
        $secondaryLocation = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => 'さいたま',
            'is_default' => false,
            'display_order' => 1,
        ]);

        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-06',
            'location_id' => $secondaryLocation->id,
            'location_name_snapshot' => 'さいたま',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'cloudy',
            'temperature_high' => 23.0,
            'temperature_low' => 13.0,
            'memo' => null,
            'source_type' => 'forecast_api',
            'source_name' => 'open_meteo_jma_forecast',
            'source_fetched_at' => '2026-03-06T06:00:00Z',
        ]);
        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-06',
            'location_id' => null,
            'location_name_snapshot' => '秋田',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'sunny',
            'temperature_high' => null,
            'temperature_low' => null,
            'memo' => null,
            'source_type' => 'manual',
            'source_name' => 'manual',
            'source_fetched_at' => null,
        ]);
        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-03-06',
            'location_id' => $defaultLocation->id,
            'location_name_snapshot' => '川口',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'sunny',
            'temperature_high' => 25.0,
            'temperature_low' => 14.0,
            'memo' => '日差しが強かった',
            'source_type' => 'historical_api',
            'source_name' => 'open_meteo_historical',
            'source_fetched_at' => '2026-03-07T06:00:00Z',
        ]);

        $response = $this->getJson('/api/wear-logs/by-date?event_date=2026-03-06', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('weatherRecords.0.location_name', '川口')
            ->assertJsonPath('weatherRecords.0.source_type', 'historical_api')
            ->assertJsonPath('weatherRecords.1.location_name', '秋田')
            ->assertJsonPath('weatherRecords.1.source_type', 'manual')
            ->assertJsonPath('weatherRecords.2.location_name', 'さいたま')
            ->assertJsonPath('weatherRecords.2.source_type', 'forecast_api');
    }

    public function test_get_wear_logs_by_date_returns_422_when_event_date_is_invalid(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/wear-logs/by-date?event_date=not-a-date', [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_date']);
    }

    public function test_get_wear_log_detail_returns_current_status_helpers_for_items(): void
    {
        $user = User::factory()->create();
        $outfit = $this->createOutfit($user, ['name' => '通勤コーデ', 'status' => 'invalid']);
        $cleaningItem = $this->createItem($user, [
            'name' => '白シャツ',
            'care_status' => 'in_cleaning',
        ]);
        $wearLog = $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
        ]);
        $wearLog->wearLogItems()->create([
            'source_item_id' => $cleaningItem->id,
            'sort_order' => 1,
            'item_source_type' => 'outfit',
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson("/api/wear-logs/{$wearLog->id}", [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('wearLog.source_outfit_status', 'invalid')
            ->assertJsonPath('wearLog.items.0.source_item_id', $cleaningItem->id)
            ->assertJsonPath('wearLog.items.0.source_item_status', 'active')
            ->assertJsonPath('wearLog.items.0.source_item_care_status', 'in_cleaning');
    }

    public function test_post_wear_log_can_create_with_outfit_only(): void
    {
        $user = User::factory()->create();
        $outfit = $this->createOutfit($user);
        $top = $this->createItem($user, [
            'name' => '白T',
            'category' => 'tops',
        ]);
        $bottom = $this->createItem($user, [
            'name' => 'ネイビーパンツ',
            'category' => 'bottoms',
            'shape' => 'pants',
            'spec' => [
                'bottoms' => [
                    'length_type' => 'full',
                ],
            ],
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#223355',
                'label' => 'ネイビー',
            ]],
        ]);
        $outfit->outfitItems()->createMany([
            [
                'item_id' => $top->id,
                'sort_order' => 1,
            ],
            [
                'item_id' => $bottom->id,
                'sort_order' => 2,
            ],
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'memo' => 'outfit only',
            'items' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'created')
            ->assertJsonPath('wearLog.source_outfit_id', $outfit->id)
            ->assertJsonCount(2, 'wearLog.items')
            ->assertJsonPath('wearLog.items.0.source_item_id', $top->id)
            ->assertJsonPath('wearLog.items.0.item_source_type', 'outfit')
            ->assertJsonPath('wearLog.items.1.source_item_id', $bottom->id)
            ->assertJsonPath('wearLog.items.1.item_source_type', 'outfit');

        $this->assertDatabaseHas('wear_logs', [
            'user_id' => $user->id,
            'source_outfit_id' => $outfit->id,
            'display_order' => 1,
        ]);
        $this->assertDatabaseHas('wear_log_items', [
            'source_item_id' => $top->id,
            'item_source_type' => 'outfit',
            'sort_order' => 1,
        ]);
        $this->assertDatabaseHas('wear_log_items', [
            'source_item_id' => $bottom->id,
            'item_source_type' => 'outfit',
            'sort_order' => 2,
        ]);
    }

    public function test_post_wear_log_returns_422_when_items_field_is_missing(): void
    {
        $user = User::factory()->create();
        $outfit = $this->createOutfit($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'memo' => 'outfit only',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    public function test_post_wear_log_can_create_with_items_only(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'worn',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'memo' => 'item only',
            'items' => [
                [
                    'source_item_id' => $item->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('wearLog.items.0.source_item_id', $item->id)
            ->assertJsonPath('wearLog.items.0.item_source_type', 'manual');
    }

    public function test_post_wear_log_can_create_with_feedback_fields_and_normalizes_tags(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'worn',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'memo' => 'feedback included',
            'outdoor_temperature_feel' => 'comfortable',
            'indoor_temperature_feel' => 'slightly_cold',
            'overall_rating' => 'good',
            'feedback_tags' => ['rain_ready', 'comfortable_all_day', 'morning_hot', 'day_cold', 'night_hot', 'rain_ready'],
            'feedback_memo' => '夜は少し冷えた',
            'items' => [
                [
                    'source_item_id' => $item->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('wearLog.outdoor_temperature_feel', 'comfortable')
            ->assertJsonPath('wearLog.indoor_temperature_feel', 'slightly_cold')
            ->assertJsonPath('wearLog.overall_rating', 'good')
            ->assertJsonPath('wearLog.feedback_tags.0', 'rain_ready')
            ->assertJsonPath('wearLog.feedback_tags.1', 'comfortable_all_day')
            ->assertJsonPath('wearLog.feedback_tags.2', 'morning_hot')
            ->assertJsonPath('wearLog.feedback_tags.3', 'day_cold')
            ->assertJsonPath('wearLog.feedback_tags.4', 'night_hot')
            ->assertJsonPath('wearLog.feedback_memo', '夜は少し冷えた');

        $this->assertDatabaseHas('wear_logs', [
            'user_id' => $user->id,
            'outdoor_temperature_feel' => 'comfortable',
            'indoor_temperature_feel' => 'slightly_cold',
            'overall_rating' => 'good',
            'feedback_memo' => '夜は少し冷えた',
        ]);

        $wearLog = WearLog::query()->where('user_id', $user->id)->latest('id')->firstOrFail();
        $this->assertSame(['rain_ready', 'comfortable_all_day', 'morning_hot', 'day_cold', 'night_hot'], $wearLog->feedback_tags);
    }

    public function test_post_wear_log_can_create_with_outfit_and_items(): void
    {
        $user = User::factory()->create();
        $outfit = $this->createOutfit($user);
        $item = $this->createItem($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'memo' => 'both',
            'items' => [
                [
                    'source_item_id' => $item->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('wearLog.source_outfit_id', $outfit->id)
            ->assertJsonPath('wearLog.items.0.source_item_id', $item->id);
    }

    public function test_get_wear_logs_returns_thumbnail_items_for_outfit_only_wear_log_from_materialized_wear_log_items(): void
    {
        $user = User::factory()->create();
        $outfit = $this->createOutfit($user, ['name' => '通勤コーデ']);
        $top = $this->createItem($user, [
            'name' => '白T',
            'category' => 'tops',
        ]);
        $bottom = $this->createItem($user, [
            'name' => 'ネイビーパンツ',
            'category' => 'bottoms',
            'shape' => 'pants',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#223355',
                'label' => 'ネイビー',
            ], [
                'role' => 'sub',
                'mode' => 'preset',
                'value' => 'gray',
                'hex' => '#bbbbbb',
                'label' => 'グレー',
            ]],
        ]);
        $outfit->outfitItems()->createMany([
            [
                'item_id' => $top->id,
                'sort_order' => 1,
            ],
            [
                'item_id' => $bottom->id,
                'sort_order' => 2,
            ],
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'memo' => 'outfit thumbnail',
            'items' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertCreated();

        $response = $this->getJson('/api/wear-logs', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('wearLogs.0.source_outfit_id', $outfit->id)
            ->assertJsonCount(2, 'wearLogs.0.thumbnail_items')
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.source_item_id', $top->id)
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.category', 'tops')
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.shape', 'tshirt')
            ->assertJsonPath('wearLogs.0.thumbnail_items.0.sort_order', 1)
            ->assertJsonPath('wearLogs.0.thumbnail_items.1.source_item_id', $bottom->id)
            ->assertJsonPath('wearLogs.0.thumbnail_items.1.category', 'bottoms')
            ->assertJsonPath('wearLogs.0.thumbnail_items.1.shape', 'pants')
            ->assertJsonPath('wearLogs.0.thumbnail_items.1.sort_order', 2)
            ->assertJsonPath('wearLogs.0.thumbnail_items.1.colors.1.hex', '#bbbbbb');
    }

    public function test_post_wear_log_returns_422_when_outfit_and_items_are_both_missing(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'memo' => null,
            'items' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['source_outfit_id']);
    }

    public function test_post_wear_log_returns_422_when_disposed_item_is_specified(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'status' => 'disposed',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'items' => [
                [
                    'source_item_id' => $item->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    public function test_post_wear_log_returns_422_when_item_sort_order_is_duplicated(): void
    {
        $user = User::factory()->create();
        $firstItem = $this->createItem($user, ['name' => '白シャツ']);
        $secondItem = $this->createItem($user, [
            'name' => 'ネイビーパンツ',
            'category' => 'bottoms',
            'shape' => 'pants',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'items' => [
                [
                    'source_item_id' => $firstItem->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
                [
                    'source_item_id' => $secondItem->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    public function test_post_wear_log_returns_422_when_item_sort_order_has_gap(): void
    {
        $user = User::factory()->create();
        $firstItem = $this->createItem($user, ['name' => '白シャツ']);
        $secondItem = $this->createItem($user, [
            'name' => 'ネイビーパンツ',
            'category' => 'bottoms',
            'shape' => 'pants',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'items' => [
                [
                    'source_item_id' => $firstItem->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
                [
                    'source_item_id' => $secondItem->id,
                    'sort_order' => 3,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    public function test_post_wear_log_returns_422_when_invalid_outfit_is_specified(): void
    {
        $user = User::factory()->create();
        $outfit = $this->createOutfit($user, [
            'status' => 'invalid',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'items' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['source_outfit_id']);
    }

    public function test_post_wear_log_returns_422_when_feedback_fields_are_invalid(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'worn',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'outdoor_temperature_feel' => 'freezing',
            'indoor_temperature_feel' => 'slightly_cold',
            'overall_rating' => 'excellent',
            'feedback_tags' => ['rain_ready', 'humidity_uncomfortable'],
            'items' => [
                [
                    'source_item_id' => $item->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'outdoor_temperature_feel',
                'overall_rating',
                'feedback_tags.1',
            ]);
    }

    public function test_put_wear_log_updates_record(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'name' => '更新後アイテム',
        ]);
        $wearLog = $this->createWearLog($user);

        $wearLog->wearLogItems()->create([
            'source_item_id' => $item->id,
            'sort_order' => 1,
            'item_source_type' => 'manual',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/wear-logs/{$wearLog->id}", [
            'status' => 'worn',
            'event_date' => '2026-03-26',
            'display_order' => 2,
            'source_outfit_id' => null,
            'memo' => 'updated',
            'items' => [
                [
                    'source_item_id' => $item->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('wearLog.status', 'worn')
            ->assertJsonPath('wearLog.event_date', '2026-03-26')
            ->assertJsonPath('wearLog.display_order', 2);
    }

    public function test_put_wear_log_updates_feedback_fields(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user);
        $wearLog = $this->createWearLog($user, [
            'outdoor_temperature_feel' => 'cold',
            'indoor_temperature_feel' => 'comfortable',
            'overall_rating' => 'neutral',
            'feedback_tags' => ['rain_problem'],
            'feedback_memo' => 'initial memo',
        ]);

        $wearLog->wearLogItems()->create([
            'source_item_id' => $item->id,
            'sort_order' => 1,
            'item_source_type' => 'manual',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/wear-logs/{$wearLog->id}", [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'memo' => 'updated',
            'outdoor_temperature_feel' => 'slightly_hot',
            'indoor_temperature_feel' => 'comfortable',
            'overall_rating' => 'good',
            'feedback_tags' => ['worked_for_tpo', 'worked_for_tpo', 'color_worked_well'],
            'feedback_memo' => 'updated memo',
            'items' => [
                [
                    'source_item_id' => $item->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('wearLog.outdoor_temperature_feel', 'slightly_hot')
            ->assertJsonPath('wearLog.indoor_temperature_feel', 'comfortable')
            ->assertJsonPath('wearLog.overall_rating', 'good')
            ->assertJsonPath('wearLog.feedback_tags.0', 'worked_for_tpo')
            ->assertJsonPath('wearLog.feedback_tags.1', 'color_worked_well')
            ->assertJsonPath('wearLog.feedback_memo', 'updated memo');

        $wearLog->refresh();
        $this->assertSame('slightly_hot', $wearLog->outdoor_temperature_feel);
        $this->assertSame('comfortable', $wearLog->indoor_temperature_feel);
        $this->assertSame('good', $wearLog->overall_rating);
        $this->assertSame(['worked_for_tpo', 'color_worked_well'], $wearLog->feedback_tags);
        $this->assertSame('updated memo', $wearLog->feedback_memo);
    }

    public function test_get_wear_logs_and_detail_include_feedback_fields(): void
    {
        $user = User::factory()->create();
        $wearLog = $this->createWearLog($user, [
            'status' => 'worn',
            'outdoor_temperature_feel' => 'slightly_cold',
            'indoor_temperature_feel' => 'comfortable',
            'feedback_tags' => ['comfortable_all_day', 'rain_ready'],
            'overall_rating' => 'good',
            'feedback_memo' => '快適だった',
        ]);

        $this->actingAs($user, 'web');

        $listResponse = $this->getJson('/api/wear-logs', [
            'Accept' => 'application/json',
        ]);

        $listResponse->assertOk()
            ->assertJsonPath('wearLogs.0.overall_rating', 'good')
            ->assertJsonPath('wearLogs.0.feedback_tags.0', 'comfortable_all_day')
            ->assertJsonPath('wearLogs.0.feedback_tags.1', 'rain_ready');

        $detailResponse = $this->getJson("/api/wear-logs/{$wearLog->id}", [
            'Accept' => 'application/json',
        ]);

        $detailResponse->assertOk()
            ->assertJsonPath('wearLog.outdoor_temperature_feel', 'slightly_cold')
            ->assertJsonPath('wearLog.indoor_temperature_feel', 'comfortable')
            ->assertJsonPath('wearLog.overall_rating', 'good')
            ->assertJsonPath('wearLog.feedback_tags.0', 'comfortable_all_day')
            ->assertJsonPath('wearLog.feedback_tags.1', 'rain_ready')
            ->assertJsonPath('wearLog.feedback_memo', '快適だった');
    }

    public function test_put_wear_log_can_update_with_outfit_only_and_materialize_wear_log_items(): void
    {
        $user = User::factory()->create();
        $wearLog = $this->createWearLog($user, [
            'source_outfit_id' => null,
        ]);
        $manualItem = $this->createItem($user, [
            'name' => '旧アイテム',
        ]);
        $wearLog->wearLogItems()->create([
            'source_item_id' => $manualItem->id,
            'sort_order' => 1,
            'item_source_type' => 'manual',
        ]);

        $outfit = $this->createOutfit($user, ['name' => '更新後コーデ']);
        $top = $this->createItem($user, [
            'name' => '白シャツ',
            'category' => 'tops',
            'shape' => 'shirt',
        ]);
        $bottom = $this->createItem($user, [
            'name' => '黒パンツ',
            'category' => 'bottoms',
            'shape' => 'pants',
        ]);
        $outfit->outfitItems()->createMany([
            [
                'item_id' => $top->id,
                'sort_order' => 1,
            ],
            [
                'item_id' => $bottom->id,
                'sort_order' => 2,
            ],
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/wear-logs/{$wearLog->id}", [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'memo' => 'updated from outfit',
            'items' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('wearLog.source_outfit_id', $outfit->id)
            ->assertJsonCount(2, 'wearLog.items')
            ->assertJsonPath('wearLog.items.0.source_item_id', $top->id)
            ->assertJsonPath('wearLog.items.1.source_item_id', $bottom->id);

        $this->assertDatabaseMissing('wear_log_items', [
            'source_item_id' => $manualItem->id,
            'item_source_type' => 'manual',
        ]);
        $this->assertDatabaseHas('wear_log_items', [
            'source_item_id' => $top->id,
            'item_source_type' => 'outfit',
            'sort_order' => 1,
        ]);
        $this->assertDatabaseHas('wear_log_items', [
            'source_item_id' => $bottom->id,
            'item_source_type' => 'outfit',
            'sort_order' => 2,
        ]);
    }

    public function test_put_wear_log_returns_404_for_other_users_record(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $wearLog = $this->createWearLog($otherUser);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/wear-logs/{$wearLog->id}", [
            'status' => 'worn',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'items' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(404);
    }

    public function test_put_wear_log_can_keep_current_invalid_outfit_and_disposed_item_when_editing_existing_record(): void
    {
        $user = User::factory()->create();
        $disposedItem = $this->createItem($user, [
            'name' => '手放し済み',
            'status' => 'disposed',
        ]);
        $invalidOutfit = $this->createOutfit($user, [
            'status' => 'invalid',
            'name' => '現在は無効',
        ]);

        $wearLog = $this->createWearLog($user, [
            'source_outfit_id' => $invalidOutfit->id,
        ]);
        $wearLog->wearLogItems()->create([
            'source_item_id' => $disposedItem->id,
            'sort_order' => 1,
            'item_source_type' => 'manual',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/wear-logs/{$wearLog->id}", [
            'status' => 'worn',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $invalidOutfit->id,
            'memo' => 'current invalid data is preserved',
            'items' => [
                [
                    'source_item_id' => $disposedItem->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('wearLog.source_outfit_id', $invalidOutfit->id)
            ->assertJsonPath('wearLog.source_outfit_status', 'invalid')
            ->assertJsonPath('wearLog.items.0.source_item_id', $disposedItem->id)
            ->assertJsonPath('wearLog.items.0.source_item_status', 'disposed');
    }

    public function test_delete_wear_log_deletes_owned_record_and_items(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user);
        $wearLog = $this->createWearLog($user);

        $wearLogItem = $wearLog->wearLogItems()->create([
            'source_item_id' => $item->id,
            'sort_order' => 1,
            'item_source_type' => 'manual',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->deleteJson("/api/wear-logs/{$wearLog->id}", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk()
            ->assertJsonPath('message', 'deleted');

        $this->assertDatabaseMissing('wear_logs', ['id' => $wearLog->id]);
        $this->assertDatabaseMissing('wear_log_items', ['id' => $wearLogItem->id]);
    }

    public function test_delete_wear_log_returns_404_for_other_users_record(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $wearLog = $this->createWearLog($otherUser);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->deleteJson("/api/wear-logs/{$wearLog->id}", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(404);
    }

    public function test_delete_wear_log_returns_404_for_missing_record(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->deleteJson('/api/wear-logs/999999', [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(404);
    }
}
