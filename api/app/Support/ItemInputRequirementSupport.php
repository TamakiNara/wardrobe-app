<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class ItemInputRequirementSupport
{
    private const SHAPE_OPTIONS_BY_SUBCATEGORY = [
        'pants' => [
            'pants' => ['straight', 'tapered', 'wide', 'culottes', 'jogger', 'skinny', 'gaucho'],
            'denim' => ['straight', 'tapered', 'wide', 'culottes', 'jogger', 'skinny', 'gaucho'],
            'slacks' => ['straight', 'tapered', 'wide', 'culottes', 'jogger', 'skinny', 'gaucho'],
            'cargo' => ['straight', 'tapered', 'wide', 'culottes', 'jogger', 'skinny', 'gaucho'],
            'chino' => ['straight', 'tapered', 'wide', 'culottes', 'jogger', 'skinny', 'gaucho'],
            'sweat_jersey' => ['straight', 'tapered', 'wide', 'culottes', 'jogger', 'skinny', 'gaucho'],
            'other' => [],
        ],
        'skirts' => [
            'skirt' => ['tight', 'flare', 'a_line', 'mermaid'],
            'other' => [],
        ],
        'outerwear' => [
            'jacket' => ['jacket', 'tailored', 'no_collar', 'blazer'],
            'coat' => ['coat', 'trench', 'chester', 'stainless'],
            'blouson' => ['blouson'],
            'down_padded' => ['down-padded'],
            'mountain_parka' => ['mountain-parka'],
            'other' => [],
        ],
        'onepiece_dress' => [
            'onepiece' => ['onepiece'],
            'dress' => ['dress'],
            'other' => [],
        ],
        'allinone' => [
            'allinone' => ['allinone'],
            'salopette' => ['salopette'],
            'other' => [],
        ],
        'inner' => [
            'roomwear' => ['roomwear'],
            'underwear' => ['underwear'],
            'pajamas' => ['pajamas'],
            'other' => [],
        ],
        'bags' => [
            'tote' => ['tote'],
            'shoulder' => ['shoulder'],
            'boston' => ['boston'],
            'rucksack' => ['rucksack'],
            'hand' => ['hand'],
            'body' => ['body'],
            'waist_pouch' => ['waist-pouch'],
            'messenger' => ['messenger'],
            'clutch' => ['clutch'],
            'sacoche' => ['sacoche'],
            'pochette' => ['pochette'],
            'drawstring' => ['drawstring'],
            'basket_bag' => ['basket-bag'],
            'briefcase' => ['briefcase'],
            'marche_bag' => ['marche-bag'],
            'other' => [],
        ],
        'fashion_accessories' => [
            'hat' => ['hat'],
            'belt' => ['belt'],
            'scarf_stole' => ['scarf-stole'],
            'gloves' => ['gloves'],
            'jewelry' => ['jewelry'],
            'scarf_bandana' => ['scarf-bandana'],
            'hair_accessory' => ['hair-accessory'],
            'eyewear' => ['eyewear'],
            'watch' => ['watch'],
            'other' => [],
        ],
        'shoes' => [
            'sneakers' => ['sneakers'],
            'pumps' => ['pumps'],
            'boots' => ['short-boots'],
            'sandals' => ['sandals'],
            'leather_shoes' => ['leather-shoes'],
            'rain_shoes_boots' => ['rain-shoes-boots'],
            'other' => [],
        ],
        'legwear' => [
            'socks' => ['socks'],
            'stockings' => ['stockings'],
            'tights' => ['tights'],
            'leggings' => ['leggings'],
            'leg_warmer' => ['leg-warmer'],
            'other' => [],
        ],
        'swimwear' => [
            'swimwear' => ['swimwear'],
            'rashguard' => ['rashguard'],
            'other' => [],
        ],
        'kimono' => [
            'kimono' => ['kimono'],
            'yukata' => ['yukata'],
            'japanese_accessory' => ['japanese-accessory'],
            'other' => [],
        ],
    ];

    private const OPTIONAL_SHAPE_WITH_EMPTY_SUBCATEGORY = [
        'tops',
        'pants',
        'outerwear',
        'onepiece_dress',
        'allinone',
        'inner',
        'skirts',
        'bags',
        'fashion_accessories',
        'shoes',
        'legwear',
        'swimwear',
        'kimono',
    ];

    private const OPTIONAL_SHAPE_WITH_OTHER_SUBCATEGORY = [
        'tops',
        'pants',
        'outerwear',
        'onepiece_dress',
        'allinone',
        'inner',
        'skirts',
        'bags',
        'fashion_accessories',
        'shoes',
        'legwear',
        'swimwear',
        'kimono',
    ];

    private const DEFAULT_SHAPE_BY_SUBCATEGORY = [
        'tops' => [
            'tshirt_cutsew' => 'tshirt',
            'shirt_blouse' => 'shirt',
            'knit_sweater' => 'knit',
            'cardigan' => 'cardigan',
            'polo_shirt' => 'shirt',
            'sweat_trainer' => 'tshirt',
            'hoodie' => 'tshirt',
            'vest_gilet' => 'camisole',
            'camisole' => 'camisole',
            'tanktop' => 'tanktop',
        ],
        'pants' => [
            'pants' => 'pants',
            'denim' => 'pants',
            'slacks' => 'pants',
            'cargo' => 'pants',
            'chino' => 'pants',
            'sweat_jersey' => 'pants',
            'other' => 'pants',
        ],
        'skirts' => [
            'skirt' => 'skirt',
            'other' => 'skirt',
        ],
        'outerwear' => [
            'jacket' => 'jacket',
            'coat' => 'coat',
            'blouson' => 'blouson',
            'down_padded' => 'down-padded',
            'mountain_parka' => 'mountain-parka',
            'other' => 'jacket',
        ],
        'onepiece_dress' => [
            'onepiece' => 'onepiece',
            'dress' => 'dress',
            'other' => 'onepiece',
        ],
        'allinone' => [
            'allinone' => 'allinone',
            'salopette' => 'salopette',
            'other' => 'allinone',
        ],
        'inner' => [
            'roomwear' => 'roomwear',
            'underwear' => 'underwear',
            'pajamas' => 'pajamas',
            'other' => 'roomwear',
        ],
        'bags' => [
            'tote' => 'tote',
            'shoulder' => 'shoulder',
            'boston' => 'boston',
            'rucksack' => 'rucksack',
            'hand' => 'hand',
            'body' => 'body',
            'waist_pouch' => 'waist-pouch',
            'messenger' => 'messenger',
            'clutch' => 'clutch',
            'sacoche' => 'sacoche',
            'pochette' => 'pochette',
            'drawstring' => 'drawstring',
            'basket_bag' => 'basket-bag',
            'briefcase' => 'briefcase',
            'marche_bag' => 'marche-bag',
            'other' => 'bag',
        ],
        'fashion_accessories' => [
            'hat' => 'hat',
            'belt' => 'belt',
            'scarf_stole' => 'scarf-stole',
            'gloves' => 'gloves',
            'jewelry' => 'jewelry',
            'scarf_bandana' => 'scarf-bandana',
            'hair_accessory' => 'hair-accessory',
            'eyewear' => 'eyewear',
            'watch' => 'watch',
            'other' => 'other',
        ],
        'shoes' => [
            'sneakers' => 'sneakers',
            'pumps' => 'pumps',
            'boots' => 'short-boots',
            'sandals' => 'sandals',
            'leather_shoes' => 'leather-shoes',
            'rain_shoes_boots' => 'rain-shoes-boots',
            'other' => 'other',
        ],
        'legwear' => [
            'socks' => 'socks',
            'stockings' => 'stockings',
            'tights' => 'tights',
            'leggings' => 'leggings',
            'leg_warmer' => 'leg-warmer',
            'other' => 'socks',
        ],
        'swimwear' => [
            'swimwear' => 'swimwear',
            'rashguard' => 'rashguard',
            'other' => 'other',
        ],
        'kimono' => [
            'kimono' => 'kimono',
            'yukata' => 'yukata',
            'japanese_accessory' => 'japanese-accessory',
            'other' => 'kimono',
        ],
    ];

    private const FALLBACK_SHAPE_BY_CATEGORY = [
        'tops' => 'tshirt',
        'pants' => 'pants',
        'skirts' => 'skirt',
        'outerwear' => 'jacket',
        'onepiece_dress' => 'onepiece',
        'allinone' => 'allinone',
        'inner' => 'roomwear',
        'bags' => 'bag',
        'fashion_accessories' => 'other',
        'shoes' => 'other',
        'legwear' => 'socks',
        'swimwear' => 'swimwear',
        'kimono' => 'kimono',
    ];

    public static function normalizeShape(mixed $shape): ?string
    {
        if (! is_string($shape)) {
            return null;
        }

        $normalized = trim($shape);

        return $normalized === '' ? null : $normalized;
    }

    public static function shapeOptionsFor(?string $category, ?string $subcategory): array
    {
        if (! is_string($category) || $category === '') {
            return [];
        }

        if (! is_string($subcategory) || $subcategory === '') {
            return [];
        }

        return self::SHAPE_OPTIONS_BY_SUBCATEGORY[$category][$subcategory] ?? [];
    }

    public static function defaultShapeFor(?string $category, ?string $subcategory): ?string
    {
        if (! is_string($category) || $category === '') {
            return null;
        }

        if (! is_string($subcategory) || $subcategory === '') {
            return null;
        }

        return self::DEFAULT_SHAPE_BY_SUBCATEGORY[$category][$subcategory] ?? null;
    }

    public static function fallbackShapeFor(?string $category): ?string
    {
        if (! is_string($category) || $category === '') {
            return null;
        }

        return self::FALLBACK_SHAPE_BY_CATEGORY[$category] ?? null;
    }

    public static function isRequired(?string $category, ?string $subcategory): bool
    {
        if (! is_string($category) || $category === '') {
            return false;
        }

        if ($subcategory === null || $subcategory === '') {
            return ! in_array($category, self::OPTIONAL_SHAPE_WITH_EMPTY_SUBCATEGORY, true);
        }

        if (
            $subcategory === 'other' &&
            in_array($category, self::OPTIONAL_SHAPE_WITH_OTHER_SUBCATEGORY, true)
        ) {
            return false;
        }

        return count(self::shapeOptionsFor($category, $subcategory)) > 1;
    }

    public static function resolveForSave(?string $category, ?string $subcategory, mixed $shape): ?string
    {
        $normalizedShape = self::normalizeShape($shape);

        if ($normalizedShape !== null) {
            return $normalizedShape;
        }

        if (self::isRequired($category, $subcategory)) {
            return null;
        }

        // 一時対応: tops + other の未指定 shape は、null 許容化まで空文字で保存する。
        if ($category === 'tops' && $subcategory === 'other') {
            return '';
        }

        return self::defaultShapeFor($category, $subcategory) ?? self::fallbackShapeFor($category);
    }

    public static function validate(array $validated): void
    {
        $category = is_string($validated['category'] ?? null) ? $validated['category'] : null;
        $subcategory = ItemSubcategorySupport::normalize($category, $validated['subcategory'] ?? null);
        $resolvedShape = self::resolveForSave($category, $subcategory, $validated['shape'] ?? null);

        if (self::isRequired($category, $subcategory) && $resolvedShape === null) {
            throw ValidationException::withMessages([
                'shape' => '形を選択してください。',
            ]);
        }
    }
}
