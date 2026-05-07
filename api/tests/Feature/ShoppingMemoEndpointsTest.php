<?php

namespace Tests\Feature;

use App\Models\CategoryGroup;
use App\Models\CategoryMaster;
use App\Models\PurchaseCandidate;
use App\Models\ShoppingMemo;
use App\Models\ShoppingMemoItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShoppingMemoEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function issueCsrfToken(): string
    {
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        return session()->token();
    }

    private function createCategory(string $id): void
    {
        CategoryGroup::query()->updateOrCreate(
            ['id' => 'tops'],
            [
                'name' => 'トップス',
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        CategoryMaster::query()->updateOrCreate(
            ['id' => $id],
            [
                'group_id' => 'tops',
                'name' => 'トップス',
                'sort_order' => 1,
                'is_active' => true,
            ],
        );
    }

    private function createCandidate(User $user, array $overrides = []): PurchaseCandidate
    {
        $categoryId = $overrides['category_id'] ?? 'tops_cutsew';
        $this->createCategory($categoryId);

        return PurchaseCandidate::query()->create(array_merge([
            'user_id' => $user->id,
            'status' => 'considering',
            'priority' => 'medium',
            'name' => '候補アイテム',
            'category_id' => $categoryId,
            'brand_name' => 'Sample Brand',
            'price' => 7800,
            'sale_price' => 6800,
            'sale_ends_at' => '2026-05-10 10:00:00',
            'discount_ends_at' => '2026-05-09 10:00:00',
            'purchase_url' => 'https://www.example.com/items/1',
        ], $overrides));
    }

    private function createShoppingMemo(User $user, array $overrides = []): ShoppingMemo
    {
        return ShoppingMemo::query()->create(array_merge([
            'user_id' => $user->id,
            'name' => '春夏セール候補',
            'memo' => '今月検討する候補',
            'status' => 'draft',
        ], $overrides));
    }

    public function test_user_can_create_list_show_update_and_delete_shopping_memo(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $token = $this->issueCsrfToken();

        $createdResponse = $this
            ->actingAs($user, 'web')
            ->withHeader('X-CSRF-TOKEN', $token)
            ->postJson('/api/shopping-memos', [
                'name' => '旅行前候補',
                'memo' => '優先度高め',
            ]);

        $createdResponse
            ->assertCreated()
            ->assertJsonPath('message', 'created')
            ->assertJsonPath('shoppingMemo.name', '旅行前候補')
            ->assertJsonPath('shoppingMemo.status', 'draft');

        $memoId = (int) $createdResponse->json('shoppingMemo.id');

        $otherMemo = $this->createShoppingMemo($otherUser, [
            'name' => '他ユーザーのメモ',
        ]);

        $listResponse = $this
            ->actingAs($user, 'web')
            ->getJson('/api/shopping-memos');

        $listResponse
            ->assertOk()
            ->assertJsonCount(1, 'shoppingMemos')
            ->assertJsonPath('shoppingMemos.0.id', $memoId)
            ->assertJsonPath('shoppingMemos.0.name', '旅行前候補');

        $showResponse = $this
            ->actingAs($user, 'web')
            ->getJson(sprintf('/api/shopping-memos/%d', $memoId));

        $showResponse
            ->assertOk()
            ->assertJsonPath('shoppingMemo.id', $memoId)
            ->assertJsonPath('shoppingMemo.name', '旅行前候補')
            ->assertJsonPath('shoppingMemo.group_count', 0);

        $this
            ->actingAs($user, 'web')
            ->withHeader('X-CSRF-TOKEN', $token)
            ->patchJson(sprintf('/api/shopping-memos/%d', $memoId), [
                'name' => '旅行前セール候補',
                'status' => 'closed',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('shoppingMemo.name', '旅行前セール候補')
            ->assertJsonPath('shoppingMemo.status', 'closed');

        $this->assertDatabaseHas('shopping_memos', [
            'id' => $memoId,
            'name' => '旅行前セール候補',
            'status' => 'closed',
        ]);

        $this->actingAs($user, 'web')
            ->getJson(sprintf('/api/shopping-memos/%d', $otherMemo->id))
            ->assertNotFound();

        $this->actingAs($user, 'web')
            ->withHeader('X-CSRF-TOKEN', $token)
            ->patchJson(sprintf('/api/shopping-memos/%d', $otherMemo->id), [
                'name' => '変更不可',
            ])
            ->assertNotFound();

        $this->actingAs($user, 'web')
            ->withHeader('X-CSRF-TOKEN', $token)
            ->deleteJson(sprintf('/api/shopping-memos/%d', $otherMemo->id))
            ->assertNotFound();

        $this->actingAs($user, 'web')
            ->withHeader('X-CSRF-TOKEN', $token)
            ->deleteJson(sprintf('/api/shopping-memos/%d', $memoId))
            ->assertOk()
            ->assertJsonPath('message', 'deleted');

        $this->assertDatabaseMissing('shopping_memos', [
            'id' => $memoId,
        ]);
    }

    public function test_user_can_add_candidates_with_partial_success_counts(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $memo = $this->createShoppingMemo($user);
        $token = $this->issueCsrfToken();

        $existingCandidate = $this->createCandidate($user, [
            'name' => '追加済み候補',
        ]);
        ShoppingMemoItem::query()->create([
            'shopping_memo_id' => $memo->id,
            'purchase_candidate_id' => $existingCandidate->id,
            'quantity' => 1,
            'sort_order' => 1,
        ]);

        $addableCandidate = $this->createCandidate($user, [
            'name' => '追加対象',
            'status' => 'on_hold',
            'purchase_url' => 'https://zozo.jp/item/2',
        ]);
        $purchasedCandidate = $this->createCandidate($user, [
            'name' => '購入済み候補',
            'status' => 'purchased',
        ]);
        $droppedCandidate = $this->createCandidate($user, [
            'name' => '見送り候補',
            'status' => 'dropped',
        ]);
        $otherUserCandidate = $this->createCandidate($otherUser, [
            'name' => '他ユーザー候補',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->withHeader('X-CSRF-TOKEN', $token)
            ->postJson(sprintf('/api/shopping-memos/%d/items', $memo->id), [
                'purchase_candidate_ids' => [
                    $existingCandidate->id,
                    $addableCandidate->id,
                    $purchasedCandidate->id,
                    $droppedCandidate->id,
                    $otherUserCandidate->id,
                    999999,
                ],
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('added_count', 1)
            ->assertJsonPath('duplicate_count', 1)
            ->assertJsonPath('invalid_status_count', 2)
            ->assertJsonPath('skipped_count', 5);

        $this->assertDatabaseHas('shopping_memo_items', [
            'shopping_memo_id' => $memo->id,
            'purchase_candidate_id' => $addableCandidate->id,
        ]);
        $this->assertDatabaseMissing('shopping_memo_items', [
            'shopping_memo_id' => $memo->id,
            'purchase_candidate_id' => $purchasedCandidate->id,
        ]);
        $this->assertDatabaseMissing('shopping_memo_items', [
            'shopping_memo_id' => $memo->id,
            'purchase_candidate_id' => $otherUserCandidate->id,
        ]);
    }

    public function test_closed_shopping_memo_rejects_item_addition(): void
    {
        $user = User::factory()->create();
        $memo = $this->createShoppingMemo($user, [
            'status' => 'closed',
        ]);
        $candidate = $this->createCandidate($user);
        $token = $this->issueCsrfToken();

        $this
            ->actingAs($user, 'web')
            ->withHeader('X-CSRF-TOKEN', $token)
            ->postJson(sprintf('/api/shopping-memos/%d/items', $memo->id), [
                'purchase_candidate_ids' => [$candidate->id],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['shopping_memo']);
    }

    public function test_user_can_remove_owned_shopping_memo_item_only(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $token = $this->issueCsrfToken();

        $ownedMemo = $this->createShoppingMemo($user);
        $ownedCandidate = $this->createCandidate($user);
        $ownedItem = ShoppingMemoItem::query()->create([
            'shopping_memo_id' => $ownedMemo->id,
            'purchase_candidate_id' => $ownedCandidate->id,
            'quantity' => 1,
            'sort_order' => 1,
        ]);

        $otherMemo = $this->createShoppingMemo($otherUser);
        $otherCandidate = $this->createCandidate($otherUser);
        $otherItem = ShoppingMemoItem::query()->create([
            'shopping_memo_id' => $otherMemo->id,
            'purchase_candidate_id' => $otherCandidate->id,
            'quantity' => 1,
            'sort_order' => 1,
        ]);

        $this->actingAs($user, 'web')
            ->withHeader('X-CSRF-TOKEN', $token)
            ->deleteJson(sprintf('/api/shopping-memos/%d/items/%d', $ownedMemo->id, $ownedItem->id))
            ->assertOk()
            ->assertJsonPath('message', 'deleted');

        $this->assertDatabaseMissing('shopping_memo_items', [
            'id' => $ownedItem->id,
        ]);

        $this->actingAs($user, 'web')
            ->withHeader('X-CSRF-TOKEN', $token)
            ->deleteJson(sprintf('/api/shopping-memos/%d/items/%d', $otherMemo->id, $otherItem->id))
            ->assertNotFound();
    }

    public function test_detail_response_groups_items_and_calculates_subtotals(): void
    {
        $user = User::factory()->create();
        $memo = $this->createShoppingMemo($user, [
            'name' => '比較用メモ',
        ]);

        $domainCandidate = $this->createCandidate($user, [
            'name' => 'ドメイン候補',
            'brand_name' => 'Domain Brand',
            'price' => 12000,
            'sale_price' => 9800,
            'sale_ends_at' => '2026-05-10 10:00:00',
            'discount_ends_at' => '2026-05-08 10:00:00',
            'purchase_url' => 'https://www.uniqlo.com/jp/ja/products/1',
            'status' => 'considering',
        ]);
        $brandCandidate = $this->createCandidate($user, [
            'name' => 'ブランド候補',
            'brand_name' => 'Sample Brand',
            'price' => 5000,
            'sale_price' => null,
            'sale_ends_at' => '2026-05-09 10:00:00',
            'discount_ends_at' => null,
            'purchase_url' => null,
            'status' => 'on_hold',
        ]);
        $uncategorizedCandidate = $this->createCandidate($user, [
            'name' => '価格未設定候補',
            'brand_name' => null,
            'price' => null,
            'sale_price' => null,
            'sale_ends_at' => null,
            'discount_ends_at' => null,
            'purchase_url' => 'not a valid url',
            'status' => 'considering',
        ]);
        $purchasedCandidate = $this->createCandidate($user, [
            'name' => '購入済み候補',
            'brand_name' => 'Archive Brand',
            'price' => 15000,
            'sale_price' => 11000,
            'sale_ends_at' => '2026-05-07 10:00:00',
            'discount_ends_at' => null,
            'purchase_url' => 'https://store.example.com/items/3',
            'status' => 'purchased',
        ]);

        foreach ([
            [$domainCandidate, 1],
            [$brandCandidate, 2],
            [$uncategorizedCandidate, 3],
            [$purchasedCandidate, 4],
        ] as [$candidate, $sortOrder]) {
            ShoppingMemoItem::query()->create([
                'shopping_memo_id' => $memo->id,
                'purchase_candidate_id' => $candidate->id,
                'quantity' => 1,
                'sort_order' => $sortOrder,
            ]);
        }

        $response = $this
            ->actingAs($user, 'web')
            ->getJson(sprintf('/api/shopping-memos/%d', $memo->id));

        $response
            ->assertOk()
            ->assertJsonPath('shoppingMemo.name', '比較用メモ')
            ->assertJsonPath('shoppingMemo.group_count', 4)
            ->assertJsonPath('shoppingMemo.subtotal', 14800)
            ->assertJsonPath('shoppingMemo.has_price_unset', true)
            ->assertJsonPath('shoppingMemo.nearest_deadline', '2026-05-08T10:00:00+00:00')
            ->assertJsonPath('shoppingMemo.groups.0.type', 'domain')
            ->assertJsonPath('shoppingMemo.groups.0.display_name', 'store.example.com')
            ->assertJsonPath('shoppingMemo.groups.0.items.0.status', 'purchased')
            ->assertJsonPath('shoppingMemo.groups.0.items.0.is_total_included', false)
            ->assertJsonPath('shoppingMemo.groups.0.subtotal', 0)
            ->assertJsonPath('shoppingMemo.groups.1.type', 'domain')
            ->assertJsonPath('shoppingMemo.groups.1.display_name', 'uniqlo.com')
            ->assertJsonPath('shoppingMemo.groups.1.subtotal', 9800)
            ->assertJsonPath('shoppingMemo.groups.1.items.0.unit_price', 9800)
            ->assertJsonPath('shoppingMemo.groups.1.items.0.line_total', 9800)
            ->assertJsonPath('shoppingMemo.groups.2.type', 'brand')
            ->assertJsonPath('shoppingMemo.groups.2.display_name', 'Sample Brand')
            ->assertJsonPath('shoppingMemo.groups.2.subtotal', 5000)
            ->assertJsonPath('shoppingMemo.groups.3.type', 'uncategorized')
            ->assertJsonPath('shoppingMemo.groups.3.display_name', '未分類')
            ->assertJsonPath('shoppingMemo.groups.3.has_price_unset', true)
            ->assertJsonPath('shoppingMemo.groups.3.items.0.line_total', null);

        $listResponse = $this
            ->actingAs($user, 'web')
            ->getJson('/api/shopping-memos');

        $listResponse
            ->assertOk()
            ->assertJsonPath('shoppingMemos.0.id', $memo->id)
            ->assertJsonPath('shoppingMemos.0.item_count', 4)
            ->assertJsonPath('shoppingMemos.0.group_count', 4)
            ->assertJsonPath('shoppingMemos.0.subtotal', 14800)
            ->assertJsonPath('shoppingMemos.0.has_price_unset', true)
            ->assertJsonPath('shoppingMemos.0.nearest_deadline', '2026-05-08T10:00:00+00:00');
    }
}
