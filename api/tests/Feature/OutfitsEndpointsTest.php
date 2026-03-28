<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use App\Models\UserTpo;
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

    private function createUserTpo(User $user, array $overrides = []): UserTpo
    {
        return UserTpo::query()->create(array_merge([
            'user_id' => $user->id,
            'name' => '仕事',
            'sort_order' => 1,
            'is_active' => true,
            'is_preset' => true,
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
        $otherUser = User::factory()->create();

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

        Outfit::query()->create([
            'user_id' => $otherUser->id,
            'status' => 'active',
            'name' => '他人の通常コーデ',
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
        $response->assertJsonMissing([
            'name' => '他人の通常コーデ',
        ]);
    }

    public function test_get_invalid_outfits_returns_only_current_users_invalid_outfits(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '通常コーデ',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);

        $invalidOutfit = Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'invalid',
            'name' => '無効コーデ',
            'memo' => null,
            'seasons' => ['秋'],
            'tpos' => ['仕事'],
        ]);

        Outfit::query()->create([
            'user_id' => $otherUser->id,
            'status' => 'invalid',
            'name' => '他人の無効コーデ',
            'memo' => null,
            'seasons' => ['冬'],
            'tpos' => ['休日'],
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/outfits/invalid', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'outfits')
            ->assertJsonPath('outfits.0.id', $invalidOutfit->id)
            ->assertJsonPath('outfits.0.name', '無効コーデ')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.totalAll', 1);

        $response->assertJsonMissing([
            'name' => '通常コーデ',
        ]);
        $response->assertJsonMissing([
            'name' => '他人の無効コーデ',
        ]);
    }

    public function test_post_outfit_restore_restores_invalid_outfit_when_all_items_are_active(): void
    {
        $user = User::factory()->create();
        $itemA = $this->createItem($user, ['name' => 'トップス']);
        $itemB = $this->createItem($user, ['name' => 'ボトムス', 'category' => 'bottoms']);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'invalid',
            'name' => '復帰対象',
            'memo' => 'memo',
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);
        $outfit->outfitItems()->createMany([
            ['item_id' => $itemA->id, 'sort_order' => 1],
            ['item_id' => $itemB->id, 'sort_order' => 2],
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/outfits/{$outfit->id}/restore", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'restored')
            ->assertJsonPath('outfit.id', $outfit->id)
            ->assertJsonPath('outfit.status', 'active')
            ->assertJsonCount(2, 'outfit.outfit_items')
            ->assertJsonPath('outfit.outfit_items.0.item_id', $itemA->id)
            ->assertJsonPath('outfit.outfit_items.1.item_id', $itemB->id);

        $this->assertDatabaseHas('outfits', [
            'id' => $outfit->id,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('outfit_items', [
            'outfit_id' => $outfit->id,
            'item_id' => $itemA->id,
            'sort_order' => 1,
        ]);
        $this->assertDatabaseHas('outfit_items', [
            'outfit_id' => $outfit->id,
            'item_id' => $itemB->id,
            'sort_order' => 2,
        ]);
    }

    public function test_post_outfit_restore_returns_422_when_outfit_includes_disposed_item(): void
    {
        $user = User::factory()->create();
        $disposedItem = $this->createItem($user, [
            'name' => '手放し済み',
            'status' => 'disposed',
        ]);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'invalid',
            'name' => '復帰不可',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);
        $outfit->outfitItems()->create([
            'item_id' => $disposedItem->id,
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/outfits/{$outfit->id}/restore", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'このコーディネートは復帰できません。');

        $this->assertDatabaseHas('outfits', [
            'id' => $outfit->id,
            'status' => 'invalid',
        ]);
    }

    public function test_post_outfit_restore_returns_422_when_outfit_is_already_active(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '通常コーデ',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);
        $outfit->outfitItems()->create([
            'item_id' => $item->id,
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/outfits/{$outfit->id}/restore", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'このコーディネートは復帰できません。');
    }

    public function test_post_outfit_restore_returns_404_for_other_users_outfit(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $item = $this->createItem($otherUser);

        $outfit = Outfit::query()->create([
            'user_id' => $otherUser->id,
            'status' => 'invalid',
            'name' => '他人の無効コーデ',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);
        $outfit->outfitItems()->create([
            'item_id' => $item->id,
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->postJson("/api/outfits/{$outfit->id}/restore", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(404);
    }

    public function test_post_outfit_duplicate_returns_payload_for_active_outfit(): void
    {
        $user = User::factory()->create();
        $itemA = $this->createItem($user, ['name' => 'トップス']);
        $itemB = $this->createItem($user, ['name' => 'ボトムス', 'category' => 'bottoms']);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '通勤コーデ',
            'memo' => '春秋向け',
            'seasons' => ['春', '秋'],
            'tpos' => ['仕事'],
        ]);
        $outfit->outfitItems()->createMany([
            ['item_id' => $itemA->id, 'sort_order' => 1],
            ['item_id' => $itemB->id, 'sort_order' => 2],
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/outfits/{$outfit->id}/duplicate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'duplicated_payload_ready')
            ->assertJsonPath('outfit.name', '通勤コーデ（コピー）')
            ->assertJsonPath('outfit.memo', '春秋向け')
            ->assertJsonPath('outfit.seasons.0', '春')
            ->assertJsonPath('outfit.seasons.1', '秋')
            ->assertJsonPath('outfit.tpos.0', '仕事')
            ->assertJsonCount(2, 'outfit.items')
            ->assertJsonPath('outfit.items.0.item_id', $itemA->id)
            ->assertJsonPath('outfit.items.0.sort_order', 1)
            ->assertJsonPath('outfit.items.0.selectable', true)
            ->assertJsonPath('outfit.items.0.note', null)
            ->assertJsonPath('outfit.items.1.item_id', $itemB->id)
            ->assertJsonPath('outfit.items.1.sort_order', 2)
            ->assertJsonPath('outfit.items.1.selectable', true)
            ->assertJsonPath('outfit.items.1.note', null);

        $response->assertJsonMissingPath('outfit.id');
        $response->assertJsonMissingPath('outfit.status');
        $response->assertJsonMissingPath('outfit.created_at');
        $response->assertJsonMissingPath('outfit.updated_at');
    }

    public function test_post_outfit_duplicate_returns_payload_for_invalid_outfit(): void
    {
        $user = User::factory()->create();
        $activeItem = $this->createItem($user, ['name' => '使用可能']);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'invalid',
            'name' => '無効コーデ',
            'memo' => null,
            'seasons' => ['冬'],
            'tpos' => ['休日'],
        ]);
        $outfit->outfitItems()->create([
            'item_id' => $activeItem->id,
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/outfits/{$outfit->id}/duplicate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'duplicated_payload_ready')
            ->assertJsonPath('outfit.name', '無効コーデ（コピー）')
            ->assertJsonPath('outfit.items.0.item_id', $activeItem->id)
            ->assertJsonPath('outfit.items.0.selectable', true)
            ->assertJsonPath('outfit.items.0.note', null);
    }

    public function test_post_outfit_duplicate_marks_disposed_items_as_not_selectable_for_invalid_outfit(): void
    {
        $user = User::factory()->create();
        $activeItem = $this->createItem($user, ['name' => '使用可能']);
        $disposedItem = $this->createItem($user, [
            'name' => '手放し済み',
            'status' => 'disposed',
        ]);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'invalid',
            'name' => '差し替え前コーデ',
            'memo' => 'memo',
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);
        $outfit->outfitItems()->createMany([
            ['item_id' => $activeItem->id, 'sort_order' => 1],
            ['item_id' => $disposedItem->id, 'sort_order' => 2],
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/outfits/{$outfit->id}/duplicate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'duplicated_payload_ready')
            ->assertJsonPath('outfit.items.0.item_id', $activeItem->id)
            ->assertJsonPath('outfit.items.0.selectable', true)
            ->assertJsonPath('outfit.items.0.note', null)
            ->assertJsonPath('outfit.items.1.item_id', $disposedItem->id)
            ->assertJsonPath('outfit.items.1.sort_order', 2)
            ->assertJsonPath('outfit.items.1.selectable', false)
            ->assertJsonPath('outfit.items.1.note', '手放したアイテムのため初期選択から除外');
    }

    public function test_post_outfit_duplicate_returns_404_for_other_users_outfit(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $item = $this->createItem($otherUser);

        $outfit = Outfit::query()->create([
            'user_id' => $otherUser->id,
            'status' => 'active',
            'name' => '他人のコーデ',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['休日'],
        ]);
        $outfit->outfitItems()->create([
            'item_id' => $item->id,
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->postJson("/api/outfits/{$outfit->id}/duplicate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(404);
    }

    public function test_post_outfits_creates_outfit_and_outfit_items(): void
    {
        $user = User::factory()->create();
        $itemA = $this->createItem($user, ['name' => 'トップス']);
        $itemB = $this->createItem($user, ['name' => 'ボトムス', 'category' => 'bottoms', 'shape' => 'wide']);
        $holidayTpo = $this->createUserTpo($user, [
            'name' => '休日',
            'sort_order' => 2,
            'is_preset' => true,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/outfits', [
            'name' => '休日コーデ',
            'memo' => 'テストメモ',
            'seasons' => ['春', '秋'],
            'tpo_ids' => [$holidayTpo->id],
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
            ->assertJsonPath('outfit.tpo_ids.0', $holidayTpo->id)
            ->assertJsonPath('outfit.tpos.0', '休日')
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
        $inactiveTpo = $this->createUserTpo($user, [
            'name' => '在宅',
            'sort_order' => 4,
            'is_active' => false,
            'is_preset' => false,
        ]);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'name' => '更新前',
            'memo' => 'old memo',
            'seasons' => ['春'],
            'tpos' => [],
            'tpo_ids' => [$inactiveTpo->id],
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
            'tpo_ids' => [$inactiveTpo->id],
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
            ->assertJsonPath('outfit.tpo_ids.0', $inactiveTpo->id)
            ->assertJsonPath('outfit.tpos.0', '在宅')
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
