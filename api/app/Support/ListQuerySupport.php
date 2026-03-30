<?php

namespace App\Support;

use App\Models\Item;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ListQuerySupport
{
    public const PAGE_SIZE = 12;

    public static function normalizePage(mixed $value): int
    {
        if (! is_numeric($value)) {
            return 1;
        }

        $page = (int) $value;

        return $page > 0 ? $page : 1;
    }

    public static function buildOrderedOptions(array $values, array $masterOptions): array
    {
        $uniqueValues = collect($values)
            ->filter(fn (mixed $value) => is_string($value) && $value !== '')
            ->unique()
            ->values();

        $knownOptions = collect($masterOptions)
            ->filter(fn (string $option) => $uniqueValues->contains($option))
            ->values();

        $unknownOptions = $uniqueValues
            ->reject(fn (string $value) => in_array($value, $masterOptions, true))
            ->sort(fn (string $left, string $right) => strcoll($left, $right))
            ->values();

        return $knownOptions
            ->concat($unknownOptions)
            ->values()
            ->all();
    }

    public static function paginate(Collection $entries, int $page, int $perPage = self::PAGE_SIZE): array
    {
        $total = $entries->count();
        $lastPage = max((int) ceil($total / $perPage), 1);
        $currentPage = min($page, $lastPage);
        $offset = ($currentPage - 1) * $perPage;

        return [
            'items' => $entries->slice($offset, $perPage)->values(),
            'total' => $total,
            'page' => $currentPage,
            'lastPage' => $lastPage,
        ];
    }

    public static function isItemVisibleForList(Item $item, ?Collection $visibleCategoryIds): bool
    {
        if ($visibleCategoryIds === null) {
            return true;
        }

        $resolvedCategoryId = self::resolveVisibleCategoryIdForItem($item);
        if ($resolvedCategoryId === null) {
            return true;
        }

        return $visibleCategoryIds->contains($resolvedCategoryId);
    }

    public static function itemVisibleCategoryMap(): array
    {
        return [
            'tops' => [
                'tshirt' => 'tops_tshirt',
                'shirt' => 'tops_shirt',
                'blouse' => 'tops_shirt',
                'knit' => 'tops_knit',
                'cardigan' => 'tops_cardigan',
                'camisole' => 'tops_vest',
                'tanktop' => 'tops_vest',
                'jacket' => 'tops_vest',
            ],
            'bottoms' => [
                'tapered' => 'bottoms_pants',
                'wide' => 'bottoms_pants',
                'straight' => 'bottoms_pants',
                'tight-skirt' => 'bottoms_skirt',
                'a-line-skirt' => 'bottoms_skirt',
            ],
            'outer' => [
                'tailored' => 'outer_jacket',
                'trench' => 'outer_coat',
                'chester' => 'outer_coat',
                'down' => 'outer_down',
                'outer-cardigan' => 'outer_other',
            ],
            'onepiece_allinone' => [
                'onepiece' => 'onepiece',
                'allinone' => 'allinone',
            ],
            'inner' => [
                'roomwear' => 'inner_roomwear',
                'underwear' => 'inner_underwear',
                'pajamas' => 'inner_pajamas',
            ],
            'legwear' => [
                'socks' => 'legwear_socks',
                'stockings' => 'legwear_stockings',
                'tights' => 'legwear_tights',
                'leggings' => 'legwear_leggings',
            ],
            'shoes' => [
                'sneakers' => 'shoes_sneakers',
                'pumps' => 'shoes_pumps',
                'short-boots' => 'shoes_boots',
                'sandals' => 'shoes_sandals',
            ],
            'accessories' => [
                'tote' => 'bags_tote',
                'shoulder' => 'bags_shoulder',
                'backpack' => 'bags_backpack',
                'hat' => 'accessories_hat',
                'accessory' => 'accessories_jewelry',
            ],
        ];
    }

    /**
     * @return array<int, array{category: string, shape: string}>
     */
    public static function resolveHiddenItemCategoryShapePairs(Collection $visibleCategoryIds): array
    {
        $map = self::itemVisibleCategoryMap();

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

    public static function applyVisibleItemFilter(Builder $query, ?Collection $visibleCategoryIds): Builder
    {
        if ($visibleCategoryIds === null) {
            return $query;
        }

        $hiddenPairs = self::resolveHiddenItemCategoryShapePairs($visibleCategoryIds);
        if ($hiddenPairs === []) {
            return $query;
        }

        return $query->whereNot(function (Builder $builder) use ($hiddenPairs) {
            foreach ($hiddenPairs as $pair) {
                $builder->orWhere(function (Builder $nested) use ($pair) {
                    $nested
                        ->where('category', $pair['category'])
                        ->where('shape', $pair['shape']);
                });
            }
        });
    }

    private static function resolveVisibleCategoryIdForItem(Item $item): ?string
    {
        $map = self::itemVisibleCategoryMap();

        $category = is_string($item->category) ? $item->category : null;
        $shape = is_string($item->shape) ? $item->shape : null;

        if (! $category || ! $shape) {
            return null;
        }

        return $map[$category][$shape] ?? null;
    }
}
