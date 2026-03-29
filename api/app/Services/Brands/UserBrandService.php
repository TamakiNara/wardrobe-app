<?php

namespace App\Services\Brands;

use App\Models\User;
use App\Models\UserBrand;
use App\Support\BrandNormalizer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;

class UserBrandService
{
    public function list(User $user, array $filters = []): array
    {
        $activeOnly = filter_var($filters['active_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $keyword = trim((string) ($filters['keyword'] ?? ''));
        $normalizedKeyword = $keyword !== '' ? BrandNormalizer::normalizeName($keyword) : null;
        $normalizedKanaKeyword = $keyword !== '' ? BrandNormalizer::normalizeKana($keyword) : null;

        return UserBrand::query()
            ->where('user_id', $user->id)
            ->when($activeOnly, fn (Builder $query) => $query->where('is_active', true))
            ->when($keyword !== '', function (Builder $query) use ($keyword, $normalizedKeyword, $normalizedKanaKeyword) {
                $query->where(function (Builder $inner) use ($keyword, $normalizedKeyword, $normalizedKanaKeyword) {
                    $inner->where('name', 'like', $keyword.'%');

                    if ($normalizedKeyword !== null) {
                        $inner->orWhere('normalized_name', 'like', $normalizedKeyword.'%');
                    }

                    if ($normalizedKanaKeyword !== null) {
                        $inner->orWhere('kana', 'like', $keyword.'%')
                            ->orWhere('normalized_kana', 'like', $normalizedKanaKeyword.'%');
                    }
                });
            })
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get()
            ->all();
    }

    public function create(User $user, array $validated): UserBrand
    {
        [$normalizedName, $normalizedKana] = $this->normalizeValidated($validated);
        $this->ensureNoDuplicate($user, $normalizedName, $normalizedKana);

        return UserBrand::query()->create([
            'user_id' => $user->id,
            'name' => trim($validated['name']),
            'kana' => $this->cleanNullableString($validated['kana'] ?? null),
            'normalized_name' => $normalizedName,
            'normalized_kana' => $normalizedKana,
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);
    }

    public function update(User $user, int $brandId, array $validated): UserBrand
    {
        $brand = $this->findOwnedBrand($user, $brandId);

        $nextName = array_key_exists('name', $validated)
            ? trim((string) $validated['name'])
            : $brand->name;
        $nextKana = array_key_exists('kana', $validated)
            ? $this->cleanNullableString($validated['kana'])
            : $brand->kana;

        $normalizedName = BrandNormalizer::normalizeName($nextName);
        $normalizedKana = BrandNormalizer::normalizeKana($nextKana);

        $this->ensureNoDuplicate($user, $normalizedName, $normalizedKana, $brand->id);

        $brand->update([
            'name' => $nextName,
            'kana' => $nextKana,
            'normalized_name' => $normalizedName,
            'normalized_kana' => $normalizedKana,
            'is_active' => array_key_exists('is_active', $validated)
                ? (bool) $validated['is_active']
                : $brand->is_active,
        ]);

        return $brand->fresh();
    }

    public function saveBrandFromItem(User $user, ?string $brandName, bool $saveBrandAsCandidate): void
    {
        if (! $saveBrandAsCandidate) {
            return;
        }

        $name = $this->cleanNullableString($brandName);

        if ($name === null) {
            return;
        }

        $normalizedName = BrandNormalizer::normalizeName($name);

        if ($this->hasDuplicate($user, $normalizedName, null)) {
            return;
        }

        try {
            UserBrand::query()->create([
                'user_id' => $user->id,
                'name' => $name,
                'kana' => null,
                'normalized_name' => $normalizedName,
                'normalized_kana' => null,
                'is_active' => true,
            ]);
        } catch (QueryException) {
            // 重複時は item 保存を失敗させない
        }
    }

    public function findOwnedBrand(User $user, int $brandId): UserBrand
    {
        return UserBrand::query()
            ->where('user_id', $user->id)
            ->findOrFail($brandId);
    }

    private function normalizeValidated(array $validated): array
    {
        $normalizedName = BrandNormalizer::normalizeName((string) $validated['name']);
        $normalizedKana = BrandNormalizer::normalizeKana($validated['kana'] ?? null);

        return [$normalizedName, $normalizedKana];
    }

    private function ensureNoDuplicate(User $user, string $normalizedName, ?string $normalizedKana, ?int $ignoreId = null): void
    {
        if ($this->hasDuplicate($user, $normalizedName, null, $ignoreId)) {
            throw ValidationException::withMessages([
                'name' => '同じブランド候補がすでに存在します。',
            ]);
        }

        if ($normalizedKana !== null && $this->hasDuplicate($user, null, $normalizedKana, $ignoreId)) {
            throw ValidationException::withMessages([
                'kana' => '同じ読み仮名のブランド候補がすでに存在します。',
            ]);
        }
    }

    private function hasDuplicate(User $user, ?string $normalizedName, ?string $normalizedKana, ?int $ignoreId = null): bool
    {
        return UserBrand::query()
            ->where('user_id', $user->id)
            ->when($ignoreId !== null, fn (Builder $query) => $query->where('id', '!=', $ignoreId))
            ->where(function (Builder $query) use ($normalizedName, $normalizedKana) {
                if ($normalizedName !== null) {
                    $query->where('normalized_name', $normalizedName);
                }

                if ($normalizedKana !== null) {
                    if ($normalizedName !== null) {
                        $query->orWhere('normalized_kana', $normalizedKana);
                    } else {
                        $query->where('normalized_kana', $normalizedKana);
                    }
                }
            })
            ->exists();
    }

    private function cleanNullableString(?string $value): ?string
    {
        $trimmed = trim((string) ($value ?? ''));

        return $trimmed === '' ? null : $trimmed;
    }
}
