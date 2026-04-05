<?php

namespace App\Support;

class ItemSpecNormalizer
{
    public static function normalize(?string $category, ?string $shape, mixed $spec): ?array
    {
        $normalized = is_array($spec) ? $spec : [];
        $lengthType = data_get($normalized, 'bottoms.length_type');
        $resolvedLengthType = self::resolveBottomsLengthType($category, $shape, $lengthType);
        $coverageType = data_get($normalized, 'legwear.coverage_type');
        $resolvedCoverageType = self::resolveLegwearCoverageType($category, $shape, $coverageType);

        if ($resolvedLengthType !== null) {
            data_set($normalized, 'bottoms.length_type', $resolvedLengthType);
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

    private static function resolveLegwearCoverageType(?string $category, ?string $shape, mixed $coverageType): ?string
    {
        if ($category !== 'legwear') {
            return null;
        }

        if ($shape === 'stockings') {
            return 'stockings';
        }

        if ($shape === 'tights') {
            return 'tights';
        }

        if ($shape === 'socks') {
            return in_array($coverageType, ['ankle_socks', 'crew_socks', 'knee_socks', 'over_knee'], true)
                ? $coverageType
                : null;
        }

        if ($shape === 'leggings') {
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

        if (in_array($lengthType, ['mini', 'short', 'half', 'cropped', 'full'], true)) {
            return $lengthType;
        }

        $legacyMapped = match ($lengthType) {
            'knee' => 'half',
            'midi' => 'cropped',
            'ankle' => 'full',
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
}
