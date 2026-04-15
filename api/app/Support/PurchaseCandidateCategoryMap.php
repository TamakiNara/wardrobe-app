<?php

namespace App\Support;

class PurchaseCandidateCategoryMap
{
    private const MAP = [
        'tops_tshirt_cutsew' => ['category' => 'tops', 'subcategory' => 'tshirt_cutsew'],
        'tops_shirt_blouse' => ['category' => 'tops', 'subcategory' => 'shirt_blouse'],
        'tops_knit_sweater' => ['category' => 'tops', 'subcategory' => 'knit_sweater'],
        'tops_polo_shirt' => ['category' => 'tops', 'subcategory' => 'polo_shirt'],
        'tops_sweat_trainer' => ['category' => 'tops', 'subcategory' => 'sweat_trainer'],
        'tops_hoodie' => ['category' => 'tops', 'subcategory' => 'hoodie'],
        'tops_cardigan' => ['category' => 'tops', 'subcategory' => 'cardigan'],
        'tops_vest_gilet' => ['category' => 'tops', 'subcategory' => 'vest_gilet'],
        'tops_camisole' => ['category' => 'tops', 'subcategory' => 'camisole'],
        'tops_tanktop' => ['category' => 'tops', 'subcategory' => 'tanktop'],
        'tops_other' => ['category' => 'tops', 'subcategory' => 'other'],
        'outerwear_jacket' => ['category' => 'outerwear', 'subcategory' => 'jacket'],
        'outerwear_coat' => ['category' => 'outerwear', 'subcategory' => 'coat'],
        'outerwear_blouson' => ['category' => 'outerwear', 'subcategory' => 'blouson'],
        'outerwear_down_padded' => ['category' => 'outerwear', 'subcategory' => 'down_padded'],
        'outerwear_mountain_parka' => ['category' => 'outerwear', 'subcategory' => 'mountain_parka'],
        'outerwear_other' => ['category' => 'outerwear', 'subcategory' => 'other', 'shape' => 'other'],
        'pants_pants' => ['category' => 'pants', 'subcategory' => 'pants'],
        'pants_denim' => ['category' => 'pants', 'subcategory' => 'denim'],
        'pants_slacks' => ['category' => 'pants', 'subcategory' => 'slacks'],
        'pants_cargo' => ['category' => 'pants', 'subcategory' => 'cargo'],
        'pants_chino' => ['category' => 'pants', 'subcategory' => 'chino'],
        'pants_sweat_jersey' => ['category' => 'pants', 'subcategory' => 'sweat_jersey'],
        'pants_other' => ['category' => 'pants', 'subcategory' => 'other'],
        'skirts_skirt' => ['category' => 'skirts', 'subcategory' => 'skirt'],
        'skirts_other' => ['category' => 'skirts', 'subcategory' => 'other', 'shape' => 'other'],
        'onepiece_dress_onepiece' => ['category' => 'onepiece_dress', 'subcategory' => 'onepiece'],
        'onepiece_dress_dress' => ['category' => 'onepiece_dress', 'subcategory' => 'dress'],
        'onepiece_dress_other' => ['category' => 'onepiece_dress', 'subcategory' => 'other', 'shape' => 'other'],
        'allinone_allinone' => ['category' => 'allinone', 'subcategory' => 'allinone'],
        'allinone_salopette' => ['category' => 'allinone', 'subcategory' => 'salopette'],
        'allinone_other' => ['category' => 'allinone', 'subcategory' => 'other', 'shape' => 'other'],
        'roomwear_inner_roomwear' => ['category' => 'inner', 'subcategory' => 'roomwear'],
        'roomwear_inner_underwear' => ['category' => 'inner', 'subcategory' => 'underwear'],
        'roomwear_inner_pajamas' => ['category' => 'inner', 'subcategory' => 'pajamas'],
        'roomwear_inner_other' => ['category' => 'inner', 'subcategory' => 'other'],
        'shoes_sneakers' => ['category' => 'shoes', 'subcategory' => 'sneakers'],
        'shoes_loafers_leather' => ['category' => 'shoes', 'subcategory' => 'other', 'shape' => 'other'],
        'shoes_pumps' => ['category' => 'shoes', 'subcategory' => 'pumps'],
        'shoes_boots' => ['category' => 'shoes', 'subcategory' => 'boots'],
        'shoes_sandals' => ['category' => 'shoes', 'subcategory' => 'sandals'],
        'shoes_leather_shoes' => ['category' => 'shoes', 'subcategory' => 'leather_shoes'],
        'shoes_rain_shoes_boots' => ['category' => 'shoes', 'subcategory' => 'rain_shoes_boots'],
        'shoes_other' => ['category' => 'shoes', 'subcategory' => 'other'],
        'legwear_socks' => ['category' => 'legwear', 'subcategory' => 'socks'],
        'legwear_stockings' => ['category' => 'legwear', 'subcategory' => 'stockings'],
        'legwear_tights' => ['category' => 'legwear', 'subcategory' => 'tights'],
        'legwear_leggings' => ['category' => 'legwear', 'subcategory' => 'leggings'],
        'legwear_other' => ['category' => 'legwear', 'subcategory' => 'other'],
        'bags_tote' => ['category' => 'bags', 'subcategory' => 'tote'],
        'bags_shoulder' => ['category' => 'bags', 'subcategory' => 'shoulder'],
        'bags_boston' => ['category' => 'bags', 'subcategory' => 'boston'],
        'bags_rucksack' => ['category' => 'bags', 'subcategory' => 'rucksack'],
        'bags_hand' => ['category' => 'bags', 'subcategory' => 'hand'],
        'bags_body' => ['category' => 'bags', 'subcategory' => 'body'],
        'bags_waist_pouch' => ['category' => 'bags', 'subcategory' => 'waist_pouch'],
        'bags_messenger' => ['category' => 'bags', 'subcategory' => 'messenger'],
        'bags_clutch' => ['category' => 'bags', 'subcategory' => 'clutch'],
        'bags_sacoche' => ['category' => 'bags', 'subcategory' => 'sacoche'],
        'bags_pochette' => ['category' => 'bags', 'subcategory' => 'pochette'],
        'bags_drawstring' => ['category' => 'bags', 'subcategory' => 'drawstring'],
        'bags_basket_bag' => ['category' => 'bags', 'subcategory' => 'basket_bag'],
        'bags_briefcase' => ['category' => 'bags', 'subcategory' => 'briefcase'],
        'bags_marche_bag' => ['category' => 'bags', 'subcategory' => 'marche_bag'],
        'bags_other' => ['category' => 'bags', 'subcategory' => 'other'],
        'fashion_accessories_hat' => ['category' => 'fashion_accessories', 'subcategory' => 'hat'],
        'fashion_accessories_belt' => ['category' => 'fashion_accessories', 'subcategory' => 'belt'],
        'fashion_accessories_scarf_stole' => ['category' => 'fashion_accessories', 'subcategory' => 'scarf_stole'],
        'fashion_accessories_gloves' => ['category' => 'fashion_accessories', 'subcategory' => 'gloves'],
        'fashion_accessories_jewelry' => ['category' => 'fashion_accessories', 'subcategory' => 'jewelry'],
        'fashion_accessories_scarf_bandana' => ['category' => 'fashion_accessories', 'subcategory' => 'scarf_bandana'],
        'fashion_accessories_hair' => ['category' => 'fashion_accessories', 'subcategory' => 'hair_accessory'],
        'fashion_accessories_eyewear' => ['category' => 'fashion_accessories', 'subcategory' => 'eyewear'],
        'fashion_accessories_watch' => ['category' => 'fashion_accessories', 'subcategory' => 'watch'],
        'fashion_accessories_other' => ['category' => 'fashion_accessories', 'subcategory' => 'other'],
        'swimwear_swimwear' => ['category' => 'swimwear', 'shape' => 'swimwear'],
        'swimwear_rashguard' => ['category' => 'swimwear', 'shape' => 'rashguard'],
        'swimwear_other' => ['category' => 'swimwear', 'shape' => 'other'],
        'kimono_kimono' => ['category' => 'kimono', 'shape' => 'kimono'],
        'kimono_other' => ['category' => 'kimono', 'shape' => 'other'],
        // 旧 category_id を持つ購入検討データ用の互換マップ
        'tops_tshirt' => ['category' => 'tops', 'subcategory' => 'tshirt_cutsew'],
        'tops_shirt' => ['category' => 'tops', 'subcategory' => 'shirt_blouse'],
        'tops_knit' => ['category' => 'tops', 'subcategory' => 'knit_sweater'],
        'tops_vest' => ['category' => 'tops', 'subcategory' => 'vest_gilet'],
        'outer_jacket' => ['category' => 'outerwear', 'subcategory' => 'jacket'],
        'outer_coat' => ['category' => 'outerwear', 'subcategory' => 'coat'],
        'outer_blouson' => ['category' => 'outerwear', 'subcategory' => 'blouson'],
        'outer_down' => ['category' => 'outerwear', 'subcategory' => 'down_padded'],
        'outer_other' => ['category' => 'outerwear', 'subcategory' => 'other', 'shape' => 'other'],
        'bottoms_pants' => ['category' => 'pants', 'subcategory' => 'pants'],
        'bottoms_skirt' => ['category' => 'skirts', 'subcategory' => 'skirt'],
        'bottoms_shorts' => ['category' => 'pants', 'subcategory' => 'pants'],
        'bottoms_other' => ['category' => 'pants', 'subcategory' => 'other'],
        'onepiece' => ['category' => 'onepiece_dress', 'subcategory' => 'onepiece'],
        'allinone' => ['category' => 'allinone', 'subcategory' => 'allinone'],
        'inner_roomwear' => ['category' => 'inner', 'subcategory' => 'roomwear'],
        'inner_underwear' => ['category' => 'inner', 'subcategory' => 'underwear'],
        'inner_pajamas' => ['category' => 'inner', 'subcategory' => 'pajamas'],
        'shoes_loafers' => ['category' => 'shoes', 'subcategory' => 'other', 'shape' => 'other'],
        'bags_bag' => ['category' => 'bags', 'subcategory' => 'other'],
        'accessories_hat' => ['category' => 'fashion_accessories', 'subcategory' => 'hat'],
        'accessories_belt' => ['category' => 'fashion_accessories', 'subcategory' => 'belt'],
        'accessories_scarf' => ['category' => 'fashion_accessories', 'subcategory' => 'scarf_stole'],
        'accessories_gloves' => ['category' => 'fashion_accessories', 'subcategory' => 'gloves'],
        'accessories_jewelry' => ['category' => 'fashion_accessories', 'subcategory' => 'jewelry'],
        'accessories_other' => ['category' => 'fashion_accessories', 'subcategory' => 'other'],
    ];

    public static function resolveItemDraftCategory(string $categoryId): ?array
    {
        $resolved = self::MAP[$categoryId] ?? null;

        if (! is_array($resolved)) {
            return null;
        }

        $category = is_string($resolved['category'] ?? null) ? $resolved['category'] : null;
        $subcategory = ItemSubcategorySupport::normalize($category, $resolved['subcategory'] ?? null);
        $explicitShape = ItemInputRequirementSupport::normalizeShape($resolved['shape'] ?? null);
        $shape = $category === 'tops' && $subcategory === 'other' && $explicitShape === null
            ? ''
            : ($explicitShape
                ?? ItemInputRequirementSupport::defaultShapeFor($category, $subcategory)
                ?? ItemInputRequirementSupport::fallbackShapeFor($category));

        $normalized = [
            'category' => $category,
            'shape' => $shape,
        ];

        if ($subcategory !== null) {
            $normalized['subcategory'] = $subcategory;
        }

        return $normalized['category'] === null ? null : $normalized;
    }
}
