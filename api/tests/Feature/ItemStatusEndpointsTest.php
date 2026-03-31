<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItemStatusEndpointsTest extends TestCase
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
            'seasons' => ['夏'],
            'tpos' => ['休日'],
            'spec' => null,
        ], $overrides));
    }

    private function createOutfit(User $user, Item $item, array $overrides = []): Outfit
    {
        $outfit = Outfit::query()->create(array_merge([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => 'テストコーデ',
            'memo' => null,
            'seasons' => ['夏'],
            'tpos' => ['休日'],
        ], $overrides));

        $outfit->outfitItems()->create([
            'item_id' => $item->id,
            'sort_order' => 1,
        ]);

        return $outfit;
    }

    public function test_dispose_marks_item_disposed_and_invalidates_related_outfit(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user);
        $outfit = $this->createOutfit($user, $item);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/items/{$item->id}/dispose", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'disposed')
            ->assertJsonPath('item.status', 'disposed');

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'status' => 'disposed',
        ]);

        $this->assertDatabaseHas('outfits', [
            'id' => $outfit->id,
            'status' => 'invalid',
        ]);
    }

    public function test_dispose_does_not_affect_unrelated_outfits(): void
    {
        $user = User::factory()->create();
        $targetItem = $this->createItem($user, ['name' => '対象アイテム']);
        $otherItem = $this->createItem($user, [
            'name' => '別アイテム',
            'category' => 'bottoms',
            'shape' => 'wide',
        ]);

        $affectedOutfit = $this->createOutfit($user, $targetItem, [
            'name' => '影響ありコーデ',
            'status' => 'active',
        ]);
        $unaffectedOutfit = $this->createOutfit($user, $otherItem, [
            'name' => '影響なしコーデ',
            'status' => 'active',
        ]);
        $alreadyInvalidOutfit = $this->createOutfit($user, $targetItem, [
            'name' => '既存invalidコーデ',
            'status' => 'invalid',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->postJson("/api/items/{$targetItem->id}/dispose", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk();

        $this->assertDatabaseHas('outfits', [
            'id' => $affectedOutfit->id,
            'status' => 'invalid',
        ]);
        $this->assertDatabaseHas('outfits', [
            'id' => $unaffectedOutfit->id,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('outfits', [
            'id' => $alreadyInvalidOutfit->id,
            'status' => 'invalid',
        ]);
    }

    public function test_reactivate_marks_item_active_without_restoring_outfit(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'status' => 'disposed',
        ]);
        $outfit = $this->createOutfit($user, $item, [
            'status' => 'invalid',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/items/{$item->id}/reactivate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'reactivated')
            ->assertJsonPath('item.status', 'active');

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('outfits', [
            'id' => $outfit->id,
            'status' => 'invalid',
        ]);
    }

    public function test_reactivate_removes_item_from_disposed_list(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'status' => 'disposed',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->getJson('/api/items/disposed', [
            'Accept' => 'application/json',
        ])->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.id', $item->id);

        $this->postJson("/api/items/{$item->id}/reactivate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk();

        $this->getJson('/api/items/disposed', [
            'Accept' => 'application/json',
        ])->assertOk()
            ->assertJsonCount(0, 'items')
            ->assertJsonPath('meta.total', 0)
            ->assertJsonPath('meta.totalAll', 0);
    }

    public function test_item_status_routes_return_404_for_other_users_item(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $otherUsersItem = $this->createItem($otherUser);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->postJson("/api/items/{$otherUsersItem->id}/dispose", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(404);

        $this->postJson("/api/items/{$otherUsersItem->id}/reactivate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(404);
    }

    public function test_dispose_returns_422_when_item_is_already_disposed(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'status' => 'disposed',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->postJson("/api/items/{$item->id}/dispose", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(422);
    }

    public function test_reactivate_returns_422_when_item_is_already_active(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'status' => 'active',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->postJson("/api/items/{$item->id}/reactivate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(422);
    }
}
