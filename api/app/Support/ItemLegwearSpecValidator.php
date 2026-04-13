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
        $skirtLengthType = data_get($validated, 'spec.skirt.length_type');
        $legacySkirtLengthType = $category === 'skirts' ? $bottomsLengthType : null;
        $bottomsRiseType = data_get($validated, 'spec.bottoms.rise_type');
        $coverageType = data_get($validated, 'spec.legwear.coverage_type');
        $resolvedLegwearType = match ($subcategory) {
            'socks', 'stockings', 'tights', 'leggings', 'leg_warmer', 'other' => $subcategory,
            default => match ($shape) {
                'socks', 'stockings', 'tights', 'leggings' => $shape,
                'leg-warmer' => 'leg_warmer',
                default => null,
            },
        };

        if (in_array($category, ['bottoms', 'pants'], true) && ($bottomsLengthType === null || $bottomsLengthType === '')) {
            self::throwBottomsLengthTypeRequiredError();
        }

        if (
            $category === 'skirts'
            && ($skirtLengthType === null || $skirtLengthType === '')
            && ($legacySkirtLengthType === null || $legacySkirtLengthType === '')
        ) {
            self::throwSkirtLengthTypeRequiredError();
        }

        if (
            $bottomsRiseType !== null
            && $bottomsRiseType !== ''
            && ($category !== 'pants' || ! in_array($bottomsRiseType, ['high_waist', 'low_rise'], true))
        ) {
            self::throwBottomsRiseTypeError();
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
            'socks' => ['foot_cover', 'ankle_sneaker', 'crew', 'three_quarter', 'high_socks'],
            'leggings' => ['one_tenth', 'three_tenths', 'five_tenths', 'seven_tenths', 'seven_eighths', 'ten_tenths', 'twelve_tenths'],
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

    private static function throwSkirtLengthTypeRequiredError(): never
    {
        throw ValidationException::withMessages([
            'spec.skirt.length_type' => '丈を選択してください。',
        ]);
    }

    private static function throwCoverageTypeRequiredError(): never
    {
        throw ValidationException::withMessages([
            'spec.legwear.coverage_type' => 'レッグウェアを選択してください。',
        ]);
    }

    private static function throwBottomsRiseTypeError(): never
    {
        throw ValidationException::withMessages([
            'spec.bottoms.rise_type' => '選択した種類では、この股上は指定できません。',
        ]);
    }
}
