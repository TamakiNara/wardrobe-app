<?php

namespace App\Services\Settings;

use App\Models\User;
use App\Models\UserTpo;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserTpoService
{
    private const PRESET_NAMES = ['仕事', '休日', 'フォーマル'];

    public function ensurePresets(User $user): Collection
    {
        return DB::transaction(function () use ($user) {
            $existingTpos = UserTpo::query()
                ->where('user_id', $user->id)
                ->get()
                ->keyBy('name');

            foreach (self::PRESET_NAMES as $presetName) {
                $existingTpo = $existingTpos->get($presetName);

                if ($existingTpo === null || $existingTpo->is_preset) {
                    continue;
                }

                $existingTpo->forceFill([
                    'is_preset' => true,
                ])->save();
            }

            $existingPresetNames = UserTpo::query()
                ->where('user_id', $user->id)
                ->pluck('name')
                ->all();

            $missingPresetNames = array_values(array_diff(self::PRESET_NAMES, $existingPresetNames));

            if ($missingPresetNames !== []) {
                $nextSortOrder = (int) UserTpo::query()
                    ->where('user_id', $user->id)
                    ->max('sort_order');

                foreach ($missingPresetNames as $name) {
                    $nextSortOrder++;

                    UserTpo::query()->create([
                        'user_id' => $user->id,
                        'name' => $name,
                        'sort_order' => $nextSortOrder,
                        'is_active' => true,
                        'is_preset' => true,
                    ]);
                }
            }

            return $this->list($user);
        });
    }

    public function list(User $user, bool $activeOnly = false): Collection
    {
        $this->ensurePresetsIfMissing($user);

        return UserTpo::query()
            ->where('user_id', $user->id)
            ->when($activeOnly, fn ($query) => $query->where('is_active', true))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function create(User $user, array $validated): UserTpo
    {
        $this->ensurePresetsIfMissing($user);

        $name = $this->normalizeName($validated['name']);
        $this->ensureNameUnique($user, $name);

        $nextSortOrder = (int) UserTpo::query()
            ->where('user_id', $user->id)
            ->max('sort_order');

        return UserTpo::query()->create([
            'user_id' => $user->id,
            'name' => $name,
            'sort_order' => $nextSortOrder + 1,
            'is_active' => true,
            'is_preset' => false,
        ]);
    }

    public function update(User $user, int $tpoId, array $validated): UserTpo
    {
        $this->ensurePresetsIfMissing($user);

        $tpo = $this->findOwnedTpo($user, $tpoId);

        if (array_key_exists('name', $validated) && $tpo->is_preset) {
            throw ValidationException::withMessages([
                'name' => 'プリセット TPO の名称は変更できません。',
            ]);
        }

        $nextName = array_key_exists('name', $validated)
            ? $this->normalizeName($validated['name'])
            : $tpo->name;

        $this->ensureNameUnique($user, $nextName, $tpo->id);

        $nextSortOrder = array_key_exists('sortOrder', $validated)
            ? (int) $validated['sortOrder']
            : $tpo->sort_order;

        DB::transaction(function () use ($user, $tpo, $validated, $nextName, $nextSortOrder) {
            if ($nextSortOrder !== $tpo->sort_order) {
                $this->moveSortOrder($user, $tpo, $nextSortOrder);
                $tpo->refresh();
            }

            $tpo->update([
                'name' => $nextName,
                'is_active' => array_key_exists('isActive', $validated)
                    ? (bool) $validated['isActive']
                    : $tpo->is_active,
            ]);
        });

        return $tpo->fresh();
    }

    public function resolvePersistableIds(User $user, array $submittedIds, array $currentIds = []): array
    {
        $this->ensurePresetsIfMissing($user);

        $normalizedIds = collect($submittedIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->values();

        if ($normalizedIds->isEmpty()) {
            return [];
        }

        $tpos = UserTpo::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $normalizedIds)
            ->get()
            ->keyBy('id');

        if ($tpos->count() !== $normalizedIds->unique()->count()) {
            throw ValidationException::withMessages([
                'tpo_ids' => '無効な TPO が含まれています。',
            ]);
        }

        $currentIdSet = collect($currentIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->flip();

        foreach ($normalizedIds as $id) {
            $tpo = $tpos->get($id);

            if ($tpo === null) {
                continue;
            }

            if (! $tpo->is_active && ! $currentIdSet->has($id)) {
                throw ValidationException::withMessages([
                    'tpo_ids' => '無効化された TPO は新しく選択できません。',
                ]);
            }
        }

        return $normalizedIds
            ->unique()
            ->values()
            ->all();
    }

    public function resolveIdsFromNames(User $user, array $submittedNames): array
    {
        $this->ensurePresetsIfMissing($user);

        $normalizedNames = collect($submittedNames)
            ->map(fn ($name) => is_string($name) ? trim($name) : '')
            ->filter(fn ($name) => $name !== '')
            ->values();

        if ($normalizedNames->isEmpty()) {
            return [];
        }

        $tpoIds = UserTpo::query()
            ->where('user_id', $user->id)
            ->whereIn('name', $normalizedNames)
            ->pluck('id', 'name');

        return $normalizedNames
            ->map(fn ($name) => $tpoIds->get($name))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    public function findOwnedTpo(User $user, int $tpoId): UserTpo
    {
        return UserTpo::query()
            ->where('user_id', $user->id)
            ->findOrFail($tpoId);
    }

    private function ensurePresetsIfMissing(User $user): void
    {
        $existingPresetNames = UserTpo::query()
            ->where('user_id', $user->id)
            ->pluck('name')
            ->all();

        $missingPresetNames = array_diff(self::PRESET_NAMES, $existingPresetNames);

        if ($missingPresetNames === []) {
            return;
        }

        $this->ensurePresets($user);
    }

    private function ensureNameUnique(User $user, string $name, ?int $ignoreId = null): void
    {
        $exists = UserTpo::query()
            ->where('user_id', $user->id)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name, 'UTF-8')])
            ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'name' => '同じ TPO がすでに存在します。',
            ]);
        }
    }

    private function moveSortOrder(User $user, UserTpo $target, int $nextSortOrder): void
    {
        $ordered = UserTpo::query()
            ->where('user_id', $user->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->reject(fn (UserTpo $tpo) => $tpo->id === $target->id)
            ->values();

        $insertIndex = max(0, min($nextSortOrder - 1, $ordered->count()));
        $ordered->splice($insertIndex, 0, [$target]);

        foreach ($ordered->values() as $index => $tpo) {
            $temporarySortOrder = $ordered->count() + $index + 1;

            if ($tpo->sort_order === $temporarySortOrder) {
                continue;
            }

            $tpo->forceFill([
                'sort_order' => $temporarySortOrder,
            ])->save();
        }

        foreach ($ordered->values() as $index => $tpo) {
            if ($tpo->sort_order === $index + 1) {
                continue;
            }

            $tpo->forceFill([
                'sort_order' => $index + 1,
            ])->save();
        }
    }

    private function normalizeName(string $name): string
    {
        $normalized = trim($name);

        if ($normalized === '') {
            throw ValidationException::withMessages([
                'name' => 'TPO 名を入力してください。',
            ]);
        }

        return $normalized;
    }
}
