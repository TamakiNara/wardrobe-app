<?php

namespace Tests\Feature;

use App\Models\CategoryGroup;
use App\Models\CategoryMaster;
use App\Models\Item;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PurchaseCandidateEndpointsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<int, array{part_label:string, material_name:string, ratio:int}>
     */
    private function buildMaterialsPayload(): array
    {
        return [
            [
                'part_label' => '本体',
                'material_name' => '綿',
                'ratio' => 80,
            ],
            [
                'part_label' => '本体',
                'material_name' => 'ポリエステル',
                'ratio' => 20,
            ],
            [
                'part_label' => '裏地',
                'material_name' => 'ポリエステル',
                'ratio' => 100,
            ],
        ];
    }

    private function issueCsrfToken(): string
    {
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        return session()->token();
    }

    private function createCategory(string $id = 'outerwear_coat', string $groupId = 'outerwear', string $name = 'コート'): void
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
        $categoryId = $overrides['category_id'] ?? 'outerwear_coat';
        $materials = $overrides['materials'] ?? [];
        unset($overrides['materials']);
        $this->createCategory($categoryId);

        $candidate = PurchaseCandidate::query()->create(array_merge([
            'user_id' => $user->id,
            'status' => 'considering',
            'priority' => 'medium',
            'name' => 'ネイビーのレインコート',
            'category_id' => $categoryId,
            'brand_name' => 'Sample Brand',
            'price' => 14800,
            'sale_price' => 12800,
            'sale_ends_at' => '2026-04-01 12:00:00',
            'purchase_url' => 'https://example.test/products/1',
            'memo' => 'メモ',
            'wanted_reason' => '欲しい理由',
            'size_gender' => 'women',
            'size_label' => 'M',
            'size_note' => '厚手インナー込み',
            'size_details' => [
                'structured' => [
                    'shoulder_width' => 42,
                ],
                'custom_fields' => [
                    [
                        'label' => '裄丈',
                        'value' => 78,
                        'sort_order' => 1,
                    ],
                ],
            ],
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

        if (is_array($materials) && $materials !== []) {
            $candidate->materials()->createMany($materials);
        }

        return $candidate->fresh(['category', 'colors', 'seasons', 'tpos', 'images', 'materials']);
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
            ->assertJsonPath('purchaseCandidates.0.sale_price', 12800)
            ->assertJsonPath('purchaseCandidates.0.purchase_url', 'https://example.test/products/1')
            ->assertJsonPath('purchaseCandidates.0.colors.0.hex', '#1F3A5F')
            ->assertJsonPath('availableBrands.0', 'Sample Brand')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.totalAll', 1);
    }

    public function test_get_purchase_candidates_applies_filters_sort_and_pagination(): void
    {
        $user = User::factory()->create();
        $this->createCategory('outerwear_coat', 'outer', 'コート');

        for ($index = 1; $index <= 13; $index++) {
            $this->createCandidate($user, [
                'name' => sprintf('在宅コート%02d', $index),
                'status' => 'considering',
                'priority' => 'high',
                'category_id' => 'outerwear_coat',
                'brand_name' => '在宅ブランド',
                'wanted_reason' => '在宅用を追加したい',
                'memo' => '在宅候補メモ',
            ]);
        }

        $this->createCandidate($user, [
            'name' => '休日コート',
            'status' => 'purchased',
            'priority' => 'medium',
            'category_id' => 'outerwear_coat',
            'brand_name' => '休日ブランド',
            'wanted_reason' => '休日用',
            'memo' => '休日候補メモ',
        ]);

        $this->createCandidate($user, [
            'name' => '在宅コートブランド違い',
            'status' => 'considering',
            'priority' => 'high',
            'category_id' => 'outerwear_coat',
            'brand_name' => '別ブランド',
            'wanted_reason' => '在宅用を追加したい',
            'memo' => '在宅候補メモ',
        ]);

        $otherUser = User::factory()->create();
        $this->createCandidate($otherUser, [
            'name' => '在宅コート他人分',
            'status' => 'considering',
            'priority' => 'high',
            'category_id' => 'outerwear_coat',
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/purchase-candidates?keyword=%E5%9C%A8%E5%AE%85&status=considering&priority=high&category=outerwear&subcategory=coat&brand=%E5%9C%A8%E5%AE%85%E3%83%96%E3%83%A9%E3%83%B3%E3%83%89&sort=name_asc&page=2', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'purchaseCandidates')
            ->assertJsonPath('purchaseCandidates.0.name', '在宅コート13')
            ->assertJsonPath('availableBrands.0', '休日ブランド')
            ->assertJsonPath('availableBrands.1', '別ブランド')
            ->assertJsonPath('availableBrands.2', '在宅ブランド')
            ->assertJsonPath('meta.total', 13)
            ->assertJsonPath('meta.totalAll', 15)
            ->assertJsonPath('meta.page', 2)
            ->assertJsonPath('meta.lastPage', 2);

        $response->assertJsonMissing([
            'name' => '休日コート',
        ]);
        $response->assertJsonMissing([
            'name' => '在宅コートブランド違い',
        ]);
    }

    public function test_get_purchase_candidates_filters_by_parent_category(): void
    {
        $user = User::factory()->create();
        $outerwearCandidate = $this->createCandidate($user, [
            'name' => 'outerwear candidate',
            'category_id' => 'outerwear_coat',
        ]);
        $this->createCandidate($user, [
            'name' => 'tops candidate',
            'category_id' => 'tops_tshirt_cutsew',
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/purchase-candidates?category=outerwear', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'purchaseCandidates')
            ->assertJsonPath('purchaseCandidates.0.id', $outerwearCandidate->id)
            ->assertJsonPath('purchaseCandidates.0.name', 'outerwear candidate');
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
            ->assertJsonPath('purchaseCandidate.category_id', 'outerwear_coat')
            ->assertJsonPath('purchaseCandidate.sale_price', 12800)
            ->assertJsonPath('purchaseCandidate.colors.0.value', 'navy')
            ->assertJsonPath('purchaseCandidate.seasons.0', '春')
            ->assertJsonPath('purchaseCandidate.tpos.0', '休日')
            ->assertJsonPath('purchaseCandidate.materials', []);
    }

    public function test_post_purchase_candidate_creates_candidate_with_array_fields(): void
    {
        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/purchase-candidates', [
            'status' => 'considering',
            'priority' => 'high',
            'name' => '白シャツ候補',
            'category_id' => 'tops_shirt_blouse',
            'brand_name' => 'Brand',
            'price' => 9800,
            'sale_price' => 8800,
            'sale_ends_at' => '2026-03-31T18:00:00+09:00',
            'purchase_url' => 'https://example.test/products/2',
            'memo' => '試着したい',
            'wanted_reason' => '仕事用を補充したい',
            'size_gender' => 'women',
            'size_label' => 'S',
            'size_note' => '肩幅確認',
            'size_details' => [
                'structured' => [
                    'shoulder_width' => 41.5,
                ],
                'custom_fields' => [
                    [
                        'label' => '裄丈',
                        'value' => 79,
                        'sort_order' => 1,
                    ],
                ],
            ],
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
            ->assertJsonPath('purchaseCandidate.category_id', 'tops_shirt_blouse')
            ->assertJsonPath('purchaseCandidate.sale_price', 8800)
            ->assertJsonPath('purchaseCandidate.size_details.structured.shoulder_width', 41.5)
            ->assertJsonPath('purchaseCandidate.size_details.custom_fields.0.label', '裄丈')
            ->assertJsonPath('purchaseCandidate.colors.0.value', 'white')
            ->assertJsonPath('purchaseCandidate.seasons.1', '秋')
            ->assertJsonPath('purchaseCandidate.materials', []);

        $this->assertDatabaseHas('purchase_candidates', [
            'user_id' => $user->id,
            'name' => '白シャツ候補',
            'category_id' => 'tops_shirt_blouse',
            'sale_price' => 8800,
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

    public function test_post_purchase_candidate_stores_materials_when_each_part_totals_100(): void
    {
        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/purchase-candidates', [
            'status' => 'considering',
            'priority' => 'high',
            'name' => '素材付き候補',
            'category_id' => 'tops_shirt_blouse',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#ffffff',
                'label' => 'ホワイト',
            ]],
            'materials' => $this->buildMaterialsPayload(),
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('purchaseCandidate.materials.0.part_label', '本体')
            ->assertJsonPath('purchaseCandidate.materials.0.material_name', '綿')
            ->assertJsonPath('purchaseCandidate.materials.0.ratio', 80)
            ->assertJsonPath('purchaseCandidate.materials.2.part_label', '裏地')
            ->assertJsonPath('purchaseCandidate.materials.2.ratio', 100);

        $this->assertDatabaseHas('purchase_candidate_materials', [
            'purchase_candidate_id' => $response->json('purchaseCandidate.id'),
            'part_label' => '本体',
            'material_name' => '綿',
            'ratio' => 80,
        ]);
    }

    public function test_post_purchase_candidate_rejects_materials_when_part_total_is_not_100(): void
    {
        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/purchase-candidates', [
            'status' => 'considering',
            'priority' => 'medium',
            'name' => '不正素材候補',
            'category_id' => 'tops_shirt_blouse',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#ffffff',
                'label' => 'ホワイト',
            ]],
            'materials' => [
                [
                    'part_label' => '本体',
                    'material_name' => '綿',
                    'ratio' => 70,
                ],
                [
                    'part_label' => '本体',
                    'material_name' => 'ポリエステル',
                    'ratio' => 20,
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['materials'])
            ->assertJsonPath('errors.materials.0', '区分ごとの合計を100%にしてください。（本体: 90%）');
    }

    public function test_post_purchase_candidate_rejects_duplicate_materials_in_same_part(): void
    {
        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/purchase-candidates', [
            'status' => 'considering',
            'priority' => 'medium',
            'name' => '重複素材候補',
            'category_id' => 'tops_shirt_blouse',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#ffffff',
                'label' => 'ホワイト',
            ]],
            'materials' => [
                [
                    'part_label' => '本体',
                    'material_name' => '綿',
                    'ratio' => 50,
                ],
                [
                    'part_label' => '本体',
                    'material_name' => '綿',
                    'ratio' => 50,
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['materials.1.material_name']);
    }

    public function test_post_purchase_candidate_rejects_unknown_size_gender(): void
    {
        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse', 'tops', 'シャツ・ブラウス');

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/purchase-candidates', [
            'status' => 'considering',
            'priority' => 'medium',
            'name' => '白シャツ候補',
            'category_id' => 'tops_shirt_blouse',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'white',
                'hex' => '#ffffff',
                'label' => 'ホワイト',
            ]],
            'seasons' => [],
            'tpos' => [],
            'size_gender' => 'unknown',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['size_gender']);
    }

    public function test_put_purchase_candidate_updates_candidate(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, ['category_id' => 'tops_shirt_blouse']);
        $this->createCategory('tops_knit_sweater', 'tops', 'ニット・セーター');

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/purchase-candidates/{$candidate->id}", [
            'status' => 'on_hold',
            'priority' => 'low',
            'name' => '更新後候補',
            'category_id' => 'tops_knit_sweater',
            'brand_name' => null,
            'price' => 12000,
            'sale_price' => 9800,
            'sale_ends_at' => '2026-04-15T12:00:00+09:00',
            'purchase_url' => null,
            'memo' => '更新メモ',
            'wanted_reason' => null,
            'size_gender' => 'unisex',
            'size_label' => 'L',
            'size_note' => null,
            'size_details' => [
                'structured' => [
                    'body_length' => 68,
                ],
            ],
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
            ->assertJsonPath('purchaseCandidate.category_id', 'tops_knit_sweater')
            ->assertJsonPath('purchaseCandidate.sale_price', 9800)
            ->assertJsonPath('purchaseCandidate.size_details.structured.body_length', 68)
            ->assertJsonPath('purchaseCandidate.colors.0.value', 'gray');

        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $candidate->id,
            'status' => 'on_hold',
            'category_id' => 'tops_knit_sweater',
            'sale_price' => 9800,
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
            'category_id' => 'outerwear_coat',
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
        $candidate = $this->createCandidate($user, ['category_id' => 'outerwear_coat']);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/purchase-candidates/{$candidate->id}/item-draft", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'item_draft_ready')
            ->assertJsonPath('item_draft.source_category_id', 'outerwear_coat')
            ->assertJsonPath('item_draft.category', 'outerwear')
            ->assertJsonPath('item_draft.shape', 'coat')
            ->assertJsonPath('item_draft.memo', 'メモ')
            ->assertJsonPath('item_draft.size_details.structured.shoulder_width', 42)
            ->assertJsonPath('item_draft.size_details.custom_fields.0.label', '裄丈')
            ->assertJsonPath('item_draft.colors.0.value', 'navy')
            ->assertJsonPath('item_draft.materials', [])
            ->assertJsonMissingPath('item_draft.wanted_reason')
            ->assertJsonPath('candidate_summary.id', $candidate->id);
    }

    public function test_post_purchase_candidate_item_draft_supports_fashion_accessories_shoes_swimwear_and_kimono(): void
    {
        $user = User::factory()->create();

        $cases = [
            'fashion_accessories_scarf_bandana' => ['category' => 'fashion_accessories', 'subcategory' => 'scarf_bandana', 'shape' => 'scarf-bandana'],
            'shoes_pumps' => ['category' => 'shoes', 'subcategory' => 'pumps', 'shape' => 'pumps'],
            'swimwear_rashguard' => ['category' => 'swimwear', 'shape' => 'rashguard'],
            'kimono_kimono' => ['category' => 'kimono', 'shape' => 'kimono'],
        ];

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        foreach ($cases as $categoryId => $expected) {
            $candidate = $this->createCandidate($user, ['category_id' => $categoryId]);

            $response = $this->postJson("/api/purchase-candidates/{$candidate->id}/item-draft", [], [
                'Accept' => 'application/json',
                'X-CSRF-TOKEN' => $token,
            ]);

            $response->assertOk()
                ->assertJsonPath('item_draft.source_category_id', $categoryId)
                ->assertJsonPath('item_draft.category', $expected['category'])
                ->assertJsonPath('item_draft.subcategory', $expected['subcategory'] ?? null)
                ->assertJsonPath('item_draft.shape', $expected['shape']);
        }
    }

    public function test_post_purchase_candidate_item_draft_includes_materials(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, [
            'category_id' => 'outerwear_coat',
            'materials' => $this->buildMaterialsPayload(),
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/purchase-candidates/{$candidate->id}/item-draft", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('item_draft.materials.0.part_label', '本体')
            ->assertJsonPath('item_draft.materials.0.material_name', '綿')
            ->assertJsonPath('item_draft.materials.2.part_label', '裏地');
    }

    public function test_post_purchase_candidate_duplicate_returns_payload_without_creating_new_candidate(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, [
            'status' => 'purchased',
            'priority' => 'high',
            'category_id' => 'tops_shirt_blouse',
        ]);
        $sourcePath = "purchase-candidates/{$candidate->id}/source.png";

        $candidate->images()->create([
            'disk' => 'public',
            'path' => $sourcePath,
            'original_filename' => 'source.png',
            'mime_type' => 'image/png',
            'file_size' => 1234,
            'sort_order' => 1,
            'is_primary' => true,
        ]);
        Storage::disk('public')->put(
            $sourcePath,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn9nS8AAAAASUVORK5CYII=')
        );
        $beforeCount = PurchaseCandidate::query()->count();

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/purchase-candidates/{$candidate->id}/duplicate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'duplicated_payload_ready')
            ->assertJsonPath('purchaseCandidate.status', 'considering')
            ->assertJsonPath('purchaseCandidate.priority', 'high')
            ->assertJsonPath('purchaseCandidate.name', $candidate->name.'（コピー）')
            ->assertJsonPath('purchaseCandidate.category_id', 'tops_shirt_blouse')
            ->assertJsonPath('purchaseCandidate.sale_price', 12800)
            ->assertJsonPath('purchaseCandidate.colors.0.value', 'navy')
            ->assertJsonPath('purchaseCandidate.seasons.0', '春')
            ->assertJsonPath('purchaseCandidate.tpos.0', '休日')
            ->assertJsonPath('purchaseCandidate.materials', [])
            ->assertJsonCount(1, 'purchaseCandidate.images')
            ->assertJsonPath('purchaseCandidate.images.0.source_image_id', $candidate->images()->first()->id)
            ->assertJsonPath('purchaseCandidate.images.0.path', $sourcePath);

        $response->assertJsonMissingPath('purchaseCandidate.converted_item_id');
        $response->assertJsonMissingPath('purchaseCandidate.converted_at');
        $this->assertSame($beforeCount, PurchaseCandidate::query()->count());
        Storage::disk('public')->assertExists($sourcePath);
    }

    public function test_post_purchase_candidate_duplicate_does_not_append_copy_suffix_twice(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, [
            'name' => '春コート（コピー）',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/purchase-candidates/{$candidate->id}/duplicate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('purchaseCandidate.name', '春コート（コピー）');
    }

    public function test_post_purchase_candidate_duplicate_does_not_inherit_group(): void
    {
        $user = User::factory()->create();
        $group = PurchaseCandidateGroup::query()->create([
            'user_id' => $user->id,
        ]);
        $candidate = $this->createCandidate($user, [
            'group_id' => $group->id,
            'group_order' => 1,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/purchase-candidates/{$candidate->id}/duplicate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonMissingPath('purchaseCandidate.group_id');
    }

    public function test_post_purchase_candidate_color_variant_draft_does_not_group_until_store(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, [
            'name' => '春コート',
            'category_id' => 'tops_shirt_blouse',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $draftResponse = $this->postJson("/api/purchase-candidates/{$candidate->id}/color-variant", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $draftResponse->assertOk()
            ->assertJsonPath('message', 'color_variant_payload_ready')
            ->assertJsonPath('purchaseCandidate.name', '春コート')
            ->assertJsonPath('purchaseCandidate.variant_source_candidate_id', $candidate->id)
            ->assertJsonMissingPath('purchaseCandidate.group_id');

        $this->assertDatabaseCount('purchase_candidate_groups', 0);
        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $candidate->id,
            'group_id' => null,
            'group_order' => null,
        ]);

        $payload = $draftResponse->json('purchaseCandidate');
        unset($payload['images']);

        $storeResponse = $this->postJson('/api/purchase-candidates', $payload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $storeResponse->assertCreated();
        $newCandidateId = $storeResponse->json('purchaseCandidate.id');

        $groupId = PurchaseCandidate::query()->findOrFail($candidate->id)->group_id;

        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $candidate->id,
            'group_id' => $groupId,
            'group_order' => 1,
        ]);
        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $newCandidateId,
            'group_id' => $groupId,
            'group_order' => 2,
        ]);
    }

    public function test_post_purchase_candidate_color_variant_uses_existing_group(): void
    {
        $user = User::factory()->create();
        $group = PurchaseCandidateGroup::query()->create([
            'user_id' => $user->id,
        ]);
        $this->createCandidate($user, [
            'group_id' => $group->id,
            'group_order' => 1,
        ]);
        $candidate = $this->createCandidate($user, [
            'name' => '色違い元',
            'group_id' => $group->id,
            'group_order' => 2,
            'category_id' => 'tops_shirt_blouse',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $draftResponse = $this->postJson("/api/purchase-candidates/{$candidate->id}/color-variant", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $draftResponse->assertOk()
            ->assertJsonPath('purchaseCandidate.variant_source_candidate_id', $candidate->id)
            ->assertJsonMissingPath('purchaseCandidate.group_id');

        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $candidate->id,
            'group_id' => $group->id,
            'group_order' => 2,
        ]);

        $payload = $draftResponse->json('purchaseCandidate');
        unset($payload['images']);

        $storeResponse = $this->postJson('/api/purchase-candidates', $payload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $storeResponse->assertCreated();
        $newCandidateId = $storeResponse->json('purchaseCandidate.id');

        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $newCandidateId,
            'group_id' => $group->id,
            'group_order' => 3,
        ]);
    }

    public function test_post_purchase_candidate_store_copies_duplicate_source_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $sourceCandidate = $this->createCandidate($user, [
            'category_id' => 'tops_shirt_blouse',
        ]);
        $sourcePath = "purchase-candidates/{$sourceCandidate->id}/source.png";

        $sourceImage = $sourceCandidate->images()->create([
            'disk' => 'public',
            'path' => $sourcePath,
            'original_filename' => 'source.png',
            'mime_type' => 'image/png',
            'file_size' => 1234,
            'sort_order' => 1,
            'is_primary' => true,
        ]);
        Storage::disk('public')->put(
            $sourcePath,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn9nS8AAAAASUVORK5CYII=')
        );

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/purchase-candidates', [
            'status' => 'considering',
            'priority' => 'medium',
            'name' => '複製テスト候補',
            'category_id' => 'tops_shirt_blouse',
            'brand_name' => 'Sample Brand',
            'price' => 14800,
            'sale_price' => 12800,
            'sale_ends_at' => '2026-04-01T12:00:00+09:00',
            'purchase_url' => 'https://example.test/products/1',
            'memo' => 'メモ',
            'wanted_reason' => '欲しい理由',
            'size_gender' => 'women',
            'size_label' => 'M',
            'size_note' => '厚手インナー込み',
            'is_rain_ok' => true,
            'colors' => [
                [
                    'role' => 'main',
                    'mode' => 'preset',
                    'value' => 'navy',
                    'hex' => '#1F3A5F',
                    'label' => 'ネイビー',
                ],
            ],
            'seasons' => ['春'],
            'tpos' => ['休日'],
            'materials' => [],
            'duplicate_images' => [
                [
                    'source_image_id' => $sourceImage->id,
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('purchaseCandidate.images.0.original_filename', 'source.png');

        $newCandidateId = $response->json('purchaseCandidate.id');
        $newPath = $response->json('purchaseCandidate.images.0.path');

        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $newCandidateId,
            'name' => '複製テスト候補',
        ]);
        $this->assertSame(2, PurchaseCandidate::query()->count());
        $this->assertStringStartsWith("purchase-candidates/{$newCandidateId}/", $newPath);
        Storage::disk('public')->assertExists($sourcePath);
        Storage::disk('public')->assertExists($newPath);
    }

    public function test_post_purchase_candidate_duplicate_is_not_available_for_other_users_candidate(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $candidate = $this->createCandidate($otherUser);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->postJson("/api/purchase-candidates/{$candidate->id}/duplicate", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertStatus(404);
    }

    public function test_post_purchase_candidate_store_rejects_missing_duplicate_source_image(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $sourceCandidate = $this->createCandidate($user, [
            'category_id' => 'tops_shirt_blouse',
        ]);
        $sourceImage = $sourceCandidate->images()->create([
            'disk' => 'public',
            'path' => "purchase-candidates/{$sourceCandidate->id}/missing.png",
            'original_filename' => 'missing.png',
            'mime_type' => 'image/png',
            'file_size' => 1234,
            'sort_order' => 1,
            'is_primary' => true,
        ]);

        $beforeCount = PurchaseCandidate::query()->count();

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/purchase-candidates', [
            'status' => 'considering',
            'priority' => 'medium',
            'name' => '複製失敗候補',
            'category_id' => 'tops_shirt_blouse',
            'brand_name' => 'Sample Brand',
            'price' => 14800,
            'colors' => [
                [
                    'role' => 'main',
                    'mode' => 'preset',
                    'value' => 'navy',
                    'hex' => '#1F3A5F',
                    'label' => 'ネイビー',
                ],
            ],
            'duplicate_images' => [
                [
                    'source_image_id' => $sourceImage->id,
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.images.0', '複製元画像が見つかりません。');

        $this->assertSame($beforeCount, PurchaseCandidate::query()->count());
        $this->assertSame(1, DB::table('purchase_candidates')->count());
        $this->assertSame(1, DB::table('purchase_candidate_images')->count());
    }

    public function test_post_purchase_candidate_store_can_add_brand_candidate(): void
    {
        $user = User::factory()->create();
        $this->createCategory('tops_shirt_blouse');

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/purchase-candidates', [
            'status' => 'considering',
            'priority' => 'medium',
            'name' => 'ブランド候補追加テスト',
            'category_id' => 'tops_shirt_blouse',
            'brand_name' => 'UNIQLO',
            'save_brand_as_candidate' => true,
            'price' => 14800,
            'colors' => [
                [
                    'role' => 'main',
                    'mode' => 'preset',
                    'value' => 'navy',
                    'hex' => '#1F3A5F',
                    'label' => 'ネイビー',
                ],
            ],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('purchaseCandidate.brand_name', 'UNIQLO');

        $this->assertDatabaseHas('user_brands', [
            'user_id' => $user->id,
            'name' => 'UNIQLO',
            'is_active' => true,
        ]);
    }

    public function test_put_purchased_purchase_candidate_updates_only_allowed_fields(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, [
            'status' => 'purchased',
            'converted_at' => '2026-03-25 12:00:00',
        ]);

        $item = Item::factory()->create([
            'user_id' => $user->id,
            'name' => '変換済みアイテム',
        ]);
        $candidate->forceFill([
            'converted_item_id' => $item->id,
        ])->save();

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/purchase-candidates/{$candidate->id}", [
            'priority' => 'low',
            'sale_price' => 9900,
            'sale_ends_at' => '2026-04-30T12:00:00+09:00',
            'purchase_url' => 'https://example.test/products/purchased',
            'memo' => '購入後メモ',
            'wanted_reason' => '購入履歴の補足',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('purchaseCandidate.status', 'purchased')
            ->assertJsonPath('purchaseCandidate.priority', 'low')
            ->assertJsonPath('purchaseCandidate.sale_price', 9900)
            ->assertJsonPath('purchaseCandidate.memo', '購入後メモ')
            ->assertJsonPath('purchaseCandidate.converted_item_id', $item->id);

        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $candidate->id,
            'status' => 'purchased',
            'priority' => 'low',
            'sale_price' => 9900,
            'name' => 'ネイビーのレインコート',
            'converted_item_id' => $item->id,
        ]);
    }

    public function test_put_purchased_purchase_candidate_rejects_locked_fields(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, [
            'status' => 'purchased',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson("/api/purchase-candidates/{$candidate->id}", [
            'name' => '変更不可',
            'category_id' => 'tops_shirt_blouse',
            'colors' => [[
                'role' => 'main',
                'mode' => 'preset',
                'value' => 'gray',
                'hex' => '#cccccc',
                'label' => 'グレー',
            ]],
            'materials' => $this->buildMaterialsPayload(),
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.name.0', '購入済みの購入検討では変更できません。')
            ->assertJsonPath('errors.category_id.0', '購入済みの購入検討では変更できません。')
            ->assertJsonPath('errors.colors.0', '購入済みの購入検討では変更できません。')
            ->assertJsonPath('errors.materials.0', '購入済みの購入検討では変更できません。');

        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $candidate->id,
            'name' => 'ネイビーのレインコート',
            'category_id' => 'outerwear_coat',
        ]);
    }

    public function test_put_purchased_purchase_candidate_does_not_change_converted_item(): void
    {
        $user = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $user->id,
            'name' => '変換済みアイテム',
            'brand_name' => 'Original Brand',
        ]);
        $candidate = $this->createCandidate($user, [
            'status' => 'purchased',
            'converted_item_id' => $item->id,
            'converted_at' => '2026-03-25 12:00:00',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->putJson("/api/purchase-candidates/{$candidate->id}", [
            'memo' => 'candidate 側だけ更新',
            'purchase_url' => 'https://example.test/purchased-only',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])->assertOk();

        $item->refresh();
        $this->assertSame('変換済みアイテム', $item->name);
        $this->assertSame('Original Brand', $item->brand_name);
        $this->assertNull($item->memo);
        $this->assertSame($item->id, $candidate->fresh()->converted_item_id);
        $this->assertNotNull($candidate->fresh()->converted_at);
    }

    public function test_post_purchase_candidate_item_draft_is_not_available_for_purchased_candidate(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, [
            'status' => 'purchased',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson("/api/purchase-candidates/{$candidate->id}/item-draft", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.status.0', '購入済みの購入検討からはアイテム作成初期値を生成できません。');
    }

    public function test_purchase_candidate_item_draft_can_flow_into_item_create(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate($user, [
            'category_id' => 'outerwear_coat',
            'name' => 'トレンチ候補',
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $draftResponse = $this->postJson("/api/purchase-candidates/{$candidate->id}/item-draft", [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $draftResponse->assertOk()
            ->assertJsonPath('item_draft.category', 'outerwear')
            ->assertJsonPath('item_draft.shape', 'coat');

        $payload = $draftResponse->json('item_draft');
        $payload['purchase_candidate_id'] = $candidate->id;
        $payload['images'] = [];

        $createResponse = $this->postJson('/api/items', $payload, [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('item.category', 'outerwear')
            ->assertJsonPath('item.shape', 'coat')
            ->assertJsonPath('item.brand_name', $candidate->brand_name)
            ->assertJsonPath('item.memo', $candidate->memo);

        $this->assertDatabaseHas('items', [
            'user_id' => $user->id,
            'name' => 'トレンチ候補',
            'category' => 'outerwear',
            'shape' => 'coat',
            'memo' => 'メモ',
        ]);
        $this->assertDatabaseHas('purchase_candidates', [
            'id' => $candidate->id,
            'status' => 'purchased',
            'converted_item_id' => $createResponse->json('item.id'),
        ]);
        $this->assertNotNull($candidate->fresh()->converted_at);
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

    public function test_post_purchase_candidate_image_upload_returns_japanese_message_for_unsupported_format(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $candidate = $this->createCandidate($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->post("/api/purchase-candidates/{$candidate->id}/images", [
            'image' => UploadedFile::fake()->create('front.avif', 100, 'image/avif'),
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.image.0', '対応していない画像形式です。JPEG / PNG / WebP を選んでください。');
    }
}
