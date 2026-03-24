<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use App\Models\WearLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WearLogEndpointsTest extends TestCase
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
            'seasons' => ['春'],
            'tpos' => ['休日'],
            'spec' => null,
        ], $overrides));
    }

    private function createOutfit(User $user, array $overrides = []): Outfit
    {
        return Outfit::query()->create(array_merge([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '通勤コーディネート',
            'memo' => null,
            'seasons' => ['春'],
            'tpos' => ['仕事'],
        ], $overrides));
    }

    private function createWearLog(User $user, array $overrides = []): WearLog
    {
        return WearLog::query()->create(array_merge([
            'user_id' => $user->id,
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'memo' => null,
        ], $overrides));
    }

    public function test_get_wear_logs_returns_only_current_users_logs_sorted_by_event_date_and_display_order(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $later = $this->createWearLog($user, [
            'status' => 'worn',
            'event_date' => '2026-03-25',
            'display_order' => 2,
        ]);
        $earlierSameDay = $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-03-25',
            'display_order' => 1,
        ]);
        $older = $this->createWearLog($user, [
            'status' => 'planned',
            'event_date' => '2026-03-20',
            'display_order' => 1,
        ]);
        $this->createWearLog($otherUser, [
            'event_date' => '2026-03-26',
            'display_order' => 1,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/wear-logs', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(3, 'wearLogs')
            ->assertJsonPath('wearLogs.0.id', $earlierSameDay->id)
            ->assertJsonPath('wearLogs.1.id', $later->id)
            ->assertJsonPath('wearLogs.2.id', $older->id)
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.totalAll', 3);
    }

    public function test_post_wear_log_can_create_with_outfit_only(): void
    {
        $user = User::factory()->create();
        $outfit = $this->createOutfit($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'memo' => 'outfit only',
            'items' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'created')
            ->assertJsonPath('wearLog.source_outfit_id', $outfit->id)
            ->assertJsonCount(0, 'wearLog.items');

        $this->assertDatabaseHas('wear_logs', [
            'user_id' => $user->id,
            'source_outfit_id' => $outfit->id,
            'display_order' => 1,
        ]);
    }

    public function test_post_wear_log_can_create_with_items_only(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'worn',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'memo' => 'item only',
            'items' => [
                [
                    'source_item_id' => $item->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('wearLog.items.0.source_item_id', $item->id)
            ->assertJsonPath('wearLog.items.0.item_source_type', 'manual');
    }

    public function test_post_wear_log_can_create_with_outfit_and_items(): void
    {
        $user = User::factory()->create();
        $outfit = $this->createOutfit($user);
        $item = $this->createItem($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'memo' => 'both',
            'items' => [
                [
                    'source_item_id' => $item->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('wearLog.source_outfit_id', $outfit->id)
            ->assertJsonPath('wearLog.items.0.source_item_id', $item->id);
    }

    public function test_post_wear_log_returns_422_when_outfit_and_items_are_both_missing(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'memo' => null,
            'items' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.source_outfit_id.0', 'コーディネートまたはアイテムを1件以上指定してください。');
    }

    public function test_post_wear_log_returns_422_when_disposed_item_is_specified(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'status' => 'disposed',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'items' => [
                [
                    'source_item_id' => $item->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.items.0', '手放したアイテムは選択できません。');
    }

    public function test_post_wear_log_returns_422_when_invalid_outfit_is_specified(): void
    {
        $user = User::factory()->create();
        $outfit = $this->createOutfit($user, [
            'status' => 'invalid',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/wear-logs', [
            'status' => 'planned',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'items' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.source_outfit_id.0', '使用できないコーディネートは選択できません。');
    }

    public function test_put_wear_log_updates_record(): void
    {
        $user = User::factory()->create();
        $item = $this->createItem($user, [
            'name' => '更新後アイテム',
        ]);
        $wearLog = $this->createWearLog($user);

        $wearLog->wearLogItems()->create([
            'source_item_id' => $item->id,
            'sort_order' => 1,
            'item_source_type' => 'manual',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/wear-logs/{$wearLog->id}", [
            'status' => 'worn',
            'event_date' => '2026-03-26',
            'display_order' => 2,
            'source_outfit_id' => null,
            'memo' => 'updated',
            'items' => [
                [
                    'source_item_id' => $item->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('wearLog.status', 'worn')
            ->assertJsonPath('wearLog.event_date', '2026-03-26')
            ->assertJsonPath('wearLog.display_order', 2);
    }

    public function test_put_wear_log_returns_404_for_other_users_record(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $wearLog = $this->createWearLog($otherUser);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/wear-logs/{$wearLog->id}", [
            'status' => 'worn',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => null,
            'items' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(404);
    }

    public function test_put_wear_log_can_keep_current_invalid_outfit_and_disposed_item_when_editing_existing_record(): void
    {
        $user = User::factory()->create();
        $disposedItem = $this->createItem($user, [
            'name' => '手放し済み',
            'status' => 'disposed',
        ]);
        $invalidOutfit = $this->createOutfit($user, [
            'status' => 'invalid',
            'name' => '現在は無効',
        ]);

        $wearLog = $this->createWearLog($user, [
            'source_outfit_id' => $invalidOutfit->id,
        ]);
        $wearLog->wearLogItems()->create([
            'source_item_id' => $disposedItem->id,
            'sort_order' => 1,
            'item_source_type' => 'manual',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/wear-logs/{$wearLog->id}", [
            'status' => 'worn',
            'event_date' => '2026-03-24',
            'display_order' => 1,
            'source_outfit_id' => $invalidOutfit->id,
            'memo' => 'current invalid data is preserved',
            'items' => [
                [
                    'source_item_id' => $disposedItem->id,
                    'sort_order' => 1,
                    'item_source_type' => 'manual',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('wearLog.source_outfit_id', $invalidOutfit->id)
            ->assertJsonPath('wearLog.source_outfit_status', 'invalid')
            ->assertJsonPath('wearLog.items.0.source_item_id', $disposedItem->id)
            ->assertJsonPath('wearLog.items.0.source_item_status', 'disposed');
    }
}
