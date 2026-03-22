<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItemsEndpointsTest extends TestCase
{
    use RefreshDatabase;

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
}
