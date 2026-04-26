<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class ItemSubcategorySupport
{
    private const CURRENT_GROUP_ID_BY_CATEGORY = [
        'tops' => 'tops',
        'pants' => 'pants',
        'skirts' => 'skirts',
        'outerwear' => 'outerwear',
        'onepiece_dress' => 'onepiece_dress',
        'allinone' => 'allinone',
        'inner' => 'roomwear_inner',
        'bags' => 'bags',
        'fashion_accessories' => 'fashion_accessories',
        'shoes' => 'shoes',
        'legwear' => 'legwear',
        'kimono' => 'kimono',
        'swimwear' => 'swimwear',
    ];

    private const LEGACY_INFERRED_SUBCATEGORY_BY_SHAPE = [
        'tops' => [
            'tshirt' => 'tshirt_cutsew',
            'shirt' => 'shirt_blouse',
            'blouse' => 'shirt_blouse',
            'knit' => 'knit_sweater',
            'cardigan' => 'cardigan',
            'camisole' => 'camisole',
            'tanktop' => 'tanktop',
            'vest' => 'vest_gilet',
            'polo' => 'polo_shirt',
            'sweatshirt' => 'sweat_trainer',
            'hoodie' => 'hoodie',
            'other' => 'other',
        ],
        'pants' => [
            'pants' => 'pants',
            'denim' => 'denim',
            'slacks' => 'slacks',
            'cargo' => 'cargo',
            'chino' => 'chino',
            'straight' => 'pants',
            'tapered' => 'pants',
            'wide' => 'pants',
            'culottes' => 'pants',
            'jogger' => 'pants',
            'skinny' => 'pants',
            'gaucho' => 'pants',
            'other' => 'other',
        ],
        'skirts' => [
            'skirt' => 'skirt',
            'tight' => 'skirt',
            'flare' => 'skirt',
            'a_line' => 'skirt',
            'narrow' => 'skirt',
            'mermaid' => 'skirt',
            'other' => 'other',
        ],
        'outerwear' => [
            'jacket' => 'jacket',
            'tailored' => 'jacket',
            'no_collar' => 'jacket',
            'blazer' => 'jacket',
            'coat' => 'coat',
            'trench' => 'coat',
            'chester' => 'coat',
            'stainless' => 'coat',
            'blouson' => 'blouson',
            'down-padded' => 'down_padded',
            'mountain-parka' => 'mountain_parka',
            'other' => 'other',
        ],
        'onepiece_dress' => [
            'onepiece' => 'onepiece',
            'dress' => 'dress',
            'other' => 'other',
        ],
        'allinone' => [
            'allinone' => 'allinone',
            'salopette' => 'salopette',
            'other' => 'other',
        ],
        'inner' => [
            'roomwear' => 'roomwear',
            'underwear' => 'underwear',
            'pajamas' => 'pajamas',
            'other' => 'other',
        ],
        'bags' => [
            'tote' => 'tote',
            'shoulder' => 'shoulder',
            'boston' => 'boston',
            'rucksack' => 'rucksack',
            'hand' => 'hand',
            'body' => 'body',
            'waist-pouch' => 'waist_pouch',
            'messenger' => 'messenger',
            'clutch' => 'clutch',
            'sacoche' => 'sacoche',
            'pochette' => 'pochette',
            'drawstring' => 'drawstring',
            'basket-bag' => 'basket_bag',
            'briefcase' => 'briefcase',
            'marche-bag' => 'marche_bag',
            'bag' => 'other',
            'other' => 'other',
        ],
        'fashion_accessories' => [
            'hat' => 'hat',
            'belt' => 'belt',
            'scarf-stole' => 'scarf_stole',
            'gloves' => 'gloves',
            'jewelry' => 'jewelry',
            'scarf-bandana' => 'scarf_bandana',
            'hair-accessory' => 'hair_accessory',
            'eyewear' => 'eyewear',
            'watch' => 'watch',
            'other' => 'other',
            'accessory' => 'other',
        ],
        'shoes' => [
            'sneakers' => 'sneakers',
            'pumps' => 'pumps',
            'short-boots' => 'boots',
            'sandals' => 'sandals',
            'leather-shoes' => 'leather_shoes',
            'rain-shoes-boots' => 'rain_shoes_boots',
            'other' => 'other',
        ],
        'legwear' => [
            'socks' => 'socks',
            'stockings' => 'stockings',
            'tights' => 'tights',
            'leggings' => 'leggings',
            'leg-warmer' => 'leg_warmer',
            'other' => 'other',
        ],
        'swimwear' => [
            'swimwear' => 'swimwear',
            'rashguard' => 'rashguard',
            'other' => 'other',
        ],
        'kimono' => [
            'kimono' => 'kimono',
            'yukata' => 'yukata',
            'japanese-accessory' => 'japanese_accessory',
            'other' => 'other',
        ],
    ];

    private const OPTIONS = [
        'tops' => [
            'tshirt_cutsew',
            'shirt_blouse',
            'knit_sweater',
            'cardigan',
            'polo_shirt',
            'sweat_trainer',
            'hoodie',
            'vest_gilet',
            'camisole',
            'tanktop',
            'other',
        ],
        'pants' => [
            'pants',
            'denim',
            'slacks',
            'cargo',
            'chino',
            'sweat_jersey',
            'other',
        ],
        'skirts' => [
            'skirt',
            'other',
        ],
        'outerwear' => [
            'jacket',
            'coat',
            'blouson',
            'down_padded',
            'mountain_parka',
            'other',
        ],
        'onepiece_dress' => [
            'onepiece',
            'dress',
            'other',
        ],
        'allinone' => [
            'allinone',
            'salopette',
            'other',
        ],
        'inner' => [
            'roomwear',
            'underwear',
            'pajamas',
            'other',
        ],
        'bags' => [
            'tote',
            'shoulder',
            'boston',
            'rucksack',
            'hand',
            'body',
            'waist_pouch',
            'messenger',
            'clutch',
            'sacoche',
            'pochette',
            'drawstring',
            'basket_bag',
            'briefcase',
            'marche_bag',
            'other',
        ],
        'fashion_accessories' => [
            'hat',
            'belt',
            'scarf_stole',
            'gloves',
            'jewelry',
            'scarf_bandana',
            'hair_accessory',
            'eyewear',
            'watch',
            'other',
        ],
        'shoes' => [
            'sneakers',
            'pumps',
            'boots',
            'sandals',
            'leather_shoes',
            'rain_shoes_boots',
            'other',
        ],
        'legwear' => [
            'socks',
            'stockings',
            'tights',
            'leggings',
            'leg_warmer',
            'other',
        ],
        'kimono' => [
            'kimono',
            'yukata',
            'japanese_accessory',
            'other',
        ],
        'swimwear' => [
            'swimwear',
            'rashguard',
            'other',
        ],
    ];

    private const REQUIRED_CATEGORIES = [
        'tops',
        'pants',
        'outerwear',
        'onepiece_dress',
        'allinone',
        'inner',
        'bags',
        'fashion_accessories',
        'shoes',
        'legwear',
        'swimwear',
        'kimono',
    ];

    /**
     * settings / visible 判定で使う表示対象 ID の対応表。
     * item 実データの category + subcategory を、master / settings 側の ID に橋渡しする。
     *
     * @var array<string, array<string, string>>
     */
    private const VISIBLE_CATEGORY_ID_BY_SUBCATEGORY = [
        'tops' => [
            'tshirt_cutsew' => 'tops_tshirt_cutsew',
            'shirt_blouse' => 'tops_shirt_blouse',
            'knit_sweater' => 'tops_knit_sweater',
            'cardigan' => 'tops_cardigan',
            'polo_shirt' => 'tops_polo_shirt',
            'sweat_trainer' => 'tops_sweat_trainer',
            'hoodie' => 'tops_hoodie',
            'vest_gilet' => 'tops_vest_gilet',
            'camisole' => 'tops_camisole',
            'tanktop' => 'tops_tanktop',
            'other' => 'tops_other',
        ],
        'pants' => [
            'pants' => 'pants_pants',
            'denim' => 'pants_denim',
            'slacks' => 'pants_slacks',
            'cargo' => 'pants_cargo',
            'chino' => 'pants_chino',
            'sweat_jersey' => 'pants_sweat_jersey',
            'other' => 'pants_other',
        ],
        'skirts' => [
            'skirt' => 'skirts_skirt',
            'other' => 'skirts_other',
        ],
        'outerwear' => [
            'jacket' => 'outerwear_jacket',
            'coat' => 'outerwear_coat',
            'blouson' => 'outerwear_blouson',
            'down_padded' => 'outerwear_down_padded',
            'mountain_parka' => 'outerwear_mountain_parka',
            'other' => 'outerwear_other',
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
        'inner' => [
            'roomwear' => 'roomwear_inner_roomwear',
            'underwear' => 'roomwear_inner_underwear',
            'pajamas' => 'roomwear_inner_pajamas',
            'other' => 'roomwear_inner_other',
        ],
        'bags' => [
            'tote' => 'bags_tote',
            'shoulder' => 'bags_shoulder',
            'boston' => 'bags_boston',
            'rucksack' => 'bags_rucksack',
            'hand' => 'bags_hand',
            'body' => 'bags_body',
            'waist_pouch' => 'bags_waist_pouch',
            'messenger' => 'bags_messenger',
            'clutch' => 'bags_clutch',
            'sacoche' => 'bags_sacoche',
            'pochette' => 'bags_pochette',
            'drawstring' => 'bags_drawstring',
            'basket_bag' => 'bags_basket_bag',
            'briefcase' => 'bags_briefcase',
            'marche_bag' => 'bags_marche_bag',
            'other' => 'bags_other',
        ],
        'fashion_accessories' => [
            'hat' => 'fashion_accessories_hat',
            'belt' => 'fashion_accessories_belt',
            'scarf_stole' => 'fashion_accessories_scarf_stole',
            'gloves' => 'fashion_accessories_gloves',
            'jewelry' => 'fashion_accessories_jewelry',
            'scarf_bandana' => 'fashion_accessories_scarf_bandana',
            'hair_accessory' => 'fashion_accessories_hair',
            'eyewear' => 'fashion_accessories_eyewear',
            'watch' => 'fashion_accessories_watch',
            'other' => 'fashion_accessories_other',
        ],
        'shoes' => [
            'sneakers' => 'shoes_sneakers',
            'pumps' => 'shoes_pumps',
            'boots' => 'shoes_boots',
            'sandals' => 'shoes_sandals',
            'leather_shoes' => 'shoes_leather_shoes',
            'rain_shoes_boots' => 'shoes_rain_shoes_boots',
            'other' => 'shoes_other',
        ],
        'legwear' => [
            'socks' => 'legwear_socks',
            'stockings' => 'legwear_stockings',
            'tights' => 'legwear_tights',
            'leggings' => 'legwear_leggings',
            'leg_warmer' => 'legwear_leg_warmer',
            'other' => 'legwear_other',
        ],
        'kimono' => [
            'kimono' => 'kimono_kimono',
            'yukata' => 'kimono_yukata',
            'japanese_accessory' => 'kimono_japanese_accessory',
            'other' => 'kimono_other',
        ],
        'swimwear' => [
            'swimwear' => 'swimwear_swimwear',
            'rashguard' => 'swimwear_rashguard',
            'other' => 'swimwear_other',
        ],
    ];

    public static function valuesFor(?string $category): array
    {
        if (! is_string($category)) {
            return [];
        }

        return self::OPTIONS[$category] ?? [];
    }

    public static function isRequired(?string $category): bool
    {
        return is_string($category) && in_array($category, self::REQUIRED_CATEGORIES, true);
    }

    /**
     * @return array<string, array<string, string>>
     */
    public static function visibleCategoryIdMap(): array
    {
        return self::VISIBLE_CATEGORY_ID_BY_SUBCATEGORY;
    }

    /**
     * @return string[]
     */
    public static function currentGroupIds(): array
    {
        return array_values(array_unique(array_map(
            static fn (string $category): string => self::CURRENT_GROUP_ID_BY_CATEGORY[$category] ?? $category,
            array_keys(self::VISIBLE_CATEGORY_ID_BY_SUBCATEGORY),
        )));
    }

    /**
     * @return string[]
     */
    public static function currentVisibleCategoryIds(): array
    {
        $ids = [];

        foreach (self::VISIBLE_CATEGORY_ID_BY_SUBCATEGORY as $categoryMap) {
            foreach ($categoryMap as $visibleCategoryId) {
                $ids[] = $visibleCategoryId;
            }
        }

        return array_values(array_unique($ids));
    }

    public static function visibleCategoryIdFor(?string $category, ?string $subcategory): ?string
    {
        if (! is_string($category) || ! is_string($subcategory) || $subcategory === '') {
            return null;
        }

        return self::VISIBLE_CATEGORY_ID_BY_SUBCATEGORY[$category][$subcategory] ?? null;
    }

    public static function normalize(?string $category, mixed $subcategory): ?string
    {
        if (! is_string($subcategory)) {
            return null;
        }

        $normalized = trim($subcategory);

        if ($normalized === '') {
            return null;
        }

        $available = self::valuesFor($category);

        if ($available === [] || ! in_array($normalized, $available, true)) {
            return null;
        }

        return $normalized;
    }

    public static function inferFromShape(?string $category, mixed $shape): ?string
    {
        if (! is_string($category) || $category === '') {
            return null;
        }

        if (! is_string($shape)) {
            return null;
        }

        $normalizedShape = trim($shape);

        if ($normalizedShape === '') {
            return null;
        }

        $subcategory = self::LEGACY_INFERRED_SUBCATEGORY_BY_SHAPE[$category][$normalizedShape] ?? null;

        return self::normalize($category, $subcategory);
    }

    public static function validate(array $validated): void
    {
        $category = is_string($validated['category'] ?? null) ? $validated['category'] : null;
        $subcategory = self::normalize($category, $validated['subcategory'] ?? null);

        if (($validated['subcategory'] ?? null) !== null && $subcategory === null) {
            throw ValidationException::withMessages([
                'subcategory' => 'カテゴリに対応しない種類です。',
            ]);
        }

        if (self::isRequired($category) && $subcategory === null) {
            throw ValidationException::withMessages([
                'subcategory' => '種類を選択してください。',
            ]);
        }
    }
}
