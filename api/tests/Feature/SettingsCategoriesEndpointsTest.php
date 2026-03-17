<?php

namespace Tests\Feature;

use App\Models\CategoryMaster;
use App\Models\User;
use Database\Seeders\CategoryGroupSeeder;
use Database\Seeders\CategoryMasterSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsCategoriesEndpointsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CategoryGroupSeeder::class);
        $this->seed(CategoryMasterSeeder::class);
    }

    private function issueCsrfToken(): string
    {
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);
        return session()->token();
    }

    public function test_get_settings_categories_returns_401_when_unauthenticated(): void
    {
        $response = $this->getJson('/api/settings/categories', [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(401);
    }

    public function test_get_settings_categories_returns_all_active_category_ids_when_setting_is_null(): void
    {
        $user = User::factory()->create([
            'visible_category_ids' => null,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/settings/categories', [
            'Accept' => 'application/json',
        ]);

        $expectedIds = CategoryMaster::query()
            ->where('is_active', true)
            ->orderBy('group_id')
            ->orderBy('sort_order')
            ->pluck('id')
            ->all();

        $response->assertOk()
            ->assertJson([
                'visibleCategoryIds' => $expectedIds,
            ]);
    }

    public function test_get_settings_categories_returns_saved_visible_category_ids(): void
    {
        $user = User::factory()->create([
            'visible_category_ids' => ['tops_tshirt', 'outer_jacket'],
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/settings/categories', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJson([
                'visibleCategoryIds' => ['tops_tshirt', 'outer_jacket'],
            ]);
    }

    public function test_put_settings_categories_updates_visible_category_ids(): void
    {
        $user = User::factory()->create([
            'visible_category_ids' => null,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson('/api/settings/categories', [
            'visibleCategoryIds' => ['tops_tshirt', 'tops_shirt', 'outer_jacket'],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJson([
                'visibleCategoryIds' => ['tops_tshirt', 'tops_shirt', 'outer_jacket'],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
        ]);

        $this->assertSame(
            ['tops_tshirt', 'tops_shirt', 'outer_jacket'],
            $user->fresh()->visible_category_ids,
        );
    }

    public function test_put_settings_categories_allows_saving_empty_visible_category_ids(): void
    {
        $user = User::factory()->create([
            'visible_category_ids' => ['tops_tshirt', 'outer_jacket'],
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson('/api/settings/categories', [
            'visibleCategoryIds' => [],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJson([
                'visibleCategoryIds' => [],
            ]);

        $this->assertSame([], $user->fresh()->visible_category_ids);
    }

    public function test_put_settings_categories_returns_422_for_invalid_category_id(): void
    {
        $user = User::factory()->create([
            'visible_category_ids' => null,
        ]);

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson('/api/settings/categories', [
            'visibleCategoryIds' => ['tops_tshirt', 'invalid_category_id'],
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['visibleCategoryIds.1']);
    }
}