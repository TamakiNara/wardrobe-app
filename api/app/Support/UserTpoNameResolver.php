<?php

namespace App\Support;

use App\Models\User;
use App\Models\UserTpo;
use Illuminate\Support\Collection;

class UserTpoNameResolver
{
    public static function buildNameMap(User $user, array $tpoIds = []): Collection
    {
        $ids = self::normalizeIds($tpoIds);

        $query = UserTpo::query()
            ->where('user_id', $user->id);

        if ($ids->isNotEmpty()) {
            $query->whereIn('id', $ids);
        }

        return $query
            ->get()
            ->keyBy('id')
            ->map(fn (UserTpo $tpo) => $tpo->name);
    }

    public static function resolveNames(User $user, array $tpoIds, array $fallbackNames = []): array
    {
        return self::resolveNamesFromMap(
            self::buildNameMap($user, $tpoIds),
            $tpoIds,
            $fallbackNames
        );
    }

    public static function resolveNamesFromMap(Collection $nameById, array $tpoIds, array $fallbackNames = []): array
    {
        $ids = self::normalizeIds($tpoIds);

        if ($ids->isEmpty()) {
            return self::normalizeFallbackNames($fallbackNames);
        }

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

    private static function normalizeIds(array $tpoIds): Collection
    {
        return collect($tpoIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->values();
    }

    private static function normalizeFallbackNames(array $fallbackNames): array
    {
        return collect($fallbackNames)
            ->filter(fn ($name) => is_string($name) && $name !== '')
            ->values()
            ->all();
    }
}
