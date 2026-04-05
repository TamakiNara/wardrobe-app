<?php

namespace Tests\Feature;

use App\Models\CategoryGroup;
use App\Models\CategoryMaster;
use App\Models\Item;
use App\Models\Outfit;
use App\Models\PurchaseCandidate;
use App\Models\User;
use App\Models\WearLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomeSummaryEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function createCategory(string $id = 'tops_tshirt_cutsew', string $groupId = 'tops', string $name = 'Tシャツ・カットソー'): void
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
                'hex' => '#ffffff',
                'label' => 'ホワイト',
            ]],
            'spec' => null,
        ], $overrides));
    }

    public function test_get_home_summary_returns_401_when_unauthenticated(): void
    {
        $response = $this->getJson('/api/home/summary', [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(401);
    }

    public function test_get_home_summary_returns_lightweight_counts_matching_current_home_bases(): void
    {
        $user = User::factory()->create([
            'visible_category_ids' => ['tops_tshirt_cutsew'],
        ]);
        $otherUser = User::factory()->create();
        $this->createCategory('tops_tshirt_cutsew', 'tops', 'Tシャツ・カットソー');

        $this->createItem($user, ['category' => 'tops', 'shape' => 'tshirt']);
        $this->createItem($user, ['category' => 'bottoms', 'shape' => 'wide']);
        $this->createItem($user, ['status' => 'disposed']);
        $this->createItem($otherUser);

        Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '通常コーデ',
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

        WearLog::query()->create([
            'user_id' => $user->id,
            'status' => 'planned',
            'event_date' => '2026-03-30',
            'display_order' => 1,
        ]);
        WearLog::query()->create([
            'user_id' => $user->id,
            'status' => 'worn',
            'event_date' => '2026-03-29',
            'display_order' => 1,
        ]);
        WearLog::query()->create([
            'user_id' => $otherUser->id,
            'status' => 'planned',
            'event_date' => '2026-03-28',
            'display_order' => 1,
        ]);

        PurchaseCandidate::query()->create([
            'user_id' => $user->id,
            'name' => '候補A',
            'status' => 'considering',
            'priority' => 'medium',
            'category_id' => 'tops_tshirt_cutsew',
        ]);
        PurchaseCandidate::query()->create([
            'user_id' => $user->id,
            'name' => '候補B',
            'status' => 'purchased',
            'priority' => 'medium',
            'category_id' => 'tops_tshirt_cutsew',
        ]);
        PurchaseCandidate::query()->create([
            'user_id' => $otherUser->id,
            'name' => '他人の候補',
            'status' => 'considering',
            'priority' => 'medium',
            'category_id' => 'tops_tshirt_cutsew',
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/home/summary', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('summary.itemsCount', 1)
            ->assertJsonPath('summary.outfitsCount', 1)
            ->assertJsonPath('summary.wearLogsCount', 2)
            ->assertJsonPath('summary.purchaseCandidatesCount', 2);
    }
}
