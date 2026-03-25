<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserBrand;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsBrandsEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function issueCsrfToken(): string
    {
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        return session()->token();
    }

    private function createBrand(User $user, array $overrides = []): UserBrand
    {
        return UserBrand::query()->create(array_merge([
            'user_id' => $user->id,
            'name' => 'UNIQLO',
            'kana' => 'ゆにくろ',
            'normalized_name' => 'uniqlo',
            'normalized_kana' => 'ゆにくろ',
            'is_active' => true,
        ], $overrides));
    }

    public function test_get_settings_brands_returns_only_owned_brands(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->createBrand($user);
        $this->createBrand($otherUser, [
            'name' => 'GU',
            'normalized_name' => 'gu',
            'kana' => 'じーゆー',
            'normalized_kana' => 'じーゆー',
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/settings/brands', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'brands')
            ->assertJsonPath('brands.0.name', 'UNIQLO');

        $this->assertNotNull($response->json('brands.0.updated_at'));

        $response->assertJsonMissing([
            'name' => 'GU',
        ]);
    }

    public function test_post_settings_brands_prevents_duplicate_normalized_name(): void
    {
        $user = User::factory()->create();
        $this->createBrand($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/settings/brands', [
            'name' => '  uniqlo  ',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.name.0', '同じブランド候補がすでに存在します。');
    }

    public function test_post_settings_brands_prevents_duplicate_normalized_kana(): void
    {
        $user = User::factory()->create();
        $this->createBrand($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/settings/brands', [
            'name' => 'ユニクロ公式',
            'kana' => 'ユニクロ',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.kana.0', '同じ読み仮名のブランド候補がすでに存在します。');
    }

    public function test_post_settings_brands_allows_registering_without_kana(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/settings/brands', [
            'name' => 'GLOBAL WORK',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('brand.name', 'GLOBAL WORK')
            ->assertJsonPath('brand.kana', null)
            ->assertJsonPath('brand.is_active', true);

        $this->assertNotNull($response->json('brand.updated_at'));

        $this->assertDatabaseHas('user_brands', [
            'user_id' => $user->id,
            'name' => 'GLOBAL WORK',
            'kana' => null,
            'normalized_name' => 'global work',
            'normalized_kana' => null,
            'is_active' => 1,
        ]);
    }

    public function test_patch_settings_brands_updates_name_and_active_state(): void
    {
        $user = User::factory()->create();
        $brand = $this->createBrand($user);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->patchJson("/api/settings/brands/{$brand->id}", [
            'name' => 'GU',
            'kana' => 'じーゆー',
            'is_active' => false,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('brand.name', 'GU')
            ->assertJsonPath('brand.is_active', false);

        $this->assertNotNull($response->json('brand.updated_at'));

        $this->assertDatabaseHas('user_brands', [
            'id' => $brand->id,
            'name' => 'GU',
            'normalized_name' => 'gu',
            'normalized_kana' => 'じーゆー',
            'is_active' => 0,
        ]);
    }
}
