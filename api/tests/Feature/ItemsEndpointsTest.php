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

    private function createPurchaseCategory(string $id = 'outer_coat', string $groupId = 'outer', string $name = 'コート'): void
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
        $categoryId = $overrides['category_id'] ?? 'outer_coat';
        $this->createPurchaseCategory($categoryId);

        return PurchaseCandidate::query()->create(array_merge([
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
            'visible_category_ids' => ['tops_tshirt'],
        ])->save();

        for ($index = 1; $index <= 13; $index++) {
            $this->createItem($user, [
                'name' => sprintf('白T%02d', $index),
                'shape' => 'tshirt',
                'seasons' => ['夏'],
                'tpos' => ['休日'],
            ]);
        }

        $this->createItem($user, [
            'name' => '白シャツ',
            'shape' => 'shirt',
            'seasons' => ['夏'],
            'tpos' => ['休日'],
        ]);

        $otherUser = User::factory()->create();
        $this->createItem($otherUser, [
            'name' => '他人の白T',
            'shape' => 'tshirt',
            'seasons' => ['夏'],
            'tpos' => ['休日'],
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/items?keyword=%E7%99%BD&season=%E5%A4%8F&tpo=%E4%BC%91%E6%97%A5&sort=name_asc&page=2', [
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
            ->assertJsonPath('meta.availableSeasons.0', '夏')
            ->assertJsonPath('meta.availableTpos.0', '休日');

        $response->assertJsonMissing([
            'name' => '白シャツ',
        ]);
    }

    public function test_get_items_excludes_disposed_items_from_normal_list(): void
    {
        $user = User::factory()->create();
        $user->forceFill([
            'visible_category_ids' => ['tops_tshirt'],
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

    public function test_post_items_stores_purchase_fields_and_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $candidate = $this->createPurchaseCandidate($user);
        Storage::disk('public')->put(
            'purchase-candidates/1/image-1.png',
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
                'note' => '裄丈 78cm',
            ],
            'is_rain_ok' => true,
            'category' => 'outer',
            'shape' => 'trench',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#123456',
                'label' => 'ネイビー',
            ]],
            'seasons' => ['春', '秋'],
            'tpos' => ['仕事'],
            'images' => [[
                'disk' => 'public',
                'path' => 'purchase-candidates/1/image-1.png',
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
            ->assertJsonPath('item.size_gender', 'women')
            ->assertJsonPath('item.size_label', 'M')
            ->assertJsonPath('item.size_note', '厚手ニット込み')
            ->assertJsonPath('item.size_details.note', '裄丈 78cm')
            ->assertJsonPath('item.is_rain_ok', true)
            ->assertJsonPath('item.images.0.is_primary', true);

        $itemId = $response->json('item.id');
        $copiedPath = $response->json('item.images.0.path');

        $this->assertNotSame('purchase-candidates/1/image-1.png', $copiedPath);
        $this->assertStringStartsWith(sprintf('items/%d/', $itemId), $copiedPath);
        Storage::disk('public')->assertExists('purchase-candidates/1/image-1.png');
        Storage::disk('public')->assertExists($copiedPath);

        $this->assertDatabaseHas('items', [
            'id' => $itemId,
            'brand_name' => 'Sample Brand',
            'price' => 14800,
            'memo' => '購入検討メモ',
            'size_gender' => 'women',
            'is_rain_ok' => 1,
        ]);
        $this->assertDatabaseHas('item_images', [
            'item_id' => $itemId,
            'path' => $copiedPath,
            'is_primary' => 1,
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

    public function test_post_items_can_save_brand_name_and_add_brand_candidate(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'ブランド付きトップス',
            'brand_name' => 'UNIQLO',
            'save_brand_as_candidate' => true,
            'category' => 'tops',
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

    public function test_post_items_can_save_bottoms_length_type_spec(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'ミディ丈スカート',
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
            ->assertJsonPath('item.spec.bottoms.length_type', 'midi');

        $item = Item::query()->findOrFail($response->json('item.id'));
        $this->assertSame('midi', data_get($item->spec, 'bottoms.length_type'));
    }

    public function test_post_items_can_save_legwear_coverage_type_spec(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'タイツ',
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

        $response->assertCreated()
            ->assertJsonPath('item.spec.legwear.coverage_type', 'tights');

        $item = Item::query()->findOrFail($response->json('item.id'));
        $this->assertSame('tights', data_get($item->spec, 'legwear.coverage_type'));
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
            'size_details' => ['note' => '着丈 120cm'],
            'is_rain_ok' => true,
            'category' => 'outer',
            'shape' => 'trench',
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
            ->assertJsonPath('item.size_details.note', '着丈 120cm')
            ->assertJsonPath('item.is_rain_ok', true)
            ->assertJsonPath('item.images.0.path', 'items/1/coat.png');
    }

    public function test_put_item_updates_purchase_fields_and_image_ordering(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'category' => 'outer',
            'shape' => 'trench',
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
                'note' => '肩幅 42cm',
            ],
            'is_rain_ok' => true,
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
            ->assertJsonPath('item.category', 'outer')
            ->assertJsonPath('item.shape', 'trench')
            ->assertJsonPath('item.brand_name', 'Updated Brand')
            ->assertJsonPath('item.care_status', 'in_cleaning')
            ->assertJsonPath('item.memo', '更新メモ')
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
            'care_status' => 'in_cleaning',
            'shape' => 'trench',
        ]);
        $this->assertDatabaseHas('item_images', [
            'item_id' => $item->id,
            'path' => $updatedImagePath,
            'sort_order' => 1,
            'is_primary' => 1,
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
