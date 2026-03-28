<?php

namespace App\Services\Settings;

use App\Models\User;
use App\Models\UserPreference;
use App\Support\SkinTonePresetSupport;

class UserPreferenceService
{
    public function get(User $user): ?UserPreference
    {
        return $user->preference;
    }

    public function update(User $user, array $validated): UserPreference
    {
        $preference = UserPreference::query()->firstOrNew([
            'user_id' => $user->id,
        ]);

        $preference->fill([
            'current_season' => $validated['currentSeason'] ?? null,
            'default_wear_log_status' => $validated['defaultWearLogStatus'] ?? null,
            'calendar_week_start' => $validated['calendarWeekStart'] ?? null,
            'skin_tone_preset' => $validated['skinTonePreset']
                ?? $preference->skin_tone_preset
                ?? SkinTonePresetSupport::DEFAULT_PRESET,
        ]);
        $preference->save();

        return $preference;
    }
}
