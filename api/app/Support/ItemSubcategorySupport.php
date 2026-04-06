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
            'shoes',
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
        'bags',
        'fashion_accessories',
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
