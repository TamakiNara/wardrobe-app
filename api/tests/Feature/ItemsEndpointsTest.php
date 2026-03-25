<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ItemsEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function createItem(User $user, array $overrides = []): Item
    {
        return Item::query()->create(array_merge([
            'user_id' => $user->id,
            'name' => 'テストアイテム',
            'brand_name' => null,
            'price' => null,
            'purchase_url' => null,
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
        Storage::disk('public')->put('purchase-candidates/1/image-1.png', 'candidate-image');

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/items', [
            'name' => 'レインコート',
            'brand_name' => 'Sample Brand',
            'price' => 14800,
            'purchase_url' => 'https://example.test/products/coat',
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
            'size_gender' => 'women',
            'is_rain_ok' => 1,
        ]);
        $this->assertDatabaseHas('item_images', [
            'item_id' => $itemId,
            'path' => $copiedPath,
            'is_primary' => 1,
        ]);
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

    public function test_get_item_returns_purchase_fields_and_images(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'brand_name' => 'Detail Brand',
            'price' => 22000,
            'purchase_url' => 'https://example.test/detail',
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
            ->assertJsonPath('item.price', 22000)
            ->assertJsonPath('item.purchase_url', 'https://example.test/detail')
            ->assertJsonPath('item.size_details.note', '着丈 120cm')
            ->assertJsonPath('item.is_rain_ok', true)
            ->assertJsonPath('item.images.0.path', 'items/1/coat.png');
    }

    public function test_put_item_updates_purchase_fields_and_images(): void
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
            'price' => 19800,
            'purchase_url' => 'https://example.test/updated',
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
            'images' => [[
                'disk' => 'public',
                'path' => 'purchase-candidates/1/updated.png',
                'original_filename' => 'updated.png',
                'mime_type' => 'image/png',
                'file_size' => 1500,
                'sort_order' => 1,
                'is_primary' => true,
            ]],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('item.name', '更新後アイテム')
            ->assertJsonPath('item.category', 'outer')
            ->assertJsonPath('item.shape', 'trench')
            ->assertJsonPath('item.brand_name', 'Updated Brand');

        $updatedImagePath = $response->json('item.images.0.path');

        $this->assertStringStartsWith(sprintf('items/%d/', $item->id), $updatedImagePath);
        $this->assertNotSame('purchase-candidates/1/updated.png', $updatedImagePath);
        Storage::disk('public')->assertExists('purchase-candidates/1/updated.png');
        Storage::disk('public')->assertExists($updatedImagePath);

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'brand_name' => 'Updated Brand',
            'price' => 19800,
            'shape' => 'trench',
        ]);
        $this->assertDatabaseHas('item_images', [
            'item_id' => $item->id,
            'path' => $updatedImagePath,
        ]);
        $this->assertDatabaseMissing('item_images', [
            'item_id' => $item->id,
            'path' => sprintf('items/%d/original.png', $item->id),
        ]);
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
                'image' => UploadedFile::fake()->image('item.png', 600, 900)->size(500),
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
                'image' => UploadedFile::fake()->image('other.png', 600, 900)->size(500),
            ],
            ['Accept' => 'application/json'],
        );

        $response->assertNotFound();
    }
}
