<?php

namespace App\Support;

use App\Models\UserPreference;

class UserPreferencePayloadBuilder
{
    public static function build(?UserPreference $preference): array
    {
        $currentSeason = $preference?->current_season;

        if ($currentSeason === 'all') {
            $currentSeason = null;
        }

        return [
            'currentSeason' => $currentSeason,
            'defaultWearLogStatus' => $preference?->default_wear_log_status,
        ];
    }
}
