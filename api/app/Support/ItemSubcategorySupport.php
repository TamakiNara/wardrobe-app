<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class ItemSubcategorySupport
{
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
            'backpack',
            'hand',
            'clutch',
            'body',
            'other',
        ],
        'fashion_accessories' => [
            'hat',
            'belt',
            'scarf_stole',
            'gloves',
            'jewelry',
            'wallet_case',
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
            'other',
        ],
        'legwear' => [
            'socks',
            'stockings',
            'tights',
            'leggings',
            'other',
        ],
        'kimono' => [
            'kimono',
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
            'backpack' => 'bags_backpack',
            'hand' => 'bags_hand',
            'clutch' => 'bags_clutch',
            'body' => 'bags_body',
            'other' => 'bags_other',
        ],
        'fashion_accessories' => [
            'hat' => 'fashion_accessories_hat',
            'belt' => 'fashion_accessories_belt',
            'scarf_stole' => 'fashion_accessories_scarf_stole',
            'gloves' => 'fashion_accessories_gloves',
            'jewelry' => 'fashion_accessories_jewelry',
            'wallet_case' => 'fashion_accessories_wallet_case',
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
            'other' => 'shoes_other',
        ],
        'legwear' => [
            'socks' => 'legwear_socks',
            'stockings' => 'legwear_stockings',
            'tights' => 'legwear_tights',
            'leggings' => 'legwear_leggings',
            'other' => 'legwear_other',
        ],
        'kimono' => [
            'kimono' => 'kimono_kimono',
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
