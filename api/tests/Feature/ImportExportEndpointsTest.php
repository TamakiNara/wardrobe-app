<?php

namespace Tests\Feature;

use App\Models\CategoryGroup;
use App\Models\CategoryMaster;
use App\Models\Item;
use App\Models\Outfit;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateGroup;
use App\Models\User;
use App\Models\UserBrand;
use App\Models\UserPreference;
use App\Models\UserTpo;
use App\Models\UserWeatherLocation;
use App\Models\WearLog;
use App\Models\WeatherRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImportExportEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn9nS8AAAAASUVORK5CYII=';

    private function issueCsrfToken(): string
    {
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        return session()->token();
    }

    private function createCategory(string $id, string $groupId, string $name): void
    {
        CategoryGroup::query()->updateOrCreate(
            ['id' => $groupId],
            [
                'id' => $groupId,
                'name' => $groupId,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        CategoryMaster::query()->updateOrCreate(
            ['id' => $id],
            [
                'id' => $id,
                'group_id' => $groupId,
                'name' => $name,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );
    }

    private function createUserTpo(User $user, string $name, int $sortOrder): UserTpo
    {
        return UserTpo::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'name' => $name,
            ],
            [
                'sort_order' => $sortOrder,
                'is_active' => true,
                'is_preset' => false,
            ],
        );
    }

    private function seedExportSourceData(User $user): array
    {
        $holidayTpo = $this->createUserTpo($user, 'リモート', 101);
        $officeTpo = $this->createUserTpo($user, 'オフィス', 102);

        $user->forceFill([
            'visible_category_ids' => ['tops_shirt_blouse'],
        ])->save();

        UserBrand::query()->create([
            'user_id' => $user->id,
            'name' => 'Sample Brand',
            'kana' => 'サンプル',
            'normalized_name' => 'samplebrand',
            'normalized_kana' => 'サンプル',
            'is_active' => true,
        ]);

        UserPreference::query()->create([
            'user_id' => $user->id,
            'current_season' => 'spring',
            'default_wear_log_status' => 'planned',
            'calendar_week_start' => 'monday',
            'skin_tone_preset' => 'neutral_medium',
        ]);

        $item = Item::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'care_status' => 'in_cleaning',
            'sheerness' => 'slight',
            'name' => '白シャツ',
            'brand_name' => 'Sample Brand',
            'price' => 9800,
            'purchase_url' => 'https://example.test/items/shirt',
            'memo' => 'アイテムのメモ',
            'purchased_at' => '2026-04-10',
            'size_gender' => 'women',
            'size_label' => 'M',
            'size_note' => 'やや細身',
            'size_details' => [
                'structured' => [
                    'body_length' => 64,
                    'sleeve_length' => 58,
                ],
                'custom_fields' => [
                    [
                        'label' => '着丈補足',
                        'value' => 64,
                        'sort_order' => 1,
                    ],
                ],
            ],
            'is_rain_ok' => true,
            'category' => 'tops',
            'subcategory' => 'shirt_blouse',
            'shape' => 'shirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#FFFFFF',
                'label' => 'ホワイト',
            ]],
            'seasons' => ['spring'],
            'tpo_ids' => [$holidayTpo->id],
            'tpos' => ['リモート'],
            'spec' => [
                'tops' => [
                    'sleeve' => 'long',
                    'neck' => 'regular',
                ],
            ],
        ]);
        $item->forceFill([
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#FFFFFF',
                'label' => 'ホワイト',
                'custom_label' => '00 WHITE',
            ]],
        ])->save();
        $item->materials()->create([
            'part_label' => '本体',
            'material_name' => '綿',
            'ratio' => 100,
        ]);
        $itemImagePath = sprintf('items/%d/source-item.png', $item->id);
        Storage::disk('public')->put($itemImagePath, base64_decode(self::PNG_BASE64));
        $item->images()->create([
            'disk' => 'public',
            'path' => $itemImagePath,
            'original_filename' => 'source-item.png',
            'mime_type' => 'image/png',
            'file_size' => strlen((string) base64_decode(self::PNG_BASE64)),
            'sort_order' => 1,
            'is_primary' => true,
        ]);

        $group = PurchaseCandidateGroup::query()->create([
            'user_id' => $user->id,
        ]);

        $candidate = PurchaseCandidate::query()->create([
            'user_id' => $user->id,
            'group_id' => $group->id,
            'group_order' => 1,
            'status' => 'purchased',
            'priority' => 'high',
            'name' => '購入候補シャツ',
            'category_id' => 'tops_shirt_blouse',
            'shape' => 'blouse',
            'brand_name' => 'Candidate Brand',
            'price' => 12800,
            'release_date' => '2026-04-20',
            'sale_price' => 10800,
            'sale_ends_at' => '2026-05-20 12:00:00',
            'discount_ends_at' => '2026-05-01 12:00:00',
            'purchase_url' => 'https://example.test/candidates/shirt',
            'memo' => '候補メモ',
            'wanted_reason' => 'オンオフ兼用',
            'size_gender' => 'women',
            'size_label' => 'L',
            'size_note' => '少し大きめ',
            'size_details' => [
                'structured' => [
                    'body_length' => 66,
                ],
            ],
            'alternate_size_label' => 'M',
            'alternate_size_note' => 'ジャスト',
            'alternate_size_details' => [
                'structured' => [
                    'body_length' => 64,
                ],
                'custom_fields' => [
                    [
                        'label' => '裄丈',
                        'value' => 78,
                        'sort_order' => 1,
                    ],
                ],
            ],
            'spec' => [
                'tops' => [
                    'sleeve' => 'long',
                    'design' => 'plain',
                ],
            ],
            'is_rain_ok' => false,
            'sheerness' => 'slight',
            'converted_item_id' => $item->id,
            'converted_at' => '2026-04-20 10:00:00',
        ]);
        $candidate->colors()->create([
            'role' => 'main',
            'mode' => 'preset',
            'value' => 'navy',
            'hex' => '#1F3A5F',
            'label' => 'ネイビー',
            'sort_order' => 1,
        ]);
        $candidate->seasons()->create([
            'season' => 'summer',
            'sort_order' => 1,
        ]);
        $candidate->tpos()->create([
            'tpo' => 'オフィス',
            'sort_order' => 1,
        ]);
        $candidate->materials()->create([
            'part_label' => '本体',
            'material_name' => '麻',
            'ratio' => 100,
        ]);
        $candidateImagePath = sprintf('purchase-candidates/%d/source-candidate.png', $candidate->id);
        Storage::disk('public')->put($candidateImagePath, base64_decode(self::PNG_BASE64));
        $candidate->images()->create([
            'disk' => 'public',
            'path' => $candidateImagePath,
            'original_filename' => 'source-candidate.png',
            'mime_type' => 'image/png',
            'file_size' => strlen((string) base64_decode(self::PNG_BASE64)),
            'sort_order' => 1,
            'is_primary' => true,
        ]);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '通勤コーデ',
            'memo' => '詳細確認用',
            'seasons' => ['spring'],
            'tpo_ids' => [$officeTpo->id],
            'tpos' => ['オフィス'],
        ]);
        $outfit->outfitItems()->create([
            'item_id' => $item->id,
            'sort_order' => 1,
        ]);

        $wearLog = WearLog::query()->create([
            'user_id' => $user->id,
            'status' => 'worn',
            'event_date' => '2026-04-21',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'memo' => '着用履歴メモ',
        ]);
        $wearLog->wearLogItems()->create([
            'source_item_id' => $item->id,
            'item_source_type' => 'outfit',
            'sort_order' => 1,
        ]);

        $weatherLocation = UserWeatherLocation::query()->create([
            'user_id' => $user->id,
            'name' => '川口',
            'forecast_area_code' => '110000',
            'jma_forecast_region_code' => '110010',
            'jma_forecast_office_code' => '110000',
            'latitude' => 35.8617,
            'longitude' => 139.6455,
            'timezone' => 'Asia/Tokyo',
            'is_default' => true,
            'display_order' => 1,
        ]);

        $weatherRecord = WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-04-21',
            'location_id' => $weatherLocation->id,
            'location_name_snapshot' => '川口',
            'forecast_area_code_snapshot' => '110000',
            'weather_code' => 'sunny',
            'temperature_high' => 22.5,
            'temperature_low' => 13.0,
            'memo' => '昼は日差しが強かった',
            'source_type' => 'manual',
            'source_name' => 'manual',
            'source_fetched_at' => null,
        ]);

        $temporaryWeatherRecord = WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-04-21',
            'location_id' => null,
            'location_name_snapshot' => '旅行先',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'cloudy_then_rain',
            'temperature_high' => 20.0,
            'temperature_low' => 12.5,
            'memo' => '一時的な地域',
            'source_type' => 'manual',
            'source_name' => 'manual',
            'source_fetched_at' => null,
        ]);

        return [
            'item' => $item,
            'candidate' => $candidate,
            'outfit' => $outfit,
            'wearLog' => $wearLog,
            'weatherLocation' => $weatherLocation,
            'weatherRecord' => $weatherRecord,
            'temporaryWeatherRecord' => $temporaryWeatherRecord,
        ];
    }

    public function test_export_returns_items_purchase_candidates_outfits_and_embedded_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($user);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('version', 1)
            ->assertJsonPath('owner.user_id', $user->id)
            ->assertJsonCount(5, 'user_tpos')
            ->assertJsonCount(1, 'user_brands')
            ->assertJsonPath('visible_category_ids.0', 'tops_shirt_blouse')
            ->assertJsonPath('user_preferences.currentSeason', 'spring')
            ->assertJsonPath('user_preferences.defaultWearLogStatus', 'planned')
            ->assertJsonCount(1, 'items')
            ->assertJsonCount(1, 'purchase_candidates')
            ->assertJsonCount(1, 'outfits')
            ->assertJsonCount(1, 'wear_logs')
            ->assertJsonCount(1, 'weather_locations')
            ->assertJsonCount(2, 'weather_records')
            ->assertJsonPath('items.0.name', '白シャツ')
            ->assertJsonPath('items.0.sheerness', 'slight')
            ->assertJsonPath('purchase_candidates.0.sheerness', 'slight')
            ->assertJsonPath('purchase_candidates.0.shape', 'blouse')
            ->assertJsonPath('purchase_candidates.0.name', '購入候補シャツ')
            ->assertJsonPath('outfits.0.name', '通勤コーデ')
            ->assertJsonPath('weather_locations.0.name', '川口')
            ->assertJsonPath('weather_locations.0.jma_forecast_region_code', '110010')
            ->assertJsonPath('weather_locations.0.jma_forecast_office_code', '110000')
            ->assertJsonPath('weather_locations.0.latitude', 35.8617)
            ->assertJsonPath('weather_locations.0.longitude', 139.6455)
            ->assertJsonPath('weather_locations.0.timezone', 'Asia/Tokyo')
            ->assertJsonPath('weather_records.0.weather_code', 'sunny')
            ->assertJsonPath('weather_records.0.location_name_snapshot', '川口')
            ->assertJsonPath('weather_records.1.location_id', null)
            ->assertJsonPath('weather_records.1.location_name_snapshot', '旅行先')
            ->assertJsonPath('items.0.colors.0.custom_label', '00 WHITE')
            ->assertJsonPath('items.0.images.0.content_base64', self::PNG_BASE64)
            ->assertJsonPath('purchase_candidates.0.images.0.content_base64', self::PNG_BASE64);
    }

    public function test_import_recreates_items_purchase_candidates_outfits_and_restores_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $source = $this->seedExportSourceData($user);

        $this->actingAs($user, 'web');

        $exportResponse = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ]);
        $exportResponse->assertOk();
        $exportPayload = $exportResponse->json();

        $staleItem = Item::query()->create([
            'user_id' => $user->id,
            'name' => '消えるアイテム',
            'status' => 'active',
            'category' => 'tops',
            'subcategory' => 'shirt_blouse',
            'shape' => 'shirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#000000',
                'label' => 'ブラック',
            ]],
            'tpos' => [],
            'spec' => null,
        ]);
        $staleCandidate = PurchaseCandidate::query()->create([
            'user_id' => $user->id,
            'status' => 'considering',
            'priority' => 'low',
            'name' => '消える購入候補',
            'category_id' => 'tops_shirt_blouse',
        ]);
        $staleOutfit = Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '消えるコーデ',
            'seasons' => [],
            'tpos' => [],
        ]);
        $staleBrand = UserBrand::query()->create([
            'user_id' => $user->id,
            'name' => 'Old Brand',
            'kana' => null,
            'normalized_name' => 'oldbrand',
            'normalized_kana' => null,
            'is_active' => true,
        ]);
        UserPreference::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'current_season' => 'winter',
                'default_wear_log_status' => 'worn',
                'calendar_week_start' => 'sunday',
                'skin_tone_preset' => 'yellow_deep',
            ],
        );
        $user->forceFill([
            'visible_category_ids' => ['underwear_bra'],
        ])->save();

        $token = $this->issueCsrfToken();

        $importResponse = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $importResponse->assertOk()
            ->assertJsonPath('message', 'imported')
            ->assertJsonPath('counts.user_tpos.total', 5)
            ->assertJsonPath('counts.items.total', 1)
            ->assertJsonPath('counts.items.visible', 1)
            ->assertJsonPath('counts.purchase_candidates.total', 1)
            ->assertJsonPath('counts.outfits.total', 1)
            ->assertJsonPath('counts.outfits.visible', 1)
            ->assertJsonPath('counts.wear_logs.total', 1)
            ->assertJsonPath('counts.weather_locations.total', 1)
            ->assertJsonPath('counts.weather_records.total', 2);

        $this->assertDatabaseMissing('items', ['id' => $staleItem->id]);
        $this->assertDatabaseMissing('purchase_candidates', ['id' => $staleCandidate->id]);
        $this->assertDatabaseMissing('outfits', ['id' => $staleOutfit->id]);
        $this->assertDatabaseMissing('user_brands', ['id' => $staleBrand->id]);

        $importedItem = Item::query()
            ->where('user_id', $user->id)
            ->where('name', '白シャツ')
            ->with(['images', 'materials'])
            ->firstOrFail();
        $importedCandidate = PurchaseCandidate::query()
            ->where('user_id', $user->id)
            ->where('name', '購入候補シャツ')
            ->with(['images', 'materials'])
            ->firstOrFail();
        $importedOutfit = Outfit::query()
            ->where('user_id', $user->id)
            ->where('name', '通勤コーデ')
            ->with('outfitItems')
            ->firstOrFail();

        $importedWeatherLocation = UserWeatherLocation::query()
            ->where('user_id', $user->id)
            ->where('name', '川口')
            ->firstOrFail();
        $importedWeatherRecord = WeatherRecord::query()
            ->where('user_id', $user->id)
            ->whereDate('weather_date', '2026-04-21')
            ->where('location_id', $importedWeatherLocation->id)
            ->firstOrFail();
        $importedTemporaryWeatherRecord = WeatherRecord::query()
            ->where('user_id', $user->id)
            ->whereDate('weather_date', '2026-04-21')
            ->whereNull('location_id')
            ->where('location_name_snapshot', '旅行先')
            ->firstOrFail();

        $this->assertNotSame($source['item']->id, $importedItem->id);
        $this->assertNotSame($source['candidate']->id, $importedCandidate->id);
        $this->assertNotSame($source['outfit']->id, $importedOutfit->id);

        $this->assertSame('shirt', $importedItem->shape);
        $this->assertSame('in_cleaning', $importedItem->care_status);
        $this->assertSame('slight', $importedItem->sheerness);
        $this->assertSame('long', data_get($importedItem->spec, 'tops.sleeve'));
        $this->assertSame('00 WHITE', data_get($importedItem->colors, '0.custom_label'));
        $this->assertSame('slight', $importedCandidate->sheerness);
        $this->assertSame('blouse', $importedCandidate->shape);
        $this->assertSame('麻', $importedCandidate->materials->first()?->material_name);
        $this->assertSame($importedItem->id, $importedCandidate->converted_item_id);
        $this->assertSame($importedItem->id, $importedOutfit->outfitItems->first()?->item_id);
        $this->assertTrue($importedWeatherLocation->is_default);
        $this->assertSame('110010', $importedWeatherLocation->jma_forecast_region_code);
        $this->assertSame('110000', $importedWeatherLocation->jma_forecast_office_code);
        $this->assertSame('35.8617', (string) $importedWeatherLocation->latitude);
        $this->assertSame('139.6455', (string) $importedWeatherLocation->longitude);
        $this->assertSame('Asia/Tokyo', $importedWeatherLocation->timezone);
        $this->assertSame('sunny', $importedWeatherRecord->weather_code);
        $this->assertSame('川口', $importedWeatherRecord->location_name_snapshot);
        $this->assertSame('110000', $importedWeatherRecord->forecast_area_code_snapshot);
        $this->assertSame('cloudy_then_rain', $importedTemporaryWeatherRecord->weather_code);
        $this->assertNull($importedTemporaryWeatherRecord->location_id);
        $this->assertSame('旅行先', $importedTemporaryWeatherRecord->location_name_snapshot);
        $this->assertDatabaseHas('user_brands', [
            'user_id' => $user->id,
            'name' => 'Sample Brand',
        ]);
        $user->refresh();
        $this->assertSame(['tops_shirt_blouse'], $user->visible_category_ids);
        $preference = UserPreference::query()->where('user_id', $user->id)->sole();
        $this->assertSame('spring', $preference->current_season);
        $this->assertSame('planned', $preference->default_wear_log_status);
        $this->assertSame('monday', $preference->calendar_week_start);
        $this->assertSame('neutral_medium', $preference->skin_tone_preset);

        $itemImage = $importedItem->images->firstOrFail();
        $candidateImage = $importedCandidate->images->firstOrFail();
        Storage::disk('public')->assertExists($itemImage->path);
        Storage::disk('public')->assertExists($candidateImage->path);
        $this->assertSame(
            self::PNG_BASE64,
            base64_encode((string) Storage::disk('public')->get($itemImage->path))
        );
        $this->assertSame(
            self::PNG_BASE64,
            base64_encode((string) Storage::disk('public')->get($candidateImage->path))
        );

        $this->getJson("/api/items/{$importedItem->id}", [
            'Accept' => 'application/json',
        ])->assertOk()
            ->assertJsonPath('item.name', '白シャツ')
            ->assertJsonPath('item.images.0.original_filename', 'source-item.png')
            ->assertJsonPath('item.colors.0.custom_label', '00 WHITE')
            ->assertJsonPath('item.spec.tops.sleeve', 'long');

        $this->getJson("/api/purchase-candidates/{$importedCandidate->id}", [
            'Accept' => 'application/json',
        ])->assertOk()
            ->assertJsonPath('purchaseCandidate.name', '購入候補シャツ')
            ->assertJsonPath('purchaseCandidate.images.0.original_filename', 'source-candidate.png')
            ->assertJsonPath('purchaseCandidate.sheerness', 'slight')
            ->assertJsonPath('purchaseCandidate.spec.tops.sleeve', 'long');

        $this->getJson("/api/outfits/{$importedOutfit->id}", [
            'Accept' => 'application/json',
        ])->assertOk()
            ->assertJsonPath('outfit.name', '通勤コーデ')
            ->assertJsonPath('outfit.outfit_items.0.item_id', $importedItem->id);
    }

    public function test_export_import_roundtrip_handles_legacy_items_without_subcategory(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');

        $legacyItem = Item::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '旧形式シャツ',
            'category' => 'tops',
            'subcategory' => null,
            'shape' => 'shirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#FFFFFF',
                'label' => 'ホワイト',
            ]],
            'tpos' => [],
            'spec' => [
                'tops' => [
                    'sleeve' => 'long',
                ],
            ],
        ]);

        $legacyImagePath = sprintf('items/%d/legacy-item.png', $legacyItem->id);
        Storage::disk('public')->put($legacyImagePath, base64_decode(self::PNG_BASE64));
        $legacyItem->images()->create([
            'disk' => 'public',
            'path' => $legacyImagePath,
            'original_filename' => 'legacy-item.png',
            'mime_type' => 'image/png',
            'file_size' => strlen((string) base64_decode(self::PNG_BASE64)),
            'sort_order' => 1,
            'is_primary' => true,
        ]);

        $this->actingAs($user, 'web');

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $this->assertSame('shirt_blouse', data_get($exportPayload, 'items.0.subcategory'));
        $this->assertArrayHasKey('purchase_candidates', $exportPayload);
        $this->assertArrayHasKey('outfits', $exportPayload);

        $importPayload = [
            'version' => $exportPayload['version'],
            'exported_at' => $exportPayload['exported_at'],
            'owner' => $exportPayload['owner'],
            'items' => $exportPayload['items'] ?? [],
            'purchase_candidates' => [],
            'outfits' => [],
            'wear_logs' => [],
        ];

        Item::query()->where('user_id', $user->id)->delete();

        $token = $this->issueCsrfToken();

        $this->postJson('/api/import', $importPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk();

        $importedItem = Item::query()
            ->where('user_id', $user->id)
            ->where('name', '旧形式シャツ')
            ->firstOrFail();

        $this->assertSame('shirt_blouse', $importedItem->subcategory);
        $this->assertSame('shirt', $importedItem->shape);
        $this->assertSame('long', data_get($importedItem->spec, 'tops.sleeve'));
    }

    public function test_export_import_roundtrip_normalizes_legacy_bottoms_spec_values(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $legacySkirt = Item::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '旧形式スカート',
            'category' => 'skirts',
            'subcategory' => 'skirt',
            'shape' => 'narrow',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#1F3A5F',
                'label' => 'ネイビー',
            ]],
            'tpos' => [],
            'spec' => [
                'bottoms' => [
                    'length_type' => 'midi',
                ],
            ],
            'size_details' => [
                'structured' => [
                    'total_length' => [
                        'value' => 89,
                        'min' => null,
                        'max' => null,
                        'note' => '総丈',
                    ],
                    'skirt_length' => [
                        'value' => 83.5,
                        'min' => null,
                        'max' => null,
                        'note' => null,
                    ],
                ],
            ],
        ]);

        $this->actingAs($user, 'web');

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $this->assertSame('midi', data_get($exportPayload, 'items.0.spec.skirt.length_type'));
        $this->assertNull(data_get($exportPayload, 'items.0.spec.bottoms.length_type'));
        $this->assertSame('narrow', data_get($exportPayload, 'items.0.shape'));
        $this->assertSame(89, data_get($exportPayload, 'items.0.size_details.structured.total_length.value'));
        $this->assertSame(83.5, data_get($exportPayload, 'items.0.size_details.structured.skirt_length.value'));

        $importPayload = [
            'version' => $exportPayload['version'],
            'exported_at' => $exportPayload['exported_at'],
            'owner' => $exportPayload['owner'],
            'items' => $exportPayload['items'] ?? [],
            'purchase_candidates' => [],
            'outfits' => [],
            'wear_logs' => [],
        ];

        Item::query()->where('user_id', $user->id)->delete();

        $token = $this->issueCsrfToken();

        $this->postJson('/api/import', $importPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk();

        $importedItem = Item::query()
            ->where('user_id', $user->id)
            ->where('name', $legacySkirt->name)
            ->firstOrFail();

        $this->assertSame('midi', data_get($importedItem->spec, 'skirt.length_type'));
        $this->assertNull(data_get($importedItem->spec, 'bottoms.length_type'));
        $this->assertSame('narrow', $importedItem->shape);
        $this->assertSame(89, data_get($importedItem->size_details, 'structured.total_length.value'));
        $this->assertSame(83.5, data_get($importedItem->size_details, 'structured.skirt_length.value'));
    }

    public function test_export_import_roundtrip_preserves_bag_size_details(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $bag = Item::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => 'レザートート',
            'category' => 'bags',
            'subcategory' => 'tote',
            'shape' => 'tote',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
            'tpos' => [],
            'size_details' => [
                'structured' => [
                    'height' => [
                        'value' => 21,
                        'min' => null,
                        'max' => null,
                        'note' => null,
                    ],
                    'width' => [
                        'value' => 28.5,
                        'min' => null,
                        'max' => null,
                        'note' => null,
                    ],
                    'depth' => [
                        'value' => 12,
                        'min' => null,
                        'max' => null,
                        'note' => null,
                    ],
                ],
            ],
        ]);

        $this->actingAs($user, 'web');

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $this->assertSame('tote', data_get($exportPayload, 'items.0.shape'));
        $this->assertSame(21, data_get($exportPayload, 'items.0.size_details.structured.height.value'));
        $this->assertSame(28.5, data_get($exportPayload, 'items.0.size_details.structured.width.value'));
        $this->assertSame(12, data_get($exportPayload, 'items.0.size_details.structured.depth.value'));

        $importPayload = [
            'version' => $exportPayload['version'],
            'exported_at' => $exportPayload['exported_at'],
            'owner' => $exportPayload['owner'],
            'items' => $exportPayload['items'] ?? [],
            'purchase_candidates' => [],
            'outfits' => [],
            'wear_logs' => [],
        ];

        Item::query()->where('user_id', $user->id)->delete();

        $token = $this->issueCsrfToken();

        $this->postJson('/api/import', $importPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk();

        $importedItem = Item::query()
            ->where('user_id', $user->id)
            ->where('name', $bag->name)
            ->firstOrFail();

        $this->assertSame('tote', $importedItem->shape);
        $this->assertSame(21, data_get($importedItem->size_details, 'structured.height.value'));
        $this->assertSame(28.5, data_get($importedItem->size_details, 'structured.width.value'));
        $this->assertSame(12, data_get($importedItem->size_details, 'structured.depth.value'));
    }

    public function test_export_import_roundtrip_preserves_underwear_items_and_purchase_candidates(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('underwear_bra', 'underwear', 'ブラ');

        $item = Item::query()->create([
            'user_id' => $user->id,
            'name' => '黒ブラ',
            'status' => 'active',
            'category' => 'underwear',
            'subcategory' => 'bra',
            'shape' => 'bra',
            'size_label' => 'C70',
            'size_details' => [
                'structured' => [
                    'underbust' => [
                        'value' => 68,
                        'min' => null,
                        'max' => null,
                        'note' => null,
                    ],
                    'top_bust' => [
                        'value' => 83.5,
                        'min' => null,
                        'max' => null,
                        'note' => null,
                    ],
                ],
            ],
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
            'seasons' => [],
            'tpos' => [],
            'spec' => null,
        ]);

        $candidate = PurchaseCandidate::query()->create([
            'user_id' => $user->id,
            'status' => 'considering',
            'priority' => 'medium',
            'name' => '黒ブラ候補',
            'category_id' => 'underwear_bra',
            'shape' => null,
            'brand_name' => null,
            'price' => null,
            'purchase_url' => null,
            'wanted_reason' => null,
            'memo' => null,
            'size_label' => 'M',
            'size_note' => null,
            'size_details' => [
                'structured' => [
                    'waist' => [
                        'value' => 64,
                        'min' => null,
                        'max' => null,
                        'note' => null,
                    ],
                    'hip' => [
                        'value' => 86.5,
                        'min' => null,
                        'max' => null,
                        'note' => null,
                    ],
                    'rise' => [
                        'value' => 24,
                        'min' => null,
                        'max' => null,
                        'note' => null,
                    ],
                ],
            ],
            'alternate_size_label' => null,
            'alternate_size_note' => null,
            'alternate_size_details' => null,
        ]);
        $candidate->colors()->create([
            'role' => 'main',
            'mode' => 'preset',
            'value' => 'black',
            'hex' => '#111111',
            'label' => 'ブラック',
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $this->assertSame('underwear', data_get($exportPayload, 'items.0.category'));
        $this->assertSame('bra', data_get($exportPayload, 'items.0.subcategory'));
        $this->assertSame(68, data_get($exportPayload, 'items.0.size_details.structured.underbust.value'));
        $this->assertSame(83.5, data_get($exportPayload, 'items.0.size_details.structured.top_bust.value'));
        $this->assertSame('underwear_bra', data_get($exportPayload, 'purchase_candidates.0.category_id'));
        $this->assertSame(64, data_get($exportPayload, 'purchase_candidates.0.size_details.structured.waist.value'));
        $this->assertSame(86.5, data_get($exportPayload, 'purchase_candidates.0.size_details.structured.hip.value'));
        $this->assertSame(24, data_get($exportPayload, 'purchase_candidates.0.size_details.structured.rise.value'));

        Item::query()->delete();
        PurchaseCandidate::query()->delete();

        $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk();

        $importedItem = Item::query()->sole();
        $importedCandidate = PurchaseCandidate::query()->sole();

        $this->assertSame('underwear', $importedItem->category);
        $this->assertSame('bra', $importedItem->subcategory);
        $this->assertSame('bra', $importedItem->shape);
        $this->assertSame(68, data_get($importedItem->size_details, 'structured.underbust.value'));
        $this->assertSame(83.5, data_get($importedItem->size_details, 'structured.top_bust.value'));
        $this->assertSame('underwear_bra', $importedCandidate->category_id);
        $this->assertNull($importedCandidate->shape);
        $this->assertSame(64, data_get($importedCandidate->size_details, 'structured.waist.value'));
        $this->assertSame(86.5, data_get($importedCandidate->size_details, 'structured.hip.value'));
        $this->assertSame(24, data_get($importedCandidate->size_details, 'structured.rise.value'));
    }

    public function test_export_import_roundtrip_allows_legacy_bottoms_without_length_spec(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $legacyBottoms = Item::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '旧形式デニム',
            'category' => 'bottoms',
            'subcategory' => null,
            'shape' => 'straight',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#1F3A5F',
                'label' => 'ネイビー',
            ]],
            'tpos' => [],
            'spec' => null,
        ]);

        $this->actingAs($user, 'web');

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $this->assertSame('bottoms', data_get($exportPayload, 'items.0.category'));
        $this->assertNull(data_get($exportPayload, 'items.0.spec.bottoms.length_type'));

        $importPayload = [
            'version' => $exportPayload['version'],
            'exported_at' => $exportPayload['exported_at'],
            'owner' => $exportPayload['owner'],
            'items' => $exportPayload['items'] ?? [],
            'purchase_candidates' => [],
            'outfits' => [],
            'wear_logs' => [],
        ];

        Item::query()->where('user_id', $user->id)->delete();

        $token = $this->issueCsrfToken();

        $this->postJson('/api/import', $importPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk();

        $importedItem = Item::query()
            ->where('user_id', $user->id)
            ->where('name', $legacyBottoms->name)
            ->firstOrFail();

        $this->assertSame('bottoms', $importedItem->category);
        $this->assertNull($importedItem->subcategory);
        $this->assertSame('straight', $importedItem->shape);
        $this->assertNull($importedItem->spec);
    }

    public function test_import_allows_backup_from_different_owner_and_restores_into_current_user(): void
    {
        Storage::fake('public');

        $backupOwner = User::factory()->create();
        $importUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($backupOwner);

        $this->actingAs($backupOwner, 'web');
        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $currentItem = Item::query()->create([
            'user_id' => $importUser->id,
            'name' => '現在ユーザーのアイテム',
            'status' => 'active',
            'category' => 'tops',
            'subcategory' => 'shirt_blouse',
            'shape' => 'shirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#FFFFFF',
                'label' => 'ホワイト',
            ]],
            'tpos' => [],
            'spec' => null,
        ]);
        $currentCandidate = PurchaseCandidate::query()->create([
            'user_id' => $importUser->id,
            'status' => 'considering',
            'priority' => 'medium',
            'name' => '現在ユーザーのアイテム',
            'category_id' => 'tops_shirt_blouse',
        ]);
        $currentOutfit = Outfit::query()->create([
            'user_id' => $importUser->id,
            'status' => 'active',
            'name' => '現在ユーザーのコーデ',
            'seasons' => [],
            'tpos' => [],
        ]);

        $this->actingAs($importUser, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('counts.items.total', 1)
            ->assertJsonPath('counts.purchase_candidates.total', 1)
            ->assertJsonPath('counts.outfits.total', 1);

        $this->assertDatabaseMissing('items', [
            'id' => $currentItem->id,
            'user_id' => $importUser->id,
        ]);
        $this->assertDatabaseMissing('purchase_candidates', [
            'id' => $currentCandidate->id,
            'user_id' => $importUser->id,
        ]);
        $this->assertDatabaseMissing('outfits', [
            'id' => $currentOutfit->id,
            'user_id' => $importUser->id,
        ]);

        $this->assertDatabaseHas('items', [
            'user_id' => $importUser->id,
            'name' => '白シャツ',
        ]);
        $this->assertDatabaseHas('user_tpos', [
            'user_id' => $importUser->id,
            'name' => 'リモート',
        ]);
        $this->assertDatabaseHas('user_tpos', [
            'user_id' => $importUser->id,
            'name' => 'オフィス',
        ]);
        $this->assertDatabaseHas('purchase_candidates', [
            'user_id' => $importUser->id,
            'name' => '購入候補シャツ',
        ]);
        $this->assertDatabaseHas('outfits', [
            'user_id' => $importUser->id,
            'name' => '通勤コーデ',
        ]);
    }

    public function test_import_allows_legacy_backup_without_owner(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');

        $currentItem = Item::query()->create([
            'user_id' => $user->id,
            'name' => '現在ユーザーのアイテム',
            'status' => 'active',
            'category' => 'tops',
            'subcategory' => 'shirt_blouse',
            'shape' => 'shirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#FFFFFF',
                'label' => 'ホワイト',
            ]],
            'tpos' => [],
            'spec' => null,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', [
            'version' => 1,
            'exported_at' => '2026-04-24T12:34:56+09:00',
            'items' => [],
            'purchase_candidates' => [],
            'outfits' => [],
            'wear_logs' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('counts.items.total', 0)
            ->assertJsonPath('counts.purchase_candidates.total', 0)
            ->assertJsonPath('counts.outfits.total', 0);

        $this->assertDatabaseMissing('items', [
            'id' => $currentItem->id,
            'user_id' => $user->id,
            'name' => '現在ユーザーのアイテム',
        ]);
    }

    public function test_import_normalizes_legacy_wear_log_feedback_tags(): void
    {
        Storage::fake('public');

        $backupOwner = User::factory()->create();
        $importUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($backupOwner);

        $this->actingAs($backupOwner, 'web');
        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();
        $exportPayload['owner']['user_id'] = $backupOwner->id + 999;
        $exportPayload['wear_logs'][0]['feedback_tags'] = [
            'temperature_matched',
            'felt_confident',
            'humidity_uncomfortable',
            'night_hot',
            'night_hot',
        ];

        $this->actingAs($importUser, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk();

        $wearLog = WearLog::query()
            ->where('user_id', $importUser->id)
            ->sole();

        $this->assertSame([
            'temperature_gap_ready',
            'mood_matched',
            'night_hot',
        ], $wearLog->feedback_tags);
        $this->assertDatabaseHas('user_tpos', [
            'user_id' => $importUser->id,
            'name' => 'リモート',
        ]);
    }

    public function test_import_does_not_recreate_brand_candidates_from_legacy_backup_without_user_brands(): void
    {
        Storage::fake('public');

        $backupOwner = User::factory()->create();
        $importUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($backupOwner);

        $this->actingAs($backupOwner, 'web');
        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        unset($exportPayload['user_brands']);

        $this->actingAs($importUser, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk();

        $this->assertDatabaseMissing('user_brands', [
            'user_id' => $importUser->id,
            'name' => 'Sample Brand',
        ]);
    }

    public function test_import_ignores_legacy_tpo_ids_when_tpo_names_are_missing(): void
    {
        Storage::fake('public');

        $backupOwner = User::factory()->create();
        $importUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($backupOwner);

        $this->actingAs($backupOwner, 'web');
        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        unset($exportPayload['user_tpos']);
        $exportPayload['items'][0]['tpos'] = [];
        $exportPayload['outfits'][0]['tpos'] = [];

        $this->actingAs($importUser, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk();

        $importedItem = Item::query()
            ->where('user_id', $importUser->id)
            ->where('name', '白シャツ')
            ->sole();
        $importedOutfit = Outfit::query()
            ->where('user_id', $importUser->id)
            ->where('name', '通勤コーデ')
            ->sole();

        $this->assertSame([], $importedItem->tpo_ids ?? []);
        $this->assertSame([], $importedOutfit->tpo_ids ?? []);
    }

    public function test_import_restores_custom_tpos_from_legacy_purchase_candidates(): void
    {
        Storage::fake('public');

        $backupOwner = User::factory()->create();
        $importUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($backupOwner);

        $this->actingAs($backupOwner, 'web');
        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        unset($exportPayload['user_tpos']);
        $exportPayload['items'][0]['tpos'] = [];
        $exportPayload['outfits'][0]['tpos'] = [];
        $exportPayload['purchase_candidates'][0]['tpos'] = ['オフィス'];

        $this->actingAs($importUser, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('user_tpos', [
            'user_id' => $importUser->id,
            'name' => 'オフィス',
        ]);
    }

    public function test_import_restores_custom_tpos_from_legacy_items_with_object_payloads(): void
    {
        Storage::fake('public');

        $backupOwner = User::factory()->create();
        $importUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($backupOwner);

        $this->actingAs($backupOwner, 'web');
        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        unset($exportPayload['user_tpos']);
        $exportPayload['items'][0]['name'] = 'オーバーサイズスウェットシャツ';
        $exportPayload['items'][0]['tpos'] = [
            ['name' => '在宅勤務'],
        ];
        $exportPayload['purchase_candidates'][0]['tpos'] = [];
        $exportPayload['outfits'][0]['tpos'] = [];

        $this->actingAs($importUser, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk();

        $restoredTpo = UserTpo::query()
            ->where('user_id', $importUser->id)
            ->where('name', '在宅勤務')
            ->sole();
        $importedItem = Item::query()
            ->where('user_id', $importUser->id)
            ->where('name', 'オーバーサイズスウェットシャツ')
            ->sole();

        $this->assertDatabaseHas('items', [
            'user_id' => $importUser->id,
            'name' => 'オーバーサイズスウェットシャツ',
        ]);
        $this->assertSame([$restoredTpo->id], $importedItem->tpo_ids);
    }

    public function test_import_restores_tpo_assignments_from_legacy_tpo_ids(): void
    {
        Storage::fake('public');

        $backupOwner = User::factory()->create();
        $importUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($backupOwner);

        $this->actingAs($backupOwner, 'web');
        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $legacyRemoteTpoId = $exportPayload['items'][0]['tpo_ids'][0] ?? null;
        $legacyOfficeTpoId = $exportPayload['outfits'][0]['tpo_ids'][0] ?? null;

        $exportPayload['items'][0]['tpos'] = [];
        $exportPayload['outfits'][0]['tpos'] = [];

        $this->actingAs($importUser, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk();

        $remote = UserTpo::query()
            ->where('user_id', $importUser->id)
            ->where('name', 'リモート')
            ->sole();
        $office = UserTpo::query()
            ->where('user_id', $importUser->id)
            ->where('name', 'オフィス')
            ->sole();
        $importedItem = Item::query()
            ->where('user_id', $importUser->id)
            ->where('name', '白シャツ')
            ->sole();
        $importedOutfit = Outfit::query()
            ->where('user_id', $importUser->id)
            ->where('name', '通勤コーデ')
            ->sole();

        $this->assertIsInt($legacyRemoteTpoId);
        $this->assertIsInt($legacyOfficeTpoId);
        $this->assertSame([$remote->id], $importedItem->tpo_ids);
        $this->assertSame([$office->id], $importedOutfit->tpo_ids);
    }

    public function test_import_uses_existing_preset_named_tpos_without_duplicate_errors(): void
    {
        Storage::fake('public');

        $backupOwner = User::factory()->create();
        $importUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($backupOwner);

        $this->actingAs($backupOwner, 'web');
        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        unset($exportPayload['user_tpos']);
        $exportPayload['items'][0]['tpos'] = ['仕事'];
        $exportPayload['outfits'][0]['tpos'] = [];
        $exportPayload['purchase_candidates'][0]['tpos'] = [];

        $this->actingAs($importUser, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk();

        $this->assertSame(1, UserTpo::query()
            ->where('user_id', $importUser->id)
            ->where('name', '仕事')
            ->count());
        $this->assertDatabaseHas('user_tpos', [
            'user_id' => $importUser->id,
            'name' => '仕事',
            'is_preset' => true,
        ]);
    }

    public function test_import_restores_custom_tpos_from_backup_definitions(): void
    {
        Storage::fake('public');

        $backupOwner = User::factory()->create();
        $importUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($backupOwner);

        $this->actingAs($backupOwner, 'web');
        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $this->actingAs($importUser, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('counts.user_tpos.total', 5);

        $remote = UserTpo::query()
            ->where('user_id', $importUser->id)
            ->where('name', 'リモート')
            ->sole();
        $office = UserTpo::query()
            ->where('user_id', $importUser->id)
            ->where('name', 'オフィス')
            ->sole();
        $importedItem = Item::query()
            ->where('user_id', $importUser->id)
            ->where('name', '白シャツ')
            ->sole();
        $importedOutfit = Outfit::query()
            ->where('user_id', $importUser->id)
            ->where('name', '通勤コーデ')
            ->sole();

        $this->assertTrue($remote->is_active);
        $this->assertFalse($remote->is_preset);
        $this->assertTrue($office->is_active);
        $this->assertFalse($office->is_preset);
        $this->assertSame([$remote->id], $importedItem->tpo_ids);
        $this->assertSame([$office->id], $importedOutfit->tpo_ids);
    }

    public function test_import_infers_visible_categories_from_legacy_items_and_candidates(): void
    {
        Storage::fake('public');

        $backupOwner = User::factory()->create();
        $importUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($backupOwner);

        $this->actingAs($backupOwner, 'web');
        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        unset($exportPayload['visible_category_ids']);

        $this->actingAs($importUser, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk();

        $importUser->refresh();
        $this->assertNull($importUser->visible_category_ids);
    }

    public function test_import_legacy_backup_only_adds_inferred_visible_categories_to_existing_settings(): void
    {
        Storage::fake('public');

        $backupOwner = User::factory()->create();
        $importUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($backupOwner);
        $importUser->forceFill([
            'visible_category_ids' => ['underwear_bra'],
        ])->save();

        $this->actingAs($backupOwner, 'web');
        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        unset($exportPayload['visible_category_ids']);

        $this->actingAs($importUser, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk();

        $importUser->refresh();
        $this->assertSame(['underwear_bra', 'tops_shirt_blouse'], $importUser->visible_category_ids);
    }

    public function test_export_import_roundtrip_preserves_purchase_candidate_alternate_size_fields(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');

        $source = $this->seedExportSourceData($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $exportResponse = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ]);

        $exportResponse->assertOk();

        $exportPayload = $exportResponse->json();

        $this->assertSame('M', data_get($exportPayload, 'purchase_candidates.0.alternate_size_label'));
        $this->assertSame('ジャスト', data_get($exportPayload, 'purchase_candidates.0.alternate_size_note'));
        $this->assertSame(64, data_get($exportPayload, 'purchase_candidates.0.alternate_size_details.structured.body_length'));
        $this->assertSame('裄丈', data_get($exportPayload, 'purchase_candidates.0.alternate_size_details.custom_fields.0.label'));

        PurchaseCandidate::query()->delete();

        $importResponse = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $importResponse->assertOk();

        $importedCandidate = PurchaseCandidate::query()
            ->where('user_id', $user->id)
            ->where('name', $source['candidate']->name)
            ->sole();

        $this->assertSame('M', $importedCandidate->alternate_size_label);
        $this->assertSame('ジャスト', $importedCandidate->alternate_size_note);
        $this->assertSame(64, data_get($importedCandidate->alternate_size_details, 'structured.body_length.value'));
        $this->assertSame('裄丈', data_get($importedCandidate->alternate_size_details, 'custom_fields.0.label'));
    }

    public function test_import_accepts_legacy_weather_condition_field(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($user);

        $this->actingAs($user, 'web');

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $legacyRecord = $exportPayload['weather_records'][1];
        unset($legacyRecord['weather_code']);
        $legacyRecord['weather_condition'] = 'storm';
        $exportPayload['weather_records'] = [$legacyRecord];

        $token = $this->issueCsrfToken();

        $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk();

        $importedWeatherRecord = WeatherRecord::query()
            ->where('user_id', $user->id)
            ->whereDate('weather_date', $legacyRecord['weather_date'])
            ->where('location_name_snapshot', $legacyRecord['location_name_snapshot'])
            ->latest('id')
            ->firstOrFail();

        $this->assertSame('other', $importedWeatherRecord->weather_code);
    }

    public function test_import_export_roundtrip_preserves_thunder_fog_and_windy_weather_codes(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $source = $this->seedExportSourceData($user);

        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-05-10',
            'location_id' => $source['weatherLocation']->id,
            'location_name_snapshot' => '川口',
            'forecast_area_code_snapshot' => '110000',
            'weather_code' => 'thunder',
            'temperature_high' => 24.0,
            'temperature_low' => 17.0,
            'memo' => '午後に雷あり',
            'source_type' => 'manual',
            'source_name' => 'manual',
            'source_fetched_at' => null,
        ]);

        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-05-11',
            'location_id' => $source['weatherLocation']->id,
            'location_name_snapshot' => '川口',
            'forecast_area_code_snapshot' => '110000',
            'weather_code' => 'fog',
            'temperature_high' => 20.0,
            'temperature_low' => 14.0,
            'memo' => '朝は霧',
            'source_type' => 'manual',
            'source_name' => 'manual',
            'source_fetched_at' => null,
        ]);

        WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => '2026-05-12',
            'location_id' => null,
            'location_name_snapshot' => '海沿い',
            'forecast_area_code_snapshot' => null,
            'weather_code' => 'windy',
            'temperature_high' => 18.0,
            'temperature_low' => 11.0,
            'memo' => '海風が強い',
            'source_type' => 'manual',
            'source_name' => 'manual',
            'source_fetched_at' => null,
        ]);

        $this->actingAs($user, 'web');

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $this->assertContains('thunder', array_column($exportPayload['weather_records'], 'weather_code'));
        $this->assertContains('fog', array_column($exportPayload['weather_records'], 'weather_code'));
        $this->assertContains('windy', array_column($exportPayload['weather_records'], 'weather_code'));

        WeatherRecord::query()->delete();

        $token = $this->issueCsrfToken();

        $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk();

        $this->assertDatabaseHas('weather_records', [
            'user_id' => $user->id,
            'weather_date' => '2026-05-10',
            'weather_code' => 'thunder',
        ]);
        $this->assertDatabaseHas('weather_records', [
            'user_id' => $user->id,
            'weather_date' => '2026-05-11',
            'weather_code' => 'fog',
        ]);
        $this->assertDatabaseHas('weather_records', [
            'user_id' => $user->id,
            'weather_date' => '2026-05-12',
            'weather_code' => 'windy',
        ]);
    }

    public function test_import_accepts_legacy_weather_location_payload_without_timezone(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedExportSourceData($user);

        $this->actingAs($user, 'web');

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        unset($exportPayload['weather_locations'][0]['timezone']);

        WeatherRecord::query()->delete();
        UserWeatherLocation::query()->delete();

        $token = $this->issueCsrfToken();

        $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk();

        $importedWeatherLocation = UserWeatherLocation::query()
            ->where('user_id', $user->id)
            ->where('name', '川口')
            ->sole();

        $this->assertNull($importedWeatherLocation->timezone);
        $this->assertSame('35.8617', (string) $importedWeatherLocation->latitude);
        $this->assertSame('139.6455', (string) $importedWeatherLocation->longitude);
    }
}
