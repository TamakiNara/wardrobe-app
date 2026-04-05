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
                'tshirt' => 'tops_tshirt_cutsew',
                'shirt' => 'tops_shirt_blouse',
                'blouse' => 'tops_shirt_blouse',
                'knit' => 'tops_knit_sweater',
                'cardigan' => 'tops_cardigan',
                'camisole' => 'tops_camisole',
                'tanktop' => 'tops_tanktop',
                'jacket' => 'tops_other',
            ],
            'bottoms' => [
                'tapered' => 'pants_pants',
                'wide' => 'pants_pants',
                'straight' => 'pants_pants',
                'mini-skirt' => 'skirts_skirt',
                'tight-skirt' => 'skirts_skirt',
                'a-line-skirt' => 'skirts_skirt',
                'flare-skirt' => 'skirts_skirt',
            ],
            'outer' => [
                'tailored' => 'outerwear_jacket',
                'trench' => 'outerwear_coat',
                'chester' => 'outerwear_coat',
                'down' => 'outerwear_down_padded',
                'outer-cardigan' => 'outerwear_blouson',
            ],
            'onepiece_allinone' => [
                'onepiece' => 'onepiece_dress_onepiece',
                'allinone' => 'allinone_allinone',
            ],
            'inner' => [
                'roomwear' => 'roomwear_inner_roomwear',
                'underwear' => 'roomwear_inner_underwear',
                'pajamas' => 'roomwear_inner_pajamas',
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
            'bags' => [
                'bag' => 'bags_bag',
                'tote' => 'bags_bag',
                'shoulder' => 'bags_bag',
                'backpack' => 'bags_bag',
                'clutch' => 'bags_bag',
            ],
            'fashion_accessories' => [
                'hat' => 'fashion_accessories_hat',
                'belt' => 'fashion_accessories_belt',
                'scarf-stole' => 'fashion_accessories_scarf_stole',
                'gloves' => 'fashion_accessories_gloves',
                'jewelry' => 'fashion_accessories_jewelry',
                'wallet-case' => 'fashion_accessories_wallet_case',
                'hair-accessory' => 'fashion_accessories_hair',
                'eyewear' => 'fashion_accessories_eyewear',
                'watch' => 'fashion_accessories_watch',
                'other' => 'fashion_accessories_other',
            ],
            'swimwear' => [
                'swimwear' => 'swimwear_swimwear',
                'rashguard' => 'swimwear_rashguard',
                'other' => 'swimwear_other',
            ],
            'kimono' => [
                'kimono' => 'kimono_kimono',
                'other' => 'kimono_other',
            ],
            'accessories' => [
                'tote' => 'bags_bag',
                'shoulder' => 'bags_bag',
                'backpack' => 'bags_bag',
                'hat' => 'fashion_accessories_hat',
                'accessory' => 'fashion_accessories_other',
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
