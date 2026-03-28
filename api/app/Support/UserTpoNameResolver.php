<?php

namespace App\Support;

use App\Models\User;
use App\Models\UserTpo;

class UserTpoNameResolver
{
    public static function resolveNames(User $user, array $tpoIds, array $fallbackNames = []): array
    {
        $ids = collect($tpoIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->values();

        if ($ids->isEmpty()) {
            return self::normalizeFallbackNames($fallbackNames);
        }

        $nameById = UserTpo::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id')
            ->map(fn (UserTpo $tpo) => $tpo->name);

        $resolved = $ids
            ->map(fn (int $id) => $nameById->get($id))
            ->filter(fn ($name) => is_string($name) && $name !== '')
            ->values()
            ->all();

        if ($resolved !== []) {
            return $resolved;
        }

        return self::normalizeFallbackNames($fallbackNames);
    }

    private static function normalizeFallbackNames(array $fallbackNames): array
    {
        return collect($fallbackNames)
            ->filter(fn ($name) => is_string($name) && $name !== '')
            ->values()
            ->all();
    }
}
