<?php

namespace App\Support;

class ItemSpecNormalizer
{
    public static function normalize(?string $category, ?string $shape, mixed $spec, ?string $subcategory = null): ?array
    {
        $normalized = is_array($spec) ? $spec : [];
        $lengthType = data_get($normalized, 'bottoms.length_type');
        $riseType = data_get($normalized, 'bottoms.rise_type');
        $resolvedLengthType = self::resolveBottomsLengthType($category, $shape, $lengthType);
        $resolvedRiseType = self::resolveBottomsRiseType($category, $riseType);
        $coverageType = data_get($normalized, 'legwear.coverage_type');
        $resolvedCoverageType = self::resolveLegwearCoverageType($category, $shape, $coverageType, $subcategory);

        if ($resolvedLengthType !== null || $resolvedRiseType !== null) {
            $bottomsSpec = [];

            if ($resolvedLengthType !== null) {
                $bottomsSpec['length_type'] = $resolvedLengthType;
            }

            if ($resolvedRiseType !== null) {
                $bottomsSpec['rise_type'] = $resolvedRiseType;
            }

            $normalized['bottoms'] = $bottomsSpec;
        } else {
            unset($normalized['bottoms']);
        }

        if ($resolvedCoverageType !== null) {
            data_set($normalized, 'legwear.coverage_type', $resolvedCoverageType);
        } else {
            unset($normalized['legwear']);
        }

        return $normalized === [] ? null : $normalized;
    }

    private static function resolveLegwearCoverageType(?string $category, ?string $shape, mixed $coverageType, ?string $subcategory = null): ?string
    {
        if ($category !== 'legwear') {
            return null;
        }

        $resolvedSubcategory = match ($subcategory) {
            'socks', 'stockings', 'tights', 'leggings', 'other' => $subcategory,
            default => match ($shape) {
                'socks', 'stockings', 'tights', 'leggings' => $shape,
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
            return in_array($coverageType, ['ankle_socks', 'crew_socks', 'knee_socks', 'over_knee'], true)
                ? $coverageType
                : null;
        }

        if ($resolvedSubcategory === 'leggings') {
            return in_array($coverageType, ['leggings_cropped', 'leggings_full'], true)
                ? $coverageType
                : null;
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
