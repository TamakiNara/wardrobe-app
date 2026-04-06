<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class ItemInputRequirementSupport
{
    private const SHAPE_OPTIONS_BY_SUBCATEGORY = [
        'pants' => [
            'pants' => ['straight', 'tapered', 'wide', 'culottes'],
            'denim' => ['straight', 'tapered', 'wide', 'culottes'],
            'slacks' => ['straight', 'tapered', 'wide', 'culottes'],
            'cargo' => ['straight', 'tapered', 'wide', 'culottes'],
            'chino' => ['straight', 'tapered', 'wide', 'culottes'],
            'sweat_jersey' => ['straight', 'tapered', 'wide', 'culottes'],
            'other' => ['pants', 'straight', 'tapered', 'wide', 'culottes'],
        ],
        'skirts' => [
            'skirt' => ['tight', 'flare', 'a_line', 'pleated'],
            'other' => ['skirt', 'tight', 'flare', 'a_line', 'pleated'],
        ],
        'outerwear' => [
            'jacket' => ['jacket', 'tailored', 'no_collar'],
            'coat' => ['coat', 'trench', 'chester', 'stainless'],
            'blouson' => ['blouson'],
            'down_padded' => ['down-padded'],
            'mountain_parka' => ['mountain-parka'],
            'other' => ['jacket', 'tailored', 'no_collar', 'blouson', 'down-padded', 'coat', 'trench', 'chester', 'stainless', 'mountain-parka'],
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
        'bags' => [
            'tote' => ['tote'],
            'shoulder' => ['shoulder'],
            'backpack' => ['backpack'],
            'hand' => ['hand'],
            'clutch' => ['clutch'],
            'body' => ['body'],
            'other' => [],
        ],
        'fashion_accessories' => [
            'hat' => ['hat'],
            'belt' => ['belt'],
            'scarf_stole' => ['scarf-stole'],
            'gloves' => ['gloves'],
            'jewelry' => ['jewelry'],
            'wallet_case' => ['wallet-case'],
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
            'other' => [],
        ],
        'kimono' => [
            'kimono' => ['kimono'],
            'other' => [],
        ],
    ];

    private const OPTIONAL_SHAPE_WITH_EMPTY_SUBCATEGORY = [
        'tops',
        'pants',
        'outerwear',
        'onepiece_dress',
        'allinone',
        'skirts',
        'bags',
        'fashion_accessories',
        'shoes',
        'kimono',
    ];

    private const OPTIONAL_SHAPE_WITH_OTHER_SUBCATEGORY = [
        'tops',
        'pants',
        'outerwear',
        'onepiece_dress',
        'allinone',
        'skirts',
        'bags',
        'fashion_accessories',
        'shoes',
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
            'other' => 'tshirt',
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
        'bags' => [
            'tote' => 'tote',
            'shoulder' => 'shoulder',
            'backpack' => 'backpack',
            'hand' => 'hand',
            'clutch' => 'clutch',
            'body' => 'body',
            'other' => 'bag',
        ],
        'fashion_accessories' => [
            'hat' => 'hat',
            'belt' => 'belt',
            'scarf_stole' => 'scarf-stole',
            'gloves' => 'gloves',
            'jewelry' => 'jewelry',
            'wallet_case' => 'wallet-case',
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
            'other' => 'other',
        ],
        'kimono' => [
            'kimono' => 'kimono',
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
        'bags' => 'bag',
        'fashion_accessories' => 'other',
        'shoes' => 'other',
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

        return count(self::SHAPE_OPTIONS_BY_SUBCATEGORY[$category][$subcategory] ?? []) > 1;
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

        return self::DEFAULT_SHAPE_BY_SUBCATEGORY[$category][$subcategory] ?? self::FALLBACK_SHAPE_BY_CATEGORY[$category] ?? null;
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
