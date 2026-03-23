<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OutfitsEndpointsTest extends TestCase
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
            'name' => 'テストアイテム',
            'category' => 'tops',
            'shape' => 'tshirt',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#1F3A5F',
                'label' => 'ネイビー',
            ]],
            'seasons' => ['春'],
            'tpos' => ['休日'],
            'spec' => null,
        ], $overrides));
    }

    public function test_get_outfits_returns_401_when_unauthenticated(): void
    {
        $response = $this->getJson('/api/outfits', [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(401);
    }

    public function test_get_outfits_returns_only_current_users_outfits(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'name' => '自分のコーデ',
            'memo' => 'memo',
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);

        Outfit::query()->create([
            'user_id' => $otherUser->id,
            'name' => '他人のコーデ',
            'memo' => 'memo',
            'seasons' => ['夏'],
            'tpos' => ['仕事'],
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/outfits', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'outfits')
            ->assertJsonPath('outfits.0.id', $outfit->id)
            ->assertJsonPath('outfits.0.name', '自分のコーデ');
    }

    public function test_get_outfits_excludes_invalid_outfits_from_normal_list(): void
    {
        $user = User::factory()->create();

        $activeOutfit = Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '通常表示コーデ',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);

        Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'invalid',
            'name' => '無効コーデ',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/outfits', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'outfits')
            ->assertJsonPath('outfits.0.id', $activeOutfit->id)
            ->assertJsonPath('outfits.0.name', '通常表示コーデ')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.totalAll', 1);

        $response->assertJsonMissing([
            'name' => '無効コーデ',
        ]);
    }

    public function test_post_outfits_creates_outfit_and_outfit_items(): void
    {
        $user = User::factory()->create();
        $itemA = $this->createItem($user, ['name' => 'トップス']);
        $itemB = $this->createItem($user, ['name' => 'ボトムス', 'category' => 'bottoms', 'shape' => 'wide']);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/outfits', [
            'name' => '休日コーデ',
            'memo' => 'テストメモ',
            'seasons' => ['春', '秋'],
            'tpos' => ['休日'],
            'items' => [
                ['item_id' => $itemA->id, 'sort_order' => 1],
                ['item_id' => $itemB->id, 'sort_order' => 2],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'created')
            ->assertJsonPath('outfit.name', '休日コーデ')
            ->assertJsonCount(2, 'outfit.outfit_items');

        $this->assertDatabaseHas('outfits', [
            'user_id' => $user->id,
            'name' => '休日コーデ',
        ]);
        $this->assertDatabaseCount('outfit_items', 2);
    }

    public function test_post_outfits_returns_422_when_item_ids_include_other_users_item(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $ownedItem = $this->createItem($user);
        $otherUsersItem = $this->createItem($otherUser);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/outfits', [
            'name' => '休日コーデ',
            'items' => [
                ['item_id' => $ownedItem->id, 'sort_order' => 1],
                ['item_id' => $otherUsersItem->id, 'sort_order' => 2],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', '選択したアイテムに不正なデータが含まれています。');
    }

    public function test_post_outfits_returns_422_when_items_include_disposed_item(): void
    {
        $user = User::factory()->create();
        $activeItem = $this->createItem($user, ['name' => '使用可能']);
        $disposedItem = $this->createItem($user, [
            'name' => '手放し済み',
            'status' => 'disposed',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/outfits', [
            'name' => '休日コーデ',
            'items' => [
                ['item_id' => $activeItem->id, 'sort_order' => 1],
                ['item_id' => $disposedItem->id, 'sort_order' => 2],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', '選択したアイテムに不正なデータが含まれています。');
    }

    public function test_get_outfit_returns_only_owned_outfit(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $item = $this->createItem($user);

        $ownedOutfit = Outfit::query()->create([
            'user_id' => $user->id,
            'name' => '自分のコーデ',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);
        $ownedOutfit->outfitItems()->create([
            'item_id' => $item->id,
            'sort_order' => 1,
        ]);

        $otherOutfit = Outfit::query()->create([
            'user_id' => $otherUser->id,
            'name' => '他人のコーデ',
            'memo' => null,
            'seasons' => ['夏'],
            'tpos' => ['仕事'],
        ]);

        $this->actingAs($user, 'web');

        $this->getJson("/api/outfits/{$ownedOutfit->id}", [
            'Accept' => 'application/json',
        ])->assertOk()
          ->assertJsonPath('outfit.id', $ownedOutfit->id);

        $this->getJson("/api/outfits/{$otherOutfit->id}", [
            'Accept' => 'application/json',
        ])->assertStatus(404);
    }

    public function test_put_outfits_updates_outfit_and_replaces_items(): void
    {
        $user = User::factory()->create();
        $itemA = $this->createItem($user, ['name' => 'トップス']);
        $itemB = $this->createItem($user, ['name' => 'ボトムス', 'category' => 'bottoms', 'shape' => 'wide']);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'name' => '更新前',
            'memo' => 'old memo',
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);
        $outfit->outfitItems()->create([
            'item_id' => $itemA->id,
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/outfits/{$outfit->id}", [
            'name' => '更新後',
            'memo' => 'new memo',
            'seasons' => ['秋'],
            'tpos' => ['仕事'],
            'items' => [
                ['item_id' => $itemB->id, 'sort_order' => 1],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('outfit.name', '更新後')
            ->assertJsonCount(1, 'outfit.outfit_items')
            ->assertJsonPath('outfit.outfit_items.0.item_id', $itemB->id);

        $this->assertDatabaseHas('outfits', [
            'id' => $outfit->id,
            'name' => '更新後',
            'memo' => 'new memo',
        ]);
        $this->assertDatabaseCount('outfit_items', 1);
    }

    public function test_put_outfits_returns_422_when_items_include_disposed_item(): void
    {
        $user = User::factory()->create();
        $activeItem = $this->createItem($user, ['name' => '使用可能']);
        $disposedItem = $this->createItem($user, [
            'name' => '手放し済み',
            'status' => 'disposed',
        ]);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'name' => '更新前',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);
        $outfit->outfitItems()->create([
            'item_id' => $activeItem->id,
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/outfits/{$outfit->id}", [
            'name' => '更新後',
            'items' => [
                ['item_id' => $disposedItem->id, 'sort_order' => 1],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', '選択したアイテムに不正なデータが含まれています。');

        $this->assertDatabaseHas('outfits', [
            'id' => $outfit->id,
            'name' => '更新前',
        ]);
        $this->assertDatabaseHas('outfit_items', [
            'outfit_id' => $outfit->id,
            'item_id' => $activeItem->id,
        ]);
    }

    public function test_put_outfits_returns_422_when_items_include_other_users_item(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $ownedItem = $this->createItem($user, ['name' => '自分のアイテム']);
        $otherUsersItem = $this->createItem($otherUser, ['name' => '他人のアイテム']);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'name' => '更新前',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);
        $outfit->outfitItems()->create([
            'item_id' => $ownedItem->id,
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/outfits/{$outfit->id}", [
            'name' => '更新後',
            'items' => [
                ['item_id' => $ownedItem->id, 'sort_order' => 1],
                ['item_id' => $otherUsersItem->id, 'sort_order' => 2],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', '選択したアイテムに不正なデータが含まれています。');

        $this->assertDatabaseHas('outfits', [
            'id' => $outfit->id,
            'name' => '更新前',
        ]);
        $this->assertDatabaseHas('outfit_items', [
            'outfit_id' => $outfit->id,
            'item_id' => $ownedItem->id,
            'sort_order' => 1,
        ]);
    }

    public function test_delete_outfit_deletes_only_owned_outfit(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $ownedOutfit = Outfit::query()->create([
            'user_id' => $user->id,
            'name' => '削除対象',
            'memo' => null,
            'seasons' => [],
            'tpos' => [],
        ]);

        $otherOutfit = Outfit::query()->create([
            'user_id' => $otherUser->id,
            'name' => '他人のコーデ',
            'memo' => null,
            'seasons' => [],
            'tpos' => [],
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->deleteJson("/api/outfits/{$ownedOutfit->id}", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk()
          ->assertJsonPath('message', 'deleted');

        $this->assertDatabaseMissing('outfits', ['id' => $ownedOutfit->id]);
        $this->assertDatabaseHas('outfits', ['id' => $otherOutfit->id]);

        $this->deleteJson("/api/outfits/{$otherOutfit->id}", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(404);
    }

    public function test_get_outfits_applies_filters_sort_and_pagination(): void
    {
        $user = User::factory()->create();

        for ($index = 1; $index <= 13; $index++) {
            Outfit::query()->create([
                'user_id' => $user->id,
                'name' => sprintf('夏コーデ%02d', $index),
                'memo' => null,
                'seasons' => ['夏'],
                'tpos' => ['休日'],
            ]);
        }

        Outfit::query()->create([
            'user_id' => $user->id,
            'name' => '春コーデ',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['仕事'],
        ]);

        $otherUser = User::factory()->create();
        Outfit::query()->create([
            'user_id' => $otherUser->id,
            'name' => '他人の夏コーデ',
            'memo' => null,
            'seasons' => ['夏'],
            'tpos' => ['休日'],
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/outfits?keyword=%E5%A4%8F&season=%E5%A4%8F&tpo=%E4%BC%91%E6%97%A5&sort=name_asc&page=2', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'outfits')
            ->assertJsonPath('outfits.0.name', '夏コーデ13')
            ->assertJsonPath('meta.total', 13)
            ->assertJsonPath('meta.totalAll', 14)
            ->assertJsonPath('meta.page', 2)
            ->assertJsonPath('meta.lastPage', 2);

        $response->assertJsonMissing([
            'name' => '春コーデ',
        ]);
    }
}
