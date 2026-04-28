<?php

namespace Tests\Feature;

use App\Models\CategoryGroup;
use App\Models\CategoryMaster;
use App\Models\Item;
use App\Models\Outfit;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateGroup;
use App\Models\User;
use App\Models\UserTpo;
use App\Models\WearLog;
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

        return [
            'item' => $item,
            'candidate' => $candidate,
            'outfit' => $outfit,
            'wearLog' => $wearLog,
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
            ->assertJsonCount(1, 'items')
            ->assertJsonCount(1, 'purchase_candidates')
            ->assertJsonCount(1, 'outfits')
            ->assertJsonCount(1, 'wear_logs')
            ->assertJsonPath('items.0.name', '白シャツ')
            ->assertJsonPath('items.0.sheerness', 'slight')
            ->assertJsonPath('purchase_candidates.0.sheerness', 'slight')
            ->assertJsonPath('purchase_candidates.0.shape', 'blouse')
            ->assertJsonPath('purchase_candidates.0.name', '購入候補シャツ')
            ->assertJsonPath('outfits.0.name', '通勤コーデ')
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

        $token = $this->issueCsrfToken();

        $importResponse = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $importResponse->assertOk()
            ->assertJsonPath('message', 'imported')
            ->assertJsonPath('counts.items.total', 1)
            ->assertJsonPath('counts.items.visible', 1)
            ->assertJsonPath('counts.purchase_candidates.total', 1)
            ->assertJsonPath('counts.outfits.total', 1)
            ->assertJsonPath('counts.outfits.visible', 1)
            ->assertJsonPath('counts.wear_logs.total', 1);

        $this->assertDatabaseMissing('items', ['id' => $staleItem->id]);
        $this->assertDatabaseMissing('purchase_candidates', ['id' => $staleCandidate->id]);
        $this->assertDatabaseMissing('outfits', ['id' => $staleOutfit->id]);

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

    public function test_import_rejects_backup_from_different_owner_and_keeps_current_data(): void
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
            'name' => '現在ユーザーの購入候補',
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

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['owner.user_id']);

        $this->assertDatabaseHas('items', [
            'id' => $currentItem->id,
            'user_id' => $importUser->id,
            'name' => '現在ユーザーのアイテム',
        ]);
        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $currentCandidate->id,
            'user_id' => $importUser->id,
            'name' => '現在ユーザーの購入候補',
        ]);
        $this->assertDatabaseHas('outfits', [
            'id' => $currentOutfit->id,
            'user_id' => $importUser->id,
            'name' => '現在ユーザーのコーデ',
        ]);

        $this->assertDatabaseMissing('items', [
            'user_id' => $importUser->id,
            'name' => '白シャツ',
        ]);
        $this->assertDatabaseMissing('purchase_candidates', [
            'user_id' => $importUser->id,
            'name' => '購入候補シャツ',
        ]);
        $this->assertDatabaseMissing('outfits', [
            'user_id' => $importUser->id,
            'name' => '通勤コーデ',
        ]);
    }

    public function test_import_rejects_legacy_backup_without_owner_and_keeps_current_data(): void
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

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['owner.user_id']);

        $this->assertStringStartsWith(
            'このバックアップファイルは現在の形式に対応していないため復元できません。最新の形式で再度バックアップしてください。',
            (string) $response->json('message')
        );

        $this->assertDatabaseHas('items', [
            'id' => $currentItem->id,
            'user_id' => $user->id,
            'name' => '現在ユーザーのアイテム',
        ]);
    }

    public function test_export_import_roundtrip_preserves_purchase_candidate_alternate_size_fields(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', '繧ｷ繝｣繝・・繝悶Λ繧ｦ繧ｹ');

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
}
