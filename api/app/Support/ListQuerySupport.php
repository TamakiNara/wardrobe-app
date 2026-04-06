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
            'pants' => [
                'pants' => 'pants_pants',
                'denim' => 'pants_denim',
                'slacks' => 'pants_slacks',
                'short-pants' => 'pants_pants',
                'other' => 'pants_other',
                'straight' => 'pants_pants',
                'tapered' => 'pants_pants',
                'wide' => 'pants_pants',
                'culottes' => 'pants_pants',
            ],
            'skirts' => [
                'skirt' => 'skirts_skirt',
                'other' => 'skirts_other',
                'tight' => 'skirts_skirt',
                'flare' => 'skirts_skirt',
                'a_line' => 'skirts_skirt',
                'pleated' => 'skirts_skirt',
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
            'outerwear' => [
                'jacket' => 'outerwear_jacket',
                'tailored' => 'outerwear_jacket',
                'no_collar' => 'outerwear_jacket',
                'blouson' => 'outerwear_blouson',
                'down-padded' => 'outerwear_down_padded',
                'coat' => 'outerwear_coat',
                'trench' => 'outerwear_coat',
                'chester' => 'outerwear_coat',
                'stainless' => 'outerwear_coat',
                'mountain-parka' => 'outerwear_mountain_parka',
                'other' => 'outerwear_other',
            ],
            'outer' => [
                'tailored' => 'outerwear_jacket',
                'trench' => 'outerwear_coat',
                'chester' => 'outerwear_coat',
                'down' => 'outerwear_down_padded',
                'outer-cardigan' => 'outerwear_blouson',
            ],
            'onepiece_dress' => [
                'onepiece' => 'onepiece_dress_onepiece',
                'dress' => 'onepiece_dress_dress',
                'other' => 'onepiece_dress_other',
            ],
            'allinone' => [
                'allinone' => 'allinone_allinone',
                'salopette' => 'allinone_salopette',
                'other' => 'allinone_other',
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
                'other' => 'shoes_other',
            ],
            'bags' => [
                'bag' => 'bags_other',
                'tote' => 'bags_tote',
                'shoulder' => 'bags_shoulder',
                'backpack' => 'bags_backpack',
                'hand' => 'bags_hand',
                'clutch' => 'bags_clutch',
                'body' => 'bags_body',
                'other' => 'bags_other',
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
                'tote' => 'bags_tote',
                'shoulder' => 'bags_shoulder',
                'backpack' => 'bags_backpack',
                'hand' => 'bags_hand',
                'clutch' => 'bags_clutch',
                'body' => 'bags_body',
                'hat' => 'fashion_accessories_hat',
                'belt' => 'fashion_accessories_belt',
                'scarf-stole' => 'fashion_accessories_scarf_stole',
                'gloves' => 'fashion_accessories_gloves',
                'jewelry' => 'fashion_accessories_jewelry',
                'wallet-case' => 'fashion_accessories_wallet_case',
                'hair-accessory' => 'fashion_accessories_hair',
                'eyewear' => 'fashion_accessories_eyewear',
                'watch' => 'fashion_accessories_watch',
                'accessory' => 'fashion_accessories_other',
                'other' => 'fashion_accessories_other',
            ],
        ];
    }

    public static function itemVisibleCategoryIdBySubcategoryMap(): array
    {
        return [
            'legwear' => [
                'socks' => 'legwear_socks',
                'stockings' => 'legwear_stockings',
                'tights' => 'legwear_tights',
                'leggings' => 'legwear_leggings',
                'other' => 'legwear_other',
            ],
            'inner' => [
                'roomwear' => 'roomwear_inner_roomwear',
                'underwear' => 'roomwear_inner_underwear',
                'pajamas' => 'roomwear_inner_pajamas',
                'other' => 'roomwear_inner_other',
            ],
        ];
    }

    /**
     * @return array<string, array<int, array{category: string, shape?: string, subcategory?: string, subcategory_null?: bool}>>
     */
    public static function itemVisibleCategoryQueryMap(): array
    {
        $queryMap = [];

        foreach (self::itemVisibleCategoryMap() as $category => $shapeMap) {
            foreach ($shapeMap as $shape => $visibleCategoryId) {
                $queryMap[$visibleCategoryId] ??= [];
                $queryMap[$visibleCategoryId][] = [
                    'category' => $category,
                    'shape' => $shape,
                ];
            }
        }

        $queryMap['legwear_socks'] = [
            ['category' => 'legwear', 'subcategory' => 'socks'],
            ['category' => 'legwear', 'shape' => 'socks', 'subcategory_null' => true],
        ];
        $queryMap['legwear_stockings'] = [
            ['category' => 'legwear', 'subcategory' => 'stockings'],
            ['category' => 'legwear', 'shape' => 'stockings', 'subcategory_null' => true],
        ];
        $queryMap['legwear_tights'] = [
            ['category' => 'legwear', 'subcategory' => 'tights'],
            ['category' => 'legwear', 'shape' => 'tights', 'subcategory_null' => true],
        ];
        $queryMap['legwear_leggings'] = [
            ['category' => 'legwear', 'subcategory' => 'leggings'],
            ['category' => 'legwear', 'shape' => 'leggings', 'subcategory_null' => true],
        ];
        $queryMap['legwear_other'] = [
            ['category' => 'legwear', 'subcategory' => 'other'],
        ];
        $queryMap['roomwear_inner_roomwear'] = [
            ['category' => 'inner', 'subcategory' => 'roomwear'],
            ['category' => 'inner', 'shape' => 'roomwear', 'subcategory_null' => true],
        ];
        $queryMap['roomwear_inner_underwear'] = [
            ['category' => 'inner', 'subcategory' => 'underwear'],
            ['category' => 'inner', 'shape' => 'underwear', 'subcategory_null' => true],
        ];
        $queryMap['roomwear_inner_pajamas'] = [
            ['category' => 'inner', 'subcategory' => 'pajamas'],
            ['category' => 'inner', 'shape' => 'pajamas', 'subcategory_null' => true],
        ];
        $queryMap['roomwear_inner_other'] = [
            ['category' => 'inner', 'subcategory' => 'other'],
        ];

        return $queryMap;
    }

    /**
     * @return array<int, array{category: string, shape?: string, subcategory?: string, subcategory_null?: bool}>
     */
    public static function resolveHiddenItemCategoryShapePairs(Collection $visibleCategoryIds): array
    {
        return collect(self::itemVisibleCategoryQueryMap())
            ->reject(fn (array $_constraints, string $visibleCategoryId) => $visibleCategoryIds->contains($visibleCategoryId))
            ->flatMap(fn (array $constraints) => $constraints)
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
                    $nested->where('category', $pair['category']);

                    if (array_key_exists('subcategory', $pair)) {
                        $nested->where('subcategory', $pair['subcategory']);
                    }

                    if (($pair['subcategory_null'] ?? false) === true) {
                        $nested->whereNull('subcategory');
                    }

                    if (array_key_exists('shape', $pair)) {
                        $nested->where('shape', $pair['shape']);
                    }
                });
            }
        });
    }

    public static function resolveCurrentItemCategoryValue(?string $category, ?string $shape): ?string
    {
        $map = self::itemVisibleCategoryMap();

        if (! $category) {
            return null;
        }

        return match ($category) {
            'outer', 'outerwear' => 'outerwear',
            'onepiece_dress' => 'onepiece_dress',
            'allinone' => 'allinone',
            'onepiece_allinone' => match ($shape) {
                'onepiece' => 'onepiece_dress',
                'allinone' => 'allinone',
                default => 'onepiece_dress',
            },
            'pants', 'skirts' => $category,
            'bottoms' => match ($shape) {
                'tapered', 'wide', 'straight' => 'pants',
                'mini-skirt', 'tight-skirt', 'a-line-skirt', 'flare-skirt' => 'skirts',
                default => 'pants',
            },
            'accessories' => match ($shape) {
                'tote', 'shoulder', 'backpack', 'hand', 'clutch', 'body' => 'bags',
                default => 'fashion_accessories',
            },
            default => array_key_exists($category, $map) ? $category : null,
        };
    }

    /**
     * @return array<int, array{category: string, shapes?: array<int, string>}>
     */
    public static function itemCategoryFilterMap(string $category): array
    {
        return match ($category) {
            'outerwear' => [
                ['category' => 'outerwear'],
                ['category' => 'outer'],
            ],
            'pants' => [
                ['category' => 'pants'],
                ['category' => 'bottoms', 'shapes' => ['tapered', 'wide', 'straight']],
            ],
            'skirts' => [
                ['category' => 'skirts'],
                ['category' => 'bottoms', 'shapes' => ['mini-skirt', 'tight-skirt', 'a-line-skirt', 'flare-skirt']],
            ],
            'onepiece_dress' => [
                ['category' => 'onepiece_dress'],
                ['category' => 'onepiece_allinone', 'shapes' => ['onepiece']],
            ],
            'allinone' => [
                ['category' => 'allinone'],
                ['category' => 'onepiece_allinone', 'shapes' => ['allinone']],
            ],
            'bags' => [
                ['category' => 'bags'],
                ['category' => 'accessories', 'shapes' => ['tote', 'shoulder', 'backpack', 'hand', 'clutch', 'body']],
            ],
            'fashion_accessories' => [
                ['category' => 'fashion_accessories'],
                ['category' => 'accessories', 'shapes' => ['hat', 'belt', 'scarf-stole', 'gloves', 'jewelry', 'wallet-case', 'hair-accessory', 'eyewear', 'watch', 'accessory', 'other']],
            ],
            default => [
                ['category' => $category],
            ],
        };
    }

    private static function resolveVisibleCategoryIdForItem(Item $item): ?string
    {
        $category = is_string($item->category) ? $item->category : null;
        $subcategory = is_string($item->subcategory) ? $item->subcategory : null;
        $shape = is_string($item->shape) ? $item->shape : null;

        if (! $category) {
            return null;
        }

        $subcategoryMap = self::itemVisibleCategoryIdBySubcategoryMap();
        if ($subcategory && isset($subcategoryMap[$category][$subcategory])) {
            return $subcategoryMap[$category][$subcategory];
        }

        if (! $shape) {
            return null;
        }

        $shapeMap = self::itemVisibleCategoryMap();

        return $shapeMap[$category][$shape] ?? null;
    }
}
