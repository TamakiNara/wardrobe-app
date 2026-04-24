<?php

namespace Tests\Feature;

use App\Models\CategoryGroup;
use App\Models\CategoryMaster;
use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use App\Models\WearLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImportExportWearLogsTest extends TestCase
{
    use RefreshDatabase;

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

    /**
     * @return array{item: Item, outfit: Outfit, wearLog: WearLog}
     */
    private function seedWearLogSourceData(User $user): array
    {
        $item = Item::query()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'name' => '着用履歴テスト用アイテム',
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
            'spec' => [
                'tops' => [
                    'sleeve' => 'long',
                ],
            ],
        ]);

        $outfit = Outfit::query()->create([
            'user_id' => $user->id,
            'status' => 'invalid',
            'name' => '着用履歴テスト用コーディネート',
            'seasons' => [],
            'tpos' => [],
        ]);
        $outfit->outfitItems()->create([
            'item_id' => $item->id,
            'sort_order' => 1,
        ]);

        $wearLog = WearLog::query()->create([
            'user_id' => $user->id,
            'status' => 'worn',
            'event_date' => '2026-04-25',
            'display_order' => 1,
            'source_outfit_id' => $outfit->id,
            'memo' => '着用履歴のメモ',
        ]);
        $wearLog->wearLogItems()->create([
            'source_item_id' => $item->id,
            'item_source_type' => 'outfit',
            'sort_order' => 1,
        ]);

        return [
            'item' => $item,
            'outfit' => $outfit,
            'wearLog' => $wearLog,
        ];
    }

    public function test_export_includes_only_current_users_wear_logs(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedWearLogSourceData($user);
        $this->seedWearLogSourceData($otherUser);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'wear_logs')
            ->assertJsonPath('wear_logs.0.status', 'worn')
            ->assertJsonPath('wear_logs.0.items.0.item_source_type', 'outfit');
    }

    public function test_import_restores_wear_logs_and_remaps_item_and_outfit_ids(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $source = $this->seedWearLogSourceData($user);

        $this->actingAs($user, 'web');

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $staleWearLog = WearLog::query()->create([
            'user_id' => $user->id,
            'status' => 'planned',
            'event_date' => '2026-04-26',
            'display_order' => 1,
            'memo' => '古い着用履歴',
        ]);

        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('counts.wear_logs.total', 1);

        $this->assertDatabaseMissing('wear_logs', [
            'id' => $staleWearLog->id,
        ]);

        $importedItem = Item::query()
            ->where('user_id', $user->id)
            ->where('name', '着用履歴テスト用アイテム')
            ->firstOrFail();
        $importedOutfit = Outfit::query()
            ->where('user_id', $user->id)
            ->where('name', '着用履歴テスト用コーディネート')
            ->firstOrFail();
        $importedWearLog = WearLog::query()
            ->where('user_id', $user->id)
            ->where('memo', '着用履歴のメモ')
            ->with('wearLogItems')
            ->firstOrFail();

        $this->assertNotSame($source['item']->id, $importedItem->id);
        $this->assertNotSame($source['outfit']->id, $importedOutfit->id);
        $this->assertNotSame($source['wearLog']->id, $importedWearLog->id);

        $this->assertSame($importedOutfit->id, $importedWearLog->source_outfit_id);
        $this->assertSame($importedItem->id, $importedWearLog->wearLogItems->firstOrFail()->source_item_id);
    }

    public function test_import_failure_keeps_existing_data_when_wear_log_reference_cannot_be_mapped(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $current = $this->seedWearLogSourceData($user);

        $this->actingAs($user, 'web');

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        $exportPayload['wear_logs'][0]['source_outfit_id'] = 999999;

        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422);

        $this->assertDatabaseHas('wear_logs', [
            'id' => $current['wearLog']->id,
            'user_id' => $user->id,
            'memo' => '着用履歴のメモ',
        ]);
        $this->assertDatabaseHas('wear_log_items', [
            'wear_log_id' => $current['wearLog']->id,
            'source_item_id' => $current['item']->id,
            'sort_order' => 1,
        ]);
    }

    public function test_import_restores_wear_logs_with_nullable_item_reference(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $source = $this->seedWearLogSourceData($user);

        $source['wearLog']->wearLogItems()->update([
            'source_item_id' => null,
        ]);

        $this->actingAs($user, 'web');

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        WearLog::query()->where('user_id', $user->id)->delete();
        Outfit::query()->where('user_id', $user->id)->delete();
        Item::query()->where('user_id', $user->id)->delete();

        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('counts.wear_logs.total', 1);

        $importedWearLog = WearLog::query()
            ->where('user_id', $user->id)
            ->with('wearLogItems')
            ->firstOrFail();

        $importedWearLogItem = $importedWearLog->wearLogItems->firstOrFail();

        $this->assertNull($importedWearLogItem->source_item_id);
        $this->assertSame('outfit', $importedWearLogItem->item_source_type);
        $this->assertSame(1, $importedWearLogItem->sort_order);
        $this->assertNotNull($importedWearLog->source_outfit_id);
    }

    public function test_import_restores_wear_logs_when_source_item_id_key_is_missing(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');
        $this->seedWearLogSourceData($user);

        $this->actingAs($user, 'web');

        $exportPayload = $this->getJson('/api/export', [
            'Accept' => 'application/json',
        ])->assertOk()->json();

        unset($exportPayload['wear_logs'][0]['items'][0]['source_item_id']);

        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/import', $exportPayload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('counts.wear_logs.total', 1);

        $importedWearLog = WearLog::query()
            ->where('user_id', $user->id)
            ->with('wearLogItems')
            ->firstOrFail();

        $this->assertNull($importedWearLog->wearLogItems->firstOrFail()->source_item_id);
    }
}
