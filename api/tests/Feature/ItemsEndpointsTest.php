<?php

namespace Tests\Feature;

use App\Models\CategoryGroup;
use App\Models\CategoryMaster;
use App\Models\Item;
use App\Models\PurchaseCandidate;
use App\Models\User;
use App\Models\UserBrand;
use App\Models\UserTpo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ItemsEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function createFakePng(string $filename): UploadedFile
    {
        $tmpPath = tempnam(sys_get_temp_dir(), 'item-img-');
        file_put_contents(
            $tmpPath,
            base64_decode(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn9nS8AAAAASUVORK5CYII='
            )
        );

        return new UploadedFile(
            $tmpPath,
            $filename,
            'image/png',
            null,
            true
        );
    }

    private function createPurchaseCategory(string $id = 'outerwear_coat', string $groupId = 'outerwear', string $name = 'コート'): void
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

    private function createPurchaseCandidate(User $user, array $overrides = []): PurchaseCandidate
    {
        $categoryId = $overrides['category_id'] ?? 'outerwear_coat';
        $materials = $overrides['materials'] ?? [];
        unset($overrides['materials']);
        $this->createPurchaseCategory($categoryId);

        $candidate = PurchaseCandidate::query()->create(array_merge([
            'user_id' => $user->id,
            'status' => 'considering',
            'priority' => 'medium',
            'name' => 'レインコート候補',
            'category_id' => $categoryId,
            'brand_name' => 'Sample Brand',
            'price' => 14800,
            'purchase_url' => 'https://example.test/products/coat',
            'memo' => null,
            'wanted_reason' => '欲しい理由',
            'size_gender' => 'women',
            'size_label' => 'M',
            'size_note' => '厚手ニット込み',
            'is_rain_ok' => true,
        ], $overrides));

        if (is_array($materials) && $materials !== []) {
            $candidate->materials()->createMany($materials);
        }

        return $candidate->fresh(['materials']);
    }

    private function createItem(User $user, array $overrides = []): Item
    {
        return Item::query()->create(array_merge([
            'user_id' => $user->id,
            'name' => 'テストアイテム',
            'status' => 'active',
            'care_status' => null,
            'brand_name' => null,
            'price' => null,
            'purchase_url' => null,
            'memo' => null,
            'purchased_at' => null,
            'size_gender' => null,
            'size_label' => null,
            'size_note' => null,
            'size_details' => null,
            'is_rain_ok' => false,
            'category' => 'tops',
            'subcategory' => null,
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
            'seasons' => ['夏'],
            'tpos' => ['休日'],
            'spec' => null,
        ], $overrides));
    }

    private function createUserBrand(User $user, array $overrides = []): UserBrand
    {
        return UserBrand::query()->create(array_merge([
            'user_id' => $user->id,
            'name' => 'UNIQLO',
            'kana' => null,
            'normalized_name' => 'uniqlo',
            'normalized_kana' => null,
            'is_active' => true,
        ], $overrides));
    }

    private function createUserTpo(User $user, array $overrides = []): UserTpo
    {
        $attributes = array_merge([
            'user_id' => $user->id,
            'name' => '仕事',
            'sort_order' => 1,
            'is_active' => true,
            'is_preset' => true,
        ], $overrides);

        return UserTpo::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'name' => $attributes['name'],
            ],
            $attributes,
        );
    }

    /**
     * @return array<int, array{part_label:string, material_name:string, ratio:int}>
     */
    private function buildMaterialsPayload(): array
    {
        return [
            [
                'part_label' => '本体',
                'material_name' => '綿',
                'ratio' => 80,
            ],
            [
                'part_label' => '本体',
                'material_name' => 'ポリエステル',
                'ratio' => 20,
            ],
            [
                'part_label' => '裏地',
                'material_name' => 'ポリエステル',
                'ratio' => 100,
            ],
        ];
    }

    public function test_get_items_returns_401_when_unauthenticated(): void
    {
        $response = $this->getJson('/api/items', [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(401);
    }

    public function test_get_items_applies_visibility_filters_sort_and_pagination(): void
    {
        $user = User::factory()->create();
        $user->forceFill([
            'visible_category_ids' => ['tops_tshirt_cutsew'],
        ])->save();

        for ($index = 1; $index <= 13; $index++) {
            $this->createItem($user, [
                'name' => sprintf('白T%02d', $index),
                'brand_name' => ' UNIQLO ',
                'shape' => 'tshirt',
                'seasons' => ['夏'],
                'tpos' => ['休日'],
            ]);
        }

        $this->createItem($user, [
            'name' => '白シャツ',
            'brand_name' => 'MUJI',
            'shape' => 'shirt',
            'seasons' => ['夏'],
            'tpos' => ['休日'],
        ]);

        $this->createItem($user, [
            'name' => '手放した白T',
            'brand_name' => 'ZARA',
            'status' => 'disposed',
            'shape' => 'tshirt',
            'seasons' => ['夏'],
            'tpos' => ['休日'],
        ]);

        $otherUser = User::factory()->create();
        $this->createItem($otherUser, [
            'name' => '他人の白T',
            'brand_name' => 'Other Brand',
            'shape' => 'tshirt',
            'seasons' => ['夏'],
            'tpos' => ['休日'],
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/items?keyword=%E7%99%BD&brand=UNIQLO&season=%E5%A4%8F&tpo=%E4%BC%91%E6%97%A5&sort=name_asc&page=2', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.name', '白T13')
            ->assertJsonPath('meta.total', 13)
            ->assertJsonPath('meta.totalAll', 13)
            ->assertJsonPath('meta.page', 2)
            ->assertJsonPath('meta.lastPage', 2)
            ->assertJsonPath('meta.availableCategories.0', 'tops')
            ->assertJsonPath('meta.availableBrands.0', 'UNIQLO')
            ->assertJsonPath('meta.availableSeasons.0', '夏')
            ->assertJsonPath('meta.availableTpos.0', '休日');

        $response->assertJsonMissing([
            'name' => '白シャツ',
        ]);
        $response->assertJsonMissing([
            'name' => '手放した白T',
        ]);
    }

    public function test_get_items_with_all_flag_returns_all_filtered_items_without_pagination(): void
    {
        $user = User::factory()->create();
        $user->forceFill([
            'visible_category_ids' => ['tops_tshirt_cutsew'],
        ])->save();

        for ($index = 1; $index <= 13; $index++) {
            $this->createItem($user, [
                'name' => sprintf('白T%02d', $index),
                'shape' => 'tshirt',
                'seasons' => ['夏'],
                'tpos' => ['休日'],
            ]);
        }

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/items?keyword=%E7%99%BD&season=%E5%A4%8F&tpo=%E4%BC%91%E6%97%A5&sort=name_asc&page=2&all=1', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(13, 'items')
            ->assertJsonPath('items.0.name', '白T01')
            ->assertJsonPath('items.12.name', '白T13')
            ->assertJsonPath('meta.total', 13)
            ->assertJsonPath('meta.totalAll', 13)
            ->assertJsonPath('meta.page', 1)
            ->assertJsonPath('meta.lastPage', 1);
    }

    public function test_get_items_resolves_tpo_filter_and_available_tpos_from_tpo_ids(): void
    {
        $user = User::factory()->create();
        $user->forceFill([
            'visible_category_ids' => ['tops_tshirt_cutsew'],
        ])->save();

        $remoteWorkTpo = $this->createUserTpo($user, [
            'name' => '在宅',
            'sort_order' => 5,
            'is_preset' => false,
        ]);

        $matchedItem = $this->createItem($user, [
            'name' => '在宅用Tシャツ',
            'shape' => 'tshirt',
            'tpo_ids' => [$remoteWorkTpo->id],
            'tpos' => [],
        ]);

        $this->createItem($user, [
            'name' => '休日用Tシャツ',
            'shape' => 'tshirt',
            'tpo_ids' => [],
            'tpos' => ['休日'],
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/items?tpo=%E5%9C%A8%E5%AE%85', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.id', $matchedItem->id)
            ->assertJsonPath('items.0.name', '在宅用Tシャツ')
            ->assertJsonPath('items.0.tpos.0', '在宅')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.totalAll', 2)
            ->assertJsonPath('meta.availableTpos.0', '休日')
            ->assertJsonPath('meta.availableTpos.1', '在宅');

        $response->assertJsonMissing([
            'name' => '休日用Tシャツ',
        ]);
    }

    public function test_get_items_excludes_disposed_items_from_normal_list(): void
    {
        $user = User::factory()->create();
        $user->forceFill([
            'visible_category_ids' => ['tops_tshirt_cutsew'],
        ])->save();

        $activeItem = $this->createItem($user, [
            'name' => '表示される白T',
            'status' => 'active',
            'shape' => 'tshirt',
        ]);

        $this->createItem($user, [
            'name' => '手放した白T',
            'status' => 'disposed',
            'shape' => 'tshirt',
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/items', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.id', $activeItem->id)
            ->assertJsonPath('items.0.name', '表示される白T')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.totalAll', 1);

        $response->assertJsonMissing([
            'name' => '手放した白T',
        ]);
    }

    public function test_get_disposed_items_returns_only_current_users_disposed_items(): void
    {
        $user = User::factory()->create();

        $disposedItem = $this->createItem($user, [
            'name' => '手放した白T',
            'status' => 'disposed',
            'shape' => 'tshirt',
        ]);

        $this->createItem($user, [
            'name' => '表示されない白T',
            'status' => 'active',
            'shape' => 'tshirt',
        ]);

        $otherUser = User::factory()->create();
        $this->createItem($otherUser, [
            'name' => '他人の手放しアイテム',
            'status' => 'disposed',
            'shape' => 'tshirt',
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/items/disposed', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.id', $disposedItem->id)
            ->assertJsonPath('items.0.name', '手放した白T')
            ->assertJsonPath('items.0.status', 'disposed')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.totalAll', 1);

        $response->assertJsonMissing([
            'name' => '表示されない白T',
        ]);
        $response->assertJsonMissing([
            'name' => '他人の手放しアイテム',
        ]);
    }

    public function test_post_items_stores_purchase_fields_and_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $candidate = $this->createPurchaseCandidate($user, [
            'materials' => $this->buildMaterialsPayload(),
        ]);
        $sourceImagePath = sprintf('purchase-candidates/%d/image-1.png', $candidate->id);
        Storage::disk('public')->put(
            $sourceImagePath,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn9nS8AAAAASUVORK5CYII=')
        );

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'レインコート',
            'purchase_candidate_id' => $candidate->id,
            'brand_name' => 'Sample Brand',
            'price' => 14800,
            'purchase_url' => 'https://example.test/products/coat',
            'memo' => '購入検討メモ',
            'purchased_at' => '2026-03-24',
            'size_gender' => 'women',
            'size_label' => 'M',
            'size_note' => '厚手ニット込み',
            'size_details' => [
                'structured' => [
                    'shoulder_width' => 42.0,
                ],
                'custom_fields' => [
                    [
                        'label' => '裄丈',
                        'value' => 78.0,
                        'sort_order' => 1,
                    ],
                ],
            ],
            'is_rain_ok' => true,
            'category' => 'outerwear',
            'subcategory' => 'coat',
            'shape' => 'coat',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#123456',
                'label' => 'ネイビー',
            ]],
            'seasons' => ['春', '秋'],
            'tpos' => ['仕事'],
            'materials' => $this->buildMaterialsPayload(),
            'images' => [[
                'disk' => 'public',
                'path' => $sourceImagePath,
                'original_filename' => 'coat.png',
                'mime_type' => 'image/png',
                'file_size' => 2048,
                'sort_order' => 1,
                'is_primary' => true,
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.name', 'レインコート')
            ->assertJsonPath('item.brand_name', 'Sample Brand')
            ->assertJsonPath('item.price', 14800)
            ->assertJsonPath('item.purchase_url', 'https://example.test/products/coat')
            ->assertJsonPath('item.memo', '購入検討メモ')
            ->assertJsonPath('item.category', 'outerwear')
            ->assertJsonPath('item.subcategory', 'coat')
            ->assertJsonPath('item.shape', 'coat')
            ->assertJsonPath('item.size_gender', 'women')
            ->assertJsonPath('item.size_label', 'M')
            ->assertJsonPath('item.size_note', '厚手ニット込み')
            ->assertJsonPath('item.size_details.structured.shoulder_width', 42)
            ->assertJsonPath('item.size_details.custom_fields.0.label', '裄丈')
            ->assertJsonPath('item.size_details.custom_fields.0.value', 78)
            ->assertJsonPath('item.is_rain_ok', true)
            ->assertJsonPath('item.materials.0.part_label', '本体')
            ->assertJsonPath('item.materials.2.part_label', '裏地')
            ->assertJsonPath('item.images.0.is_primary', true);

        $itemId = $response->json('item.id');
        $copiedPath = $response->json('item.images.0.path');

        $this->assertNotSame($sourceImagePath, $copiedPath);
        $this->assertStringStartsWith(sprintf('items/%d/', $itemId), $copiedPath);
        Storage::disk('public')->assertExists($sourceImagePath);
        Storage::disk('public')->assertExists($copiedPath);

        $this->assertDatabaseHas('items', [
            'id' => $itemId,
            'brand_name' => 'Sample Brand',
            'price' => 14800,
            'memo' => '購入検討メモ',
            'subcategory' => 'coat',
            'size_gender' => 'women',
            'is_rain_ok' => 1,
        ]);
        $this->assertDatabaseHas('item_images', [
            'item_id' => $itemId,
            'path' => $copiedPath,
            'is_primary' => 1,
        ]);
        $this->assertDatabaseHas('item_materials', [
            'item_id' => $itemId,
            'part_label' => '本体',
            'material_name' => '綿',
            'ratio' => 80,
        ]);
        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $candidate->id,
            'status' => 'purchased',
            'converted_item_id' => $itemId,
        ]);
        $this->assertNotNull(
            PurchaseCandidate::query()->findOrFail($candidate->id)->converted_at
        );
    }

    public function test_post_items_rejects_unknown_size_gender(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'サイズ区分テスト',
            'category' => 'tops',
            'shape' => 'tshirt',
            'size_gender' => 'unknown',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
            'seasons' => [],
            'tpos' => [],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['size_gender']);
    }

    public function test_post_items_allows_empty_materials(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '素材未入力アイテム',
            'category' => 'tops',
            'subcategory' => 'tshirt_cutsew',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#ffffff',
                'label' => 'ホワイト',
            ]],
            'materials' => [],
            'images' => [],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.materials', []);
    }

    public function test_post_items_stores_materials_when_each_part_totals_100(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '素材ありアイテム',
            'category' => 'tops',
            'subcategory' => 'tshirt_cutsew',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#ffffff',
                'label' => 'ホワイト',
            ]],
            'materials' => $this->buildMaterialsPayload(),
            'images' => [],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.materials.0.part_label', '本体')
            ->assertJsonPath('item.materials.0.material_name', '綿')
            ->assertJsonPath('item.materials.0.ratio', 80)
            ->assertJsonPath('item.materials.2.part_label', '裏地')
            ->assertJsonPath('item.materials.2.ratio', 100);

        $itemId = $response->json('item.id');

        $this->assertDatabaseHas('item_materials', [
            'item_id' => $itemId,
            'part_label' => '本体',
            'material_name' => '綿',
            'ratio' => 80,
        ]);
        $this->assertDatabaseHas('item_materials', [
            'item_id' => $itemId,
            'part_label' => '裏地',
            'material_name' => 'ポリエステル',
            'ratio' => 100,
        ]);
    }

    public function test_post_items_rejects_materials_when_part_total_is_not_100(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '素材エラーアイテム',
            'category' => 'tops',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#ffffff',
                'label' => 'ホワイト',
            ]],
            'materials' => [
                [
                    'part_label' => '本体',
                    'material_name' => '綿',
                    'ratio' => 70,
                ],
                [
                    'part_label' => '本体',
                    'material_name' => 'ポリエステル',
                    'ratio' => 20,
                ],
            ],
            'images' => [],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['materials'])
            ->assertJsonPath(
                'errors.materials.0',
                '区分ごとの合計を100%にしてください。（本体: 90%）',
            );
    }

    public function test_post_items_rejects_duplicate_material_name_within_same_part(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '素材重複アイテム',
            'category' => 'tops',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#ffffff',
                'label' => 'ホワイト',
            ]],
            'materials' => [
                [
                    'part_label' => '本体',
                    'material_name' => '綿',
                    'ratio' => 50,
                ],
                [
                    'part_label' => '本体',
                    'material_name' => '綿',
                    'ratio' => 50,
                ],
            ],
            'images' => [],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['materials.1.material_name']);
    }

    public function test_post_items_rejects_legacy_size_details_note(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'サイズ確認アイテム',
            'category' => 'tops',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
            'size_details' => [
                'note' => '裄丈 78cm',
            ],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['size_details']);
    }

    public function test_post_items_can_save_brand_name_and_add_brand_candidate(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'ブランド付きトップス',
            'brand_name' => 'UNIQLO',
            'save_brand_as_candidate' => true,
            'category' => 'tops',
            'subcategory' => 'tshirt_cutsew',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.brand_name', 'UNIQLO');

        $this->assertDatabaseHas('user_brands', [
            'user_id' => $user->id,
            'name' => 'UNIQLO',
            'normalized_name' => 'uniqlo',
            'is_active' => 1,
        ]);
    }

    public function test_post_items_can_save_care_status(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'クリーニング予定コート',
            'care_status' => 'in_cleaning',
            'category' => 'outer',
            'shape' => 'trench',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#123456',
                'label' => 'ネイビー',
            ]],
            'seasons' => ['春'],
            'tpos' => ['仕事'],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.care_status', 'in_cleaning');

        $this->assertDatabaseHas('items', [
            'user_id' => $user->id,
            'name' => 'クリーニング予定コート',
            'care_status' => 'in_cleaning',
        ]);
    }

    public function test_post_items_can_autofill_shape_when_outerwear_subcategory_has_single_candidate(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'ブルゾン',
            'category' => 'outerwear',
            'subcategory' => 'blouson',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.subcategory', 'blouson')
            ->assertJsonPath('item.shape', 'blouson');
    }

    public function test_post_items_can_save_bag_other_without_explicit_shape(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '分類保留バッグ',
            'category' => 'bags',
            'subcategory' => 'other',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.subcategory', 'other')
            ->assertJsonPath('item.shape', 'bag');
    }

    public function test_post_items_can_save_outerwear_other_without_explicit_shape(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '分類保留アウター',
            'category' => 'outerwear',
            'subcategory' => 'other',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.subcategory', 'other')
            ->assertJsonPath('item.shape', 'jacket');
    }

    public function test_post_items_can_save_kimono_other_without_explicit_shape(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '分類保留着物',
            'category' => 'kimono',
            'subcategory' => 'other',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.subcategory', 'other')
            ->assertJsonPath('item.shape', 'kimono');
    }

    public function test_post_items_can_autofill_shape_when_bag_subcategory_has_single_candidate(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'トートバッグ',
            'category' => 'bags',
            'subcategory' => 'tote',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.subcategory', 'tote')
            ->assertJsonPath('item.shape', 'tote');
    }

    public function test_post_items_can_autofill_shape_when_fashion_accessories_subcategory_has_single_candidate(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'レザーベルト',
            'category' => 'fashion_accessories',
            'subcategory' => 'belt',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.subcategory', 'belt')
            ->assertJsonPath('item.shape', 'belt');
    }

    public function test_post_items_can_save_fashion_accessories_other_without_explicit_shape(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '分類保留小物',
            'category' => 'fashion_accessories',
            'subcategory' => 'other',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.subcategory', 'other')
            ->assertJsonPath('item.shape', 'other');
    }

    public function test_post_items_can_autofill_shape_when_shoe_subcategory_has_single_candidate(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '白スニーカー',
            'category' => 'shoes',
            'subcategory' => 'sneakers',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#ffffff',
                'label' => 'ホワイト',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.subcategory', 'sneakers')
            ->assertJsonPath('item.shape', 'sneakers');
    }

    public function test_post_items_can_save_shoe_other_without_explicit_shape(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '分類保留シューズ',
            'category' => 'shoes',
            'subcategory' => 'other',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.subcategory', 'other')
            ->assertJsonPath('item.shape', 'other');
    }

    public function test_post_items_requires_subcategory_when_bag_category_is_selected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '種類未選択バッグ',
            'category' => 'bags',
            'subcategory' => '',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['subcategory']);
    }

    public function test_post_items_requires_subcategory_when_fashion_accessories_category_is_selected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '種類未選択小物',
            'category' => 'fashion_accessories',
            'subcategory' => '',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['subcategory']);
    }

    public function test_post_items_requires_subcategory_when_shoes_category_is_selected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '種類未選択シューズ',
            'category' => 'shoes',
            'subcategory' => '',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['subcategory']);
    }

    public function test_post_items_requires_shape_when_outerwear_coat_has_multiple_candidates(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'コート',
            'category' => 'outerwear',
            'subcategory' => 'coat',
            'shape' => '',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['shape']);
    }

    public function test_post_items_can_save_bottoms_length_type_spec(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'クロップド丈スカート',
            'category' => 'skirts',
            'shape' => 'a_line',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#123456',
                'label' => 'ネイビー',
            ]],
            'spec' => [
                'bottoms' => [
                    'length_type' => 'cropped',
                ],
            ],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.spec.bottoms.length_type', 'cropped');

        $item = Item::query()->findOrFail($response->json('item.id'));
        $this->assertSame('cropped', data_get($item->spec, 'bottoms.length_type'));
    }

    public function test_post_items_normalizes_legacy_bottoms_length_type_spec(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '旧値スカート',
            'category' => 'bottoms',
            'shape' => 'a-line-skirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#123456',
                'label' => 'ネイビー',
            ]],
            'spec' => [
                'bottoms' => [
                    'length_type' => 'midi',
                ],
            ],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.spec.bottoms.length_type', 'cropped');

        $item = Item::query()->findOrFail($response->json('item.id'));
        $this->assertSame('cropped', data_get($item->spec, 'bottoms.length_type'));
    }

    public function test_post_items_requires_bottoms_length_type_spec(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '丈未設定スカート',
            'category' => 'bottoms',
            'shape' => 'a_line',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#123456',
                'label' => 'ネイビー',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'spec.bottoms.length_type',
            ]);
    }

    public function test_post_items_can_save_legwear_coverage_type_spec(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'ソックス',
            'category' => 'legwear',
            'shape' => 'socks',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
            'spec' => [
                'legwear' => [
                    'coverage_type' => 'crew_socks',
                ],
            ],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.spec.legwear.coverage_type', 'crew_socks');

        $item = Item::query()->findOrFail($response->json('item.id'));
        $this->assertSame('crew_socks', data_get($item->spec, 'legwear.coverage_type'));
    }

    public function test_post_items_requires_legwear_coverage_type_for_socks(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '詳細未設定ソックス',
            'category' => 'legwear',
            'shape' => 'socks',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'spec.legwear.coverage_type',
            ]);
    }

    public function test_post_items_autofills_fixed_legwear_coverage_type_from_shape(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'タイツ',
            'category' => 'legwear',
            'shape' => 'tights',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.spec.legwear.coverage_type', 'tights');

        $item = Item::query()->findOrFail($response->json('item.id'));
        $this->assertSame('tights', data_get($item->spec, 'legwear.coverage_type'));
    }

    public function test_post_items_autofills_fixed_stockings_coverage_type_from_shape(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'ストッキング',
            'category' => 'legwear',
            'shape' => 'stockings',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'beige',
                'hex' => '#d8b89c',
                'label' => 'ベージュ',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.spec.legwear.coverage_type', 'stockings');

        $item = Item::query()->findOrFail($response->json('item.id'));
        $this->assertSame('stockings', data_get($item->spec, 'legwear.coverage_type'));
    }

    public function test_post_items_rejects_unknown_skin_exposure_spec_values(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '不正な丈アイテム',
            'category' => 'bottoms',
            'shape' => 'straight',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#123456',
                'label' => 'ネイビー',
            ]],
            'spec' => [
                'bottoms' => [
                    'length_type' => 'shortish',
                ],
                'legwear' => [
                    'coverage_type' => 'full_socks',
                ],
            ],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'spec.bottoms.length_type',
                'spec.legwear.coverage_type',
            ]);
    }

    public function test_post_items_rejects_legwear_coverage_type_for_non_legwear_category(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '不正レッグウェア',
            'category' => 'inner',
            'shape' => 'underwear',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
            'spec' => [
                'legwear' => [
                    'coverage_type' => 'tights',
                ],
            ],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'spec.legwear.coverage_type',
            ]);
    }

    public function test_post_items_rejects_mismatched_legwear_shape_and_coverage_type(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '不正ソックス',
            'category' => 'legwear',
            'shape' => 'socks',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'black',
                'hex' => '#111111',
                'label' => 'ブラック',
            ]],
            'spec' => [
                'legwear' => [
                    'coverage_type' => 'leggings_full',
                ],
            ],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'spec.legwear.coverage_type',
            ]);
    }

    public function test_post_items_can_save_tpo_ids_and_return_resolved_tpos(): void
    {
        $user = User::factory()->create();
        $workTpo = $this->createUserTpo($user, [
            'name' => '仕事',
            'sort_order' => 1,
            'is_preset' => true,
        ]);
        $tripTpo = $this->createUserTpo($user, [
            'name' => '出張',
            'sort_order' => 4,
            'is_preset' => false,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'TPO テストアイテム',
            'category' => 'tops',
            'subcategory' => 'tshirt_cutsew',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
            'seasons' => ['春'],
            'tpo_ids' => [$workTpo->id, $tripTpo->id],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.tpo_ids.0', $workTpo->id)
            ->assertJsonPath('item.tpo_ids.1', $tripTpo->id)
            ->assertJsonPath('item.tpos.0', '仕事')
            ->assertJsonPath('item.tpos.1', '出張');
    }

    public function test_post_items_skips_brand_candidate_creation_when_duplicate_exists(): void
    {
        $user = User::factory()->create();
        $this->createUserBrand($user);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '重複ブランド付きトップス',
            'brand_name' => ' uniqlo ',
            'save_brand_as_candidate' => true,
            'category' => 'tops',
            'subcategory' => 'tshirt_cutsew',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.brand_name', 'uniqlo');

        $this->assertSame(1, UserBrand::query()->where('user_id', $user->id)->count());
    }

    public function test_item_image_remains_after_candidate_source_file_is_deleted(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        Storage::disk('public')->put('purchase-candidates/1/image-1.png', 'candidate-image');

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '画像引き継ぎ確認',
            'category' => 'tops',
            'subcategory' => 'tshirt_cutsew',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
            'seasons' => ['夏'],
            'tpos' => ['休日'],
            'images' => [[
                'disk' => 'public',
                'path' => 'purchase-candidates/1/image-1.png',
                'original_filename' => 'candidate.png',
                'mime_type' => 'image/png',
                'file_size' => 2048,
                'sort_order' => 1,
                'is_primary' => true,
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated();
        $itemImagePath = $response->json('item.images.0.path');

        Storage::disk('public')->delete('purchase-candidates/1/image-1.png');

        Storage::disk('public')->assertMissing('purchase-candidates/1/image-1.png');
        Storage::disk('public')->assertExists($itemImagePath);
    }

    public function test_post_items_rejects_other_users_purchase_candidate_id(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $candidate = $this->createPurchaseCandidate($otherUser);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '不正な昇格',
            'purchase_candidate_id' => $candidate->id,
            'category' => 'tops',
            'subcategory' => 'tshirt_cutsew',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.purchase_candidate_id.0', '紐付け元の購入検討が見つかりません。');
    }

    public function test_post_items_rolls_back_candidate_promotion_when_source_image_is_missing(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $candidate = $this->createPurchaseCandidate($user);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => '画像欠落確認',
            'purchase_candidate_id' => $candidate->id,
            'category' => 'outer',
            'shape' => 'trench',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#123456',
                'label' => 'ネイビー',
            ]],
            'images' => [[
                'disk' => 'public',
                'path' => 'purchase-candidates/999/missing.png',
                'original_filename' => 'missing.png',
                'mime_type' => 'image/png',
                'file_size' => 2048,
                'sort_order' => 1,
                'is_primary' => true,
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.images.0', '引き継ぎ元画像が見つかりません。');

        $this->assertDatabaseMissing('items', [
            'user_id' => $user->id,
            'name' => '画像欠落確認',
        ]);
        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $candidate->id,
            'status' => 'considering',
            'converted_item_id' => null,
            'converted_at' => null,
        ]);
    }

    public function test_get_item_returns_purchase_fields_and_images(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'brand_name' => 'Detail Brand',
            'care_status' => 'in_cleaning',
            'price' => 22000,
            'purchase_url' => 'https://example.test/detail',
            'memo' => 'detail memo',
            'purchased_at' => '2026-03-20',
            'size_gender' => 'unisex',
            'size_label' => 'FREE',
            'size_note' => '袖丈長め',
            'size_details' => [
                'structured' => [
                    'body_length' => 120.0,
                ],
                'custom_fields' => [
                    [
                        'label' => '裄丈',
                        'value' => 84.0,
                        'sort_order' => 1,
                    ],
                ],
            ],
            'is_rain_ok' => true,
            'category' => 'outerwear',
            'subcategory' => 'coat',
            'shape' => 'coat',
        ]);
        $item->images()->create([
            'disk' => 'public',
            'path' => 'items/1/coat.png',
            'original_filename' => 'coat.png',
            'mime_type' => 'image/png',
            'file_size' => 1024,
            'sort_order' => 1,
            'is_primary' => true,
        ]);
        $item->materials()->createMany($this->buildMaterialsPayload());

        $this->actingAs($user, 'web');

        $response = $this->getJson("/api/items/{$item->id}", [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('item.brand_name', 'Detail Brand')
            ->assertJsonPath('item.care_status', 'in_cleaning')
            ->assertJsonPath('item.price', 22000)
            ->assertJsonPath('item.purchase_url', 'https://example.test/detail')
            ->assertJsonPath('item.memo', 'detail memo')
            ->assertJsonPath('item.size_details.structured.body_length', 120)
            ->assertJsonPath('item.size_details.custom_fields.0.label', '裄丈')
            ->assertJsonPath('item.is_rain_ok', true)
            ->assertJsonPath('item.images.0.path', 'items/1/coat.png')
            ->assertJsonPath('item.materials.0.material_name', '綿')
            ->assertJsonPath('item.materials.2.part_label', '裏地');
    }

    public function test_put_item_updates_purchase_fields_and_image_ordering(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'category' => 'outerwear',
            'subcategory' => 'coat',
            'shape' => 'coat',
        ]);
        Storage::disk('public')->put(sprintf('items/%d/original.png', $item->id), 'original-image');
        Storage::disk('public')->put('purchase-candidates/1/updated.png', 'candidate-image');
        $item->images()->create([
            'disk' => 'public',
            'path' => sprintf('items/%d/original.png', $item->id),
            'original_filename' => 'original.png',
            'mime_type' => 'image/png',
            'file_size' => 1000,
            'sort_order' => 1,
            'is_primary' => true,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->putJson("/api/items/{$item->id}", [
            'name' => '更新後アイテム',
            'brand_name' => 'Updated Brand',
            'care_status' => 'in_cleaning',
            'price' => 19800,
            'purchase_url' => 'https://example.test/updated',
            'memo' => '更新メモ',
            'purchased_at' => '2026-03-24',
            'size_gender' => 'women',
            'size_label' => 'L',
            'size_note' => '袖丈確認済み',
            'size_details' => [
                'structured' => [
                    'shoulder_width' => 42.0,
                ],
                'custom_fields' => [
                    [
                        'label' => '裾幅',
                        'value' => 52.0,
                        'sort_order' => 1,
                    ],
                ],
            ],
            'is_rain_ok' => true,
            'category' => 'outerwear',
            'subcategory' => 'coat',
            'shape' => 'coat',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#123456',
                'label' => 'ネイビー',
            ]],
            'seasons' => ['春'],
            'tpos' => ['仕事'],
            'materials' => $this->buildMaterialsPayload(),
            'images' => [
                [
                    'disk' => 'public',
                    'path' => 'purchase-candidates/1/updated.png',
                    'original_filename' => 'updated.png',
                    'mime_type' => 'image/png',
                    'file_size' => 1500,
                    'sort_order' => 1,
                    'is_primary' => true,
                ],
                [
                    'disk' => 'public',
                    'path' => sprintf('items/%d/original.png', $item->id),
                    'original_filename' => 'original.png',
                    'mime_type' => 'image/png',
                    'file_size' => 1000,
                    'sort_order' => 2,
                    'is_primary' => false,
                ],
            ],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('item.name', '更新後アイテム')
            ->assertJsonPath('item.category', 'outerwear')
            ->assertJsonPath('item.subcategory', 'coat')
            ->assertJsonPath('item.shape', 'coat')
            ->assertJsonPath('item.brand_name', 'Updated Brand')
            ->assertJsonPath('item.care_status', 'in_cleaning')
            ->assertJsonPath('item.memo', '更新メモ')
            ->assertJsonPath('item.materials.0.ratio', 80)
            ->assertJsonPath('item.images.0.sort_order', 1)
            ->assertJsonPath('item.images.0.is_primary', true)
            ->assertJsonPath('item.images.1.sort_order', 2)
            ->assertJsonPath('item.images.1.is_primary', false);

        $updatedImagePath = $response->json('item.images.0.path');
        $retainedImagePath = $response->json('item.images.1.path');

        $this->assertStringStartsWith(sprintf('items/%d/', $item->id), $updatedImagePath);
        $this->assertNotSame('purchase-candidates/1/updated.png', $updatedImagePath);
        $this->assertSame(sprintf('items/%d/original.png', $item->id), $retainedImagePath);
        Storage::disk('public')->assertExists('purchase-candidates/1/updated.png');
        Storage::disk('public')->assertExists($updatedImagePath);
        Storage::disk('public')->assertExists($retainedImagePath);

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'brand_name' => 'Updated Brand',
            'price' => 19800,
            'memo' => '更新メモ',
            'subcategory' => 'coat',
            'care_status' => 'in_cleaning',
            'shape' => 'coat',
        ]);
        $this->assertDatabaseHas('item_images', [
            'item_id' => $item->id,
            'path' => $updatedImagePath,
            'sort_order' => 1,
            'is_primary' => 1,
        ]);
        $this->assertDatabaseHas('item_materials', [
            'item_id' => $item->id,
            'part_label' => '裏地',
            'material_name' => 'ポリエステル',
            'ratio' => 100,
        ]);
        $this->assertDatabaseHas('item_images', [
            'item_id' => $item->id,
            'path' => $retainedImagePath,
            'sort_order' => 2,
            'is_primary' => 0,
        ]);
    }

    public function test_put_item_can_add_brand_candidate_without_failing_item_update(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user);

        $this->actingAs($user, 'web');

        $response = $this->putJson("/api/items/{$item->id}", [
            'name' => '更新後トップス',
            'brand_name' => 'GLOBAL WORK',
            'save_brand_as_candidate' => true,
            'category' => 'tops',
            'subcategory' => 'tshirt_cutsew',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
            'seasons' => ['夏'],
            'tpos' => ['休日'],
            'images' => [],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('item.brand_name', 'GLOBAL WORK');

        $this->assertDatabaseHas('user_brands', [
            'user_id' => $user->id,
            'name' => 'GLOBAL WORK',
            'normalized_name' => 'global work',
        ]);
    }

    public function test_put_item_keeps_selected_inactive_tpo_ids(): void
    {
        $user = User::factory()->create();
        $inactiveTpo = $this->createUserTpo($user, [
            'name' => '在宅',
            'sort_order' => 4,
            'is_active' => false,
            'is_preset' => false,
        ]);
        $item = $this->createItem($user, [
            'tpos' => [],
            'tpo_ids' => [$inactiveTpo->id],
        ]);

        $this->actingAs($user, 'web');

        $response = $this->putJson("/api/items/{$item->id}", [
            'name' => '更新後トップス',
            'category' => 'tops',
            'subcategory' => 'tshirt_cutsew',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#eeeeee',
                'label' => 'ホワイト',
            ]],
            'tpo_ids' => [$inactiveTpo->id],
            'images' => [],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('item.tpo_ids.0', $inactiveTpo->id)
            ->assertJsonPath('item.tpos.0', '在宅');
    }

    public function test_post_item_image_uploads_to_item_storage(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $item = $this->createItem($user);

        $this->actingAs($user, 'web');

        $response = $this->post(
            "/api/items/{$item->id}/images",
            [
                'image' => $this->createFakePng('item.png'),
                'sort_order' => 1,
                'is_primary' => true,
            ],
            ['Accept' => 'application/json'],
        );

        $response->assertCreated()
            ->assertJsonPath('image.item_id', $item->id)
            ->assertJsonPath('image.is_primary', true);

        $path = $response->json('image.path');
        $this->assertStringStartsWith(sprintf('items/%d/', $item->id), $path);
        Storage::disk('public')->assertExists($path);
        $this->assertDatabaseHas('item_images', [
            'item_id' => $item->id,
            'path' => $path,
            'is_primary' => 1,
        ]);
    }

    public function test_delete_item_image_removes_file_and_reassigns_primary(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $item = $this->createItem($user);

        Storage::disk('public')->put(sprintf('items/%d/first.png', $item->id), 'first');
        Storage::disk('public')->put(sprintf('items/%d/second.png', $item->id), 'second');

        $first = $item->images()->create([
            'disk' => 'public',
            'path' => sprintf('items/%d/first.png', $item->id),
            'original_filename' => 'first.png',
            'mime_type' => 'image/png',
            'file_size' => 1000,
            'sort_order' => 1,
            'is_primary' => true,
        ]);
        $second = $item->images()->create([
            'disk' => 'public',
            'path' => sprintf('items/%d/second.png', $item->id),
            'original_filename' => 'second.png',
            'mime_type' => 'image/png',
            'file_size' => 1000,
            'sort_order' => 2,
            'is_primary' => false,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->deleteJson("/api/items/{$item->id}/images/{$first->id}", [], [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'deleted');

        Storage::disk('public')->assertMissing(sprintf('items/%d/first.png', $item->id));
        Storage::disk('public')->assertExists(sprintf('items/%d/second.png', $item->id));
        $this->assertDatabaseMissing('item_images', [
            'id' => $first->id,
        ]);
        $this->assertDatabaseHas('item_images', [
            'id' => $second->id,
            'is_primary' => 1,
        ]);
    }

    public function test_post_item_image_returns_404_for_other_users_item(): void
    {
        Storage::fake('public');

        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $item = $this->createItem($owner);

        $this->actingAs($otherUser, 'web');

        $response = $this->post(
            "/api/items/{$item->id}/images",
            [
                'image' => $this->createFakePng('other.png'),
            ],
            ['Accept' => 'application/json'],
        );

        $response->assertNotFound();
    }

    public function test_delete_item_deletes_unreferenced_item(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'name' => '誤登録アイテム',
        ]);

        $this->actingAs($user, 'web');

        $response = $this->deleteJson("/api/items/{$item->id}", [], [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'deleted');

        $this->assertDatabaseMissing('items', [
            'id' => $item->id,
        ]);
    }

    public function test_delete_item_returns_422_when_item_is_referenced_by_outfit(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'name' => '参照中トップス',
        ]);
        $outfit = \App\Models\Outfit::query()->create([
            'user_id' => $user->id,
            'name' => '参照中コーデ',
            'status' => 'active',
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);
        $outfit->outfitItems()->create([
            'item_id' => $item->id,
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->deleteJson("/api/items/{$item->id}", [], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'このアイテムは参照中のため完全に削除できません。手放す操作を利用してください。');

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
        ]);
    }

    public function test_delete_item_returns_422_when_item_is_referenced_by_wear_log(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'name' => '参照中ボトムス',
        ]);
        $wearLog = \App\Models\WearLog::query()->create([
            'user_id' => $user->id,
            'event_date' => '2026-04-01',
            'status' => 'worn',
            'display_order' => 1,
            'memo' => null,
        ]);
        $wearLog->wearLogItems()->create([
            'source_item_id' => $item->id,
            'item_source_type' => 'manual',
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->deleteJson("/api/items/{$item->id}", [], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'このアイテムは参照中のため完全に削除できません。手放す操作を利用してください。');

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
        ]);
    }

    public function test_post_item_care_status_updates_and_clears_care_status(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user);

        $this->actingAs($user, 'web');

        $setResponse = $this->postJson("/api/items/{$item->id}/care-status", [
            'care_status' => 'in_cleaning',
        ], [
            'Accept' => 'application/json',
        ]);

        $setResponse->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('item.care_status', 'in_cleaning');

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'care_status' => 'in_cleaning',
        ]);

        $clearResponse = $this->postJson("/api/items/{$item->id}/care-status", [
            'care_status' => null,
        ], [
            'Accept' => 'application/json',
        ]);

        $clearResponse->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('item.care_status', null);

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'care_status' => null,
        ]);
    }
}
