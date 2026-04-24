<?php

namespace App\Support;

class ItemSpecNormalizer
{
    public static function normalize(?string $category, ?string $shape, mixed $spec, ?string $subcategory = null): ?array
    {
        $normalized = is_array($spec) ? $spec : [];
        $resolvedTopsSpec = self::resolveTopsSpec($category, data_get($normalized, 'tops'));
        $lengthType = data_get($normalized, 'bottoms.length_type');
        $skirtLengthType = data_get($normalized, 'skirt.length_type');
        $skirtMaterialType = data_get($normalized, 'skirt.material_type');
        $skirtDesignType = data_get($normalized, 'skirt.design_type');
        $riseType = data_get($normalized, 'bottoms.rise_type');
        $resolvedLengthType = self::resolveBottomsLengthType($category, $shape, $lengthType);
        $resolvedSkirtLengthType = self::resolveSkirtLengthType($category, $skirtLengthType, $lengthType);
        $resolvedSkirtMaterialType = self::resolveSkirtMaterialType($category, $skirtMaterialType);
        $resolvedSkirtDesignType = self::resolveSkirtDesignType($category, $skirtDesignType);
        $resolvedRiseType = self::resolveBottomsRiseType($category, $riseType);
        $coverageType = data_get($normalized, 'legwear.coverage_type');
        $resolvedCoverageType = self::resolveLegwearCoverageType($category, $shape, $coverageType, $subcategory);

        if ($category === 'skirts') {
            $skirtSpec = [];

            if ($resolvedSkirtLengthType !== null) {
                $skirtSpec['length_type'] = $resolvedSkirtLengthType;
            }

            if ($resolvedSkirtMaterialType !== null) {
                $skirtSpec['material_type'] = $resolvedSkirtMaterialType;
            }

            if ($resolvedSkirtDesignType !== null) {
                $skirtSpec['design_type'] = $resolvedSkirtDesignType;
            }

            if ($skirtSpec !== []) {
                $normalized['skirt'] = $skirtSpec;
            } else {
                unset($normalized['skirt']);
            }

            unset($normalized['bottoms']);
        } elseif ($resolvedLengthType !== null || $resolvedRiseType !== null) {
            $bottomsSpec = [];

            if ($resolvedLengthType !== null) {
                $bottomsSpec['length_type'] = $resolvedLengthType;
            }

            if ($resolvedRiseType !== null) {
                $bottomsSpec['rise_type'] = $resolvedRiseType;
            }

            $normalized['bottoms'] = $bottomsSpec;
            unset($normalized['skirt']);
        } else {
            unset($normalized['bottoms']);
            unset($normalized['skirt']);
        }

        if ($resolvedTopsSpec !== null) {
            $normalized['tops'] = $resolvedTopsSpec;
        } else {
            unset($normalized['tops']);
        }

        if ($resolvedCoverageType !== null) {
            data_set($normalized, 'legwear.coverage_type', $resolvedCoverageType);
        } else {
            unset($normalized['legwear']);
        }

        return $normalized === [] ? null : $normalized;
    }

    private static function resolveTopsSpec(?string $category, mixed $topsSpec): ?array
    {
        if ($category !== 'tops' || ! is_array($topsSpec)) {
            return null;
        }

        unset($topsSpec['shape']);

        return $topsSpec === [] ? null : $topsSpec;
    }

    private static function resolveLegwearCoverageType(?string $category, ?string $shape, mixed $coverageType, ?string $subcategory = null): ?string
    {
        if ($category !== 'legwear') {
            return null;
        }

        $resolvedSubcategory = match ($subcategory) {
            'socks', 'stockings', 'tights', 'leggings', 'leg_warmer', 'other' => $subcategory,
            default => match ($shape) {
                'socks', 'stockings', 'tights', 'leggings' => $shape,
                'leg-warmer' => 'leg_warmer',
                default => null,
            },
        };

        if ($resolvedSubcategory === 'stockings') {
            return 'stockings';
        }

        if ($resolvedSubcategory === 'tights') {
            return 'tights';
        }

        if ($resolvedSubcategory === 'socks') {
            if (in_array($coverageType, ['foot_cover', 'ankle_sneaker', 'crew', 'three_quarter', 'high_socks'], true)) {
                return $coverageType;
            }

            return match ($coverageType) {
                'ankle_socks' => 'ankle_sneaker',
                'crew_socks' => 'crew',
                'knee_socks', 'over_knee' => 'high_socks',
                default => null,
            };
        }

        if ($resolvedSubcategory === 'leggings') {
            if (in_array($coverageType, ['one_tenth', 'three_tenths', 'five_tenths', 'seven_tenths', 'seven_eighths', 'ten_tenths', 'twelve_tenths'], true)) {
                return $coverageType;
            }

            return match ($coverageType) {
                'leggings_cropped' => 'seven_tenths',
                'leggings_full' => 'ten_tenths',
                default => null,
            };
        }

        return null;
    }

    private static function resolveBottomsLengthType(?string $category, ?string $shape, mixed $lengthType): ?string
    {
        if (! in_array($category, ['bottoms', 'pants', 'skirts'], true)) {
            return null;
        }

        if (in_array($lengthType, ['mini', 'short', 'half', 'cropped', 'ankle', 'full'], true)) {
            return $lengthType;
        }

        $legacyMapped = match ($lengthType) {
            'knee' => 'half',
            'midi' => 'cropped',
            default => null,
        };

        if ($legacyMapped !== null) {
            return $legacyMapped;
        }

        if ($category === 'bottoms' && $shape === 'mini-skirt') {
            return 'mini';
        }

        if ($category === 'pants' && $shape === 'short-pants') {
            return 'short';
        }

        return null;
    }

    private static function resolveSkirtLengthType(?string $category, mixed $skirtLengthType, mixed $legacyBottomsLengthType): ?string
    {
        if ($category !== 'skirts') {
            return null;
        }

        if (in_array($skirtLengthType, ['mini', 'knee', 'midi', 'mid_calf', 'long', 'maxi'], true)) {
            return $skirtLengthType;
        }

        return match ($legacyBottomsLengthType) {
            'mini', 'short' => 'mini',
            'half', 'knee' => 'knee',
            'cropped', 'midi' => 'midi',
            'ankle' => 'long',
            'full' => 'maxi',
            'mid_calf', 'long', 'maxi' => $legacyBottomsLengthType,
            default => null,
        };
    }

    private static function resolveSkirtMaterialType(?string $category, mixed $materialType): ?string
    {
        if ($category !== 'skirts') {
            return null;
        }

        return in_array($materialType, ['tulle', 'lace', 'denim', 'leather', 'satin'], true)
            ? $materialType
            : null;
    }

    private static function resolveSkirtDesignType(?string $category, mixed $designType): ?string
    {
        if ($category !== 'skirts') {
            return null;
        }

        return in_array($designType, ['tuck', 'gather', 'pleats', 'tiered', 'wrap', 'balloon', 'trench'], true)
            ? $designType
            : null;
    }

    private static function resolveBottomsRiseType(?string $category, mixed $riseType): ?string
    {
        if ($category !== 'pants') {
            return null;
        }

        return in_array($riseType, ['high_waist', 'low_rise'], true)
            ? $riseType
            : null;
    }
}
