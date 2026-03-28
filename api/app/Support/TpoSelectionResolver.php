<?php

namespace App\Support;

use App\Models\User;
use App\Services\Settings\UserTpoService;

class TpoSelectionResolver
{
    public static function resolve(
        UserTpoService $userTpoService,
        User $user,
        array $validated,
        array $currentIds = [],
    ): array {
        return array_key_exists('tpo_ids', $validated)
            ? $userTpoService->resolvePersistableIds(
                $user,
                $validated['tpo_ids'] ?? [],
                $currentIds,
            )
            : $userTpoService->resolveIdsFromNames(
                $user,
                $validated['tpos'] ?? [],
            );
    }
}
