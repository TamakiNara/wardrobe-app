<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class ItemLegwearSpecValidator
{
    public static function validate(array $validated): void
    {
        $category = $validated['category'] ?? null;
        $shape = $validated['shape'] ?? null;
        $subcategory = ItemSubcategorySupport::normalize(
            is_string($category) ? $category : null,
            $validated['subcategory'] ?? null,
        );
        $bottomsLengthType = data_get($validated, 'spec.bottoms.length_type');
        $coverageType = data_get($validated, 'spec.legwear.coverage_type');
        $resolvedLegwearType = match ($subcategory) {
            'socks', 'stockings', 'tights', 'leggings', 'other' => $subcategory,
            default => match ($shape) {
                'socks', 'stockings', 'tights', 'leggings' => $shape,
                default => null,
            },
        };

        if (in_array($category, ['bottoms', 'pants', 'skirts'], true) && ($bottomsLengthType === null || $bottomsLengthType === '')) {
            self::throwBottomsLengthTypeRequiredError();
        }

        if (
            $category === 'legwear'
            && in_array($resolvedLegwearType, ['socks', 'leggings'], true)
            && ($coverageType === null || $coverageType === '')
        ) {
            self::throwCoverageTypeRequiredError();
        }

        if ($coverageType === null || $coverageType === '') {
            return;
        }

        if ($category !== 'legwear') {
            self::throwCoverageTypeError();
        }

        $allowedCoverageTypes = match ($resolvedLegwearType) {
            'socks' => ['ankle_socks', 'crew_socks', 'knee_socks', 'over_knee'],
            'leggings' => ['leggings_cropped', 'leggings_full'],
            'stockings' => ['stockings'],
            'tights' => ['tights'],
            default => null,
        };

        if ($allowedCoverageTypes === null || ! in_array($coverageType, $allowedCoverageTypes, true)) {
            self::throwCoverageTypeError();
        }
    }

    private static function throwCoverageTypeError(): never
    {
        throw ValidationException::withMessages([
            'spec.legwear.coverage_type' => '選択した形では、このレッグウェア詳細を保存できません。',
        ]);
    }

    private static function throwBottomsLengthTypeRequiredError(): never
    {
        throw ValidationException::withMessages([
            'spec.bottoms.length_type' => 'ボトムス丈を選択してください。',
        ]);
    }

    private static function throwCoverageTypeRequiredError(): never
    {
        throw ValidationException::withMessages([
            'spec.legwear.coverage_type' => 'レッグウェアを選択してください。',
        ]);
    }
}
