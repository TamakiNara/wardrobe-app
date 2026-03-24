<?php

namespace Tests\Feature;

use App\Models\CategoryMaster;
use App\Models\CategoryGroup;
use App\Models\PurchaseCandidate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PurchaseCandidateEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function issueCsrfToken(): string
    {
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);
        return session()->token();
    }

    private function createCategory(string $id = 'outer_coat', string $groupId = 'outer', string $name = 'コート'): void
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

    private function createCandidate(User $user, array $overrides = []): PurchaseCandidate
    {
        $categoryId = $overrides['category_id'] ?? 'outer_coat';
        $this->createCategory($categoryId);

        $candidate = PurchaseCandidate::query()->create(array_merge([
            'user_id' => $user->id,
            'status' => 'considering',
            'priority' => 'medium',
            'name' => 'ネイビーのレインコート',
            'category_id' => $categoryId,
            'brand_name' => 'Sample Brand',
            'price' => 14800,
            'purchase_url' => 'https://example.test/products/1',
            'memo' => 'メモ',
            'wanted_reason' => '欲しい理由',
            'size_gender' => 'women',
            'size_label' => 'M',
            'size_note' => '厚手インナー込み',
            'is_rain_ok' => true,
        ], $overrides));

        $candidate->colors()->create([
            'role' => 'main',
            'mode' => 'preset',
            'value' => 'navy',
            'hex' => '#1F3A5F',
            'label' => 'ネイビー',
            'sort_order' => 1,
        ]);
        $candidate->seasons()->create([
            'season' => '春',
            'sort_order' => 1,
        ]);
        $candidate->tpos()->create([
            'tpo' => '休日',
            'sort_order' => 1,
        ]);

        return $candidate->fresh(['category', 'colors', 'seasons', 'tpos', 'images']);
    }

    private function createFakePng(string $filename): UploadedFile
    {
        $tmpPath = tempnam(sys_get_temp_dir(), 'pc-img-');
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

    public function test_get_purchase_candidates_returns_only_current_users_candidates(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $candidate = $this->createCandidate($user, ['name' => '自分の候補']);
        $this->createCandidate($otherUser, ['name' => '他人の候補']);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/purchase-candidates', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'purchaseCandidates')
            ->assertJsonPath('purchaseCandidates.0.id', $candidate->id)
            ->assertJsonPath('purchaseCandidates.0.name', '自分の候補')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.totalAll', 1);
    }

    public function test_get_purchase_candidate_returns_detail(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user);

        $this->actingAs($user, 'web');

        $response = $this->getJson("/api/purchase-candidates/{$candidate->id}", [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('purchaseCandidate.id', $candidate->id)
            ->assertJsonPath('purchaseCandidate.category_id', 'outer_coat')
            ->assertJsonPath('purchaseCandidate.colors.0.value', 'navy')
            ->assertJsonPath('purchaseCandidate.seasons.0', '春')
            ->assertJsonPath('purchaseCandidate.tpos.0', '休日');
    }

    public function test_post_purchase_candidate_creates_candidate_with_array_fields(): void
    {
        $user = User::factory()->create();
        $this->createCategory('tops_shirt', 'tops', 'シャツ / ブラウス');

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/purchase-candidates', [
            'status' => 'considering',
            'priority' => 'high',
            'name' => '白シャツ候補',
            'category_id' => 'tops_shirt',
            'brand_name' => 'Brand',
            'price' => 9800,
            'purchase_url' => 'https://example.test/products/2',
            'memo' => '試着したい',
            'wanted_reason' => '仕事用を補充したい',
            'size_gender' => 'women',
            'size_label' => 'S',
            'size_note' => '肩幅確認',
            'is_rain_ok' => false,
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#ffffff',
                'label' => 'ホワイト',
            ]],
            'seasons' => ['春', '秋'],
            'tpos' => ['仕事'],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'created')
            ->assertJsonPath('purchaseCandidate.name', '白シャツ候補')
            ->assertJsonPath('purchaseCandidate.category_id', 'tops_shirt')
            ->assertJsonPath('purchaseCandidate.colors.0.value', 'white')
            ->assertJsonPath('purchaseCandidate.seasons.1', '秋');

        $this->assertDatabaseHas('purchase_candidates', [
            'user_id' => $user->id,
            'name' => '白シャツ候補',
            'category_id' => 'tops_shirt',
        ]);
        $this->assertDatabaseHas('purchase_candidate_colors', [
            'purchase_candidate_id' => $response->json('purchaseCandidate.id'),
            'value' => 'white',
        ]);
        $this->assertDatabaseHas('purchase_candidate_seasons', [
            'purchase_candidate_id' => $response->json('purchaseCandidate.id'),
            'season' => '秋',
        ]);
        $this->assertDatabaseHas('purchase_candidate_tpos', [
            'purchase_candidate_id' => $response->json('purchaseCandidate.id'),
            'tpo' => '仕事',
        ]);
    }

    public function test_put_purchase_candidate_updates_candidate(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, ['category_id' => 'tops_shirt']);
        $this->createCategory('tops_knit', 'tops', 'ニット / セーター');

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/purchase-candidates/{$candidate->id}", [
            'status' => 'on_hold',
            'priority' => 'low',
            'name' => '更新後候補',
            'category_id' => 'tops_knit',
            'brand_name' => null,
            'price' => 12000,
            'purchase_url' => null,
            'memo' => '更新メモ',
            'wanted_reason' => null,
            'size_gender' => 'unisex',
            'size_label' => 'L',
            'size_note' => null,
            'is_rain_ok' => true,
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'gray',
                'hex' => '#cccccc',
                'label' => 'グレー',
            ]],
            'seasons' => ['冬'],
            'tpos' => ['休日'],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('purchaseCandidate.status', 'on_hold')
            ->assertJsonPath('purchaseCandidate.category_id', 'tops_knit')
            ->assertJsonPath('purchaseCandidate.colors.0.value', 'gray');

        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $candidate->id,
            'status' => 'on_hold',
            'category_id' => 'tops_knit',
        ]);
        $this->assertDatabaseMissing('purchase_candidate_colors', [
            'purchase_candidate_id' => $candidate->id,
            'value' => 'navy',
        ]);
    }

    public function test_delete_purchase_candidate_deletes_owned_candidate(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->deleteJson("/api/purchase-candidates/{$candidate->id}", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'deleted');

        $this->assertDatabaseMissing('purchase_candidates', [
            'id' => $candidate->id,
        ]);
    }

    public function test_other_users_purchase_candidate_is_not_accessible(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $candidate = $this->createCandidate($otherUser);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->getJson("/api/purchase-candidates/{$candidate->id}", [
            'Accept' => 'application/json',
        ])->assertStatus(404);

        $this->putJson("/api/purchase-candidates/{$candidate->id}", [
            'name' => '更新不可',
            'category_id' => 'outer_coat',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'navy',
                'hex' => '#1F3A5F',
                'label' => 'ネイビー',
            ]],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(404);

        $this->deleteJson("/api/purchase-candidates/{$candidate->id}", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(404);
    }

    public function test_post_purchase_candidate_item_draft_returns_expected_shape(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, ['category_id' => 'outer_coat']);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/purchase-candidates/{$candidate->id}/item-draft", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'item_draft_ready')
            ->assertJsonPath('item_draft.source_category_id', 'outer_coat')
            ->assertJsonPath('item_draft.category', 'outer')
            ->assertJsonPath('item_draft.shape', 'trench')
            ->assertJsonPath('item_draft.colors.0.value', 'navy')
            ->assertJsonPath('candidate_summary.id', $candidate->id);
    }

    public function test_purchase_candidate_item_draft_can_flow_into_item_create(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, [
            'category_id' => 'outer_coat',
            'name' => 'トレンチ候補',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $draftResponse = $this->postJson("/api/purchase-candidates/{$candidate->id}/item-draft", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $draftResponse->assertOk()
            ->assertJsonPath('item_draft.category', 'outer')
            ->assertJsonPath('item_draft.shape', 'trench');

        $payload = $draftResponse->json('item_draft');
        $payload['images'] = [];

        $createResponse = $this->postJson('/api/items', $payload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('item.category', 'outer')
            ->assertJsonPath('item.shape', 'trench')
            ->assertJsonPath('item.brand_name', $candidate->brand_name);

        $this->assertDatabaseHas('items', [
            'user_id' => $user->id,
            'name' => 'トレンチ候補',
            'category' => 'outer',
            'shape' => 'trench',
        ]);
    }

    public function test_post_purchase_candidate_image_upload_and_delete_work_with_limit(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $candidate = $this->createCandidate($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $uploadResponse = $this->post("/api/purchase-candidates/{$candidate->id}/images", [
            'image' => $this->createFakePng('front.png'),
            'sort_order' => 1,
            'is_primary' => true,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $uploadResponse->assertCreated()
            ->assertJsonPath('message', 'created')
            ->assertJsonPath('image.purchase_candidate_id', $candidate->id)
            ->assertJsonPath('image.sort_order', 1)
            ->assertJsonPath('image.is_primary', true);

        $imageId = $uploadResponse->json('image.id');
        $imagePath = $uploadResponse->json('image.path');

        Storage::disk('public')->assertExists($imagePath);

        for ($index = 2; $index <= 5; $index++) {
            $this->post("/api/purchase-candidates/{$candidate->id}/images", [
                'image' => $this->createFakePng("{$index}.png"),
            ], [
                'Accept' => 'application/json',
                'X-CSRF-TOKEN' => $token,
            ])->assertCreated();
        }

        $this->post("/api/purchase-candidates/{$candidate->id}/images", [
            'image' => $this->createFakePng('overflow.png'),
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(422)
            ->assertJsonPath('errors.image.0', '画像は5枚まで登録できます。');

        $deleteResponse = $this->deleteJson("/api/purchase-candidates/{$candidate->id}/images/{$imageId}", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $deleteResponse->assertOk()
            ->assertJsonPath('message', 'deleted');

        Storage::disk('public')->assertMissing($imagePath);
        $this->assertDatabaseMissing('purchase_candidate_images', [
            'id' => $imageId,
        ]);
    }
}
