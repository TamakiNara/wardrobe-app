<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsPreferencesEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function issueCsrfToken(): string
    {
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        return session()->token();
    }

    public function test_get_settings_preferences_returns_nulls_when_unset(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/settings/preferences', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJsonPath('preferences.currentSeason', null)
            ->assertJsonPath('preferences.defaultWearLogStatus', null);
    }

    public function test_put_settings_preferences_stores_values(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson('/api/settings/preferences', [
            'currentSeason' => 'spring',
            'defaultWearLogStatus' => 'worn',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'updated')
            ->assertJsonPath('preferences.currentSeason', 'spring')
            ->assertJsonPath('preferences.defaultWearLogStatus', 'worn');

        $this->assertDatabaseHas('user_preferences', [
            'user_id' => $user->id,
            'current_season' => 'spring',
            'default_wear_log_status' => 'worn',
        ]);
    }

    public function test_put_settings_preferences_accepts_null_values(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $response = $this->putJson('/api/settings/preferences', [
            'currentSeason' => null,
            'defaultWearLogStatus' => null,
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('preferences.currentSeason', null)
            ->assertJsonPath('preferences.defaultWearLogStatus', null);

        $this->assertDatabaseHas('user_preferences', [
            'user_id' => $user->id,
            'current_season' => null,
            'default_wear_log_status' => null,
        ]);
    }

    public function test_put_settings_preferences_rejects_all_as_current_season(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');
        $token = $this->issueCsrfToken();

        $this->putJson('/api/settings/preferences', [
            'currentSeason' => 'all',
            'defaultWearLogStatus' => 'planned',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['currentSeason']);
    }
}
