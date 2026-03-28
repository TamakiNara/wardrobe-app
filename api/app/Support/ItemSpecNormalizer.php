<?php

namespace App\Support;

class ItemSpecNormalizer
{
    public static function normalize(?string $category, ?string $shape, mixed $spec): ?array
    {
        $normalized = is_array($spec) ? $spec : [];
        $coverageType = data_get($normalized, 'legwear.coverage_type');
        $resolvedCoverageType = self::resolveLegwearCoverageType($category, $shape, $coverageType);

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
}
