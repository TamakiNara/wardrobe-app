<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserTpo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTposEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_settings_tpos_returns_presets_for_current_user(): void
    {
        $user = User::factory()->create();
        $this->assertDatabaseCount('user_tpos', 3);
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/settings/tpos', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonCount(3, 'tpos')
            ->assertJsonPath('tpos.0.name', '仕事')
            ->assertJsonPath('tpos.1.name', '休日')
            ->assertJsonPath('tpos.2.name', 'フォーマル')
            ->assertJsonPath('tpos.0.isPreset', true)
            ->assertJsonPath('tpos.0.isActive', true);
    }

    public function test_post_settings_tpos_creates_custom_tpo(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/settings/tpos', [
            'name' => '出張',
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'created')
            ->assertJsonPath('tpo.name', '出張')
            ->assertJsonPath('tpo.isPreset', false)
            ->assertJsonPath('tpo.isActive', true);

        $this->assertDatabaseHas('user_tpos', [
            'user_id' => $user->id,
            'name' => '出張',
            'is_preset' => false,
            'is_active' => true,
        ]);
    }

    public function test_patch_settings_tpos_can_update_custom_name_active_and_sort_order(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $presetWork = UserTpo::query()
            ->where('user_id', $user->id)
            ->where('name', '仕事')
            ->firstOrFail();
        $custom = UserTpo::query()->create([
            'user_id' => $user->id,
            'name' => '出張',
            'sort_order' => 4,
            'is_active' => true,
            'is_preset' => false,
        ]);

        $response = $this->patchJson("/api/settings/tpos/{$custom->id}", [
            'name' => '会食',
            'isActive' => false,
            'sortOrder' => 1,
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('tpo.name', '会食')
            ->assertJsonPath('tpo.isActive', false)
            ->assertJsonPath('tpo.sortOrder', 1);

        $custom->refresh();
        $presetWork->refresh();

        $this->assertSame('会食', $custom->name);
        $this->assertFalse($custom->is_active);
        $this->assertSame(1, $custom->sort_order);
        $this->assertSame(2, $presetWork->sort_order);
    }

    public function test_patch_settings_tpos_rejects_preset_rename(): void
    {
        $user = User::factory()->create();
        $preset = UserTpo::query()
            ->where('user_id', $user->id)
            ->where('name', '仕事')
            ->firstOrFail();

        $this->actingAs($user, 'web');

        $response = $this->patchJson("/api/settings/tpos/{$preset->id}", [
            'name' => 'オフィス',
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.name.0', 'プリセット TPO の名称は変更できません。');
    }
}
