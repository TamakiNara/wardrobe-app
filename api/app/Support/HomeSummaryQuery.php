<?php

namespace App\Support;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\PurchaseCandidate;
use App\Models\User;
use App\Models\WearLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class HomeSummaryQuery
{
    public static function build(User $user): array
    {
        return [
            'summary' => [
                'itemsCount' => self::countVisibleActiveItems($user),
                'outfitsCount' => Outfit::query()
                    ->where('user_id', $user->id)
                    ->where('status', 'active')
                    ->count(),
                'wearLogsCount' => WearLog::query()
                    ->where('user_id', $user->id)
                    ->count(),
                'purchaseCandidatesCount' => PurchaseCandidate::query()
                    ->where('user_id', $user->id)
                    ->count(),
            ],
        ];
    }

    private static function countVisibleActiveItems(User $user): int
    {
        $visibleCategoryIdsRaw = $user->visible_category_ids;
        $visibleCategoryIds = is_array($visibleCategoryIdsRaw)
            ? collect($visibleCategoryIdsRaw)->values()
            : null;

        $query = Item::query()
            ->where('user_id', $user->id)
            ->where('status', 'active');

        if ($visibleCategoryIds === null) {
            return $query->count();
        }

        $hiddenPairs = self::resolveHiddenItemCategoryShapePairs($visibleCategoryIds);
        if ($hiddenPairs === []) {
            return $query->count();
        }

        $query->whereNot(function (Builder $builder) use ($hiddenPairs) {
            foreach ($hiddenPairs as $pair) {
                $builder->orWhere(function (Builder $nested) use ($pair) {
                    $nested
                        ->where('category', $pair['category'])
                        ->where('shape', $pair['shape']);
                });
            }
        });

        return $query->count();
    }

    /**
     * @return array<int, array{category: string, shape: string}>
     */
    private static function resolveHiddenItemCategoryShapePairs(Collection $visibleCategoryIds): array
    {
        $map = ListQuerySupport::itemVisibleCategoryMap();

        return collect($map)
            ->flatMap(
                fn (array $shapeMap, string $category) => collect($shapeMap)->map(
                    fn (string $visibleCategoryId, string $shape) => [
                        'category' => $category,
                        'shape' => $shape,
                        'visibleCategoryId' => $visibleCategoryId,
                    ]
                )
            )
            ->reject(
                fn (array $pair) => $visibleCategoryIds->contains($pair['visibleCategoryId'])
            )
            ->map(
                fn (array $pair) => [
                    'category' => $pair['category'],
                    'shape' => $pair['shape'],
                ]
            )
            ->values()
            ->all();
    }
}
