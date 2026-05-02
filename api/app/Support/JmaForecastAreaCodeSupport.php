<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class JmaForecastAreaCodeSupport
{
    public static function deriveOfficeCodeFromRegionCode(?string $regionCode): ?string
    {
        if (! self::isValidCodeFormat($regionCode)) {
            return null;
        }

        return substr($regionCode, 0, 3).'000';
    }

    public static function validateRegionOfficePair(
        ?string $regionCode,
        ?string $officeCode,
        string $regionField = 'jma_forecast_region_code',
        string $officeField = 'jma_forecast_office_code',
    ): void {
        $normalizedRegionCode = self::normalizeCode($regionCode);
        $normalizedOfficeCode = self::normalizeCode($officeCode);

        if ($normalizedRegionCode === null && $normalizedOfficeCode === null) {
            return;
        }

        if ($normalizedRegionCode === null || $normalizedOfficeCode === null) {
            throw ValidationException::withMessages([
                $regionField => 'JMA予報区域コードとJMA府県予報区コードはセットで指定してください。',
                $officeField => 'JMA予報区域コードとJMA府県予報区コードはセットで指定してください。',
            ]);
        }

        if (! self::isValidCodeFormat($normalizedRegionCode)) {
            throw ValidationException::withMessages([
                $regionField => 'JMA予報区域コードの形式が不正です。',
            ]);
        }

        if (! self::isValidCodeFormat($normalizedOfficeCode)) {
            throw ValidationException::withMessages([
                $officeField => 'JMA府県予報区コードの形式が不正です。',
            ]);
        }

        $expectedOfficeCode = self::deriveOfficeCodeFromRegionCode($normalizedRegionCode);

        if ($expectedOfficeCode !== $normalizedOfficeCode) {
            throw ValidationException::withMessages([
                $regionField => 'JMA予報区域コードとJMA府県予報区コードの組み合わせが不正です。',
                $officeField => 'JMA予報区域コードとJMA府県予報区コードの組み合わせが不正です。',
            ]);
        }
    }

    public static function normalizeCode(?string $code): ?string
    {
        if ($code === null) {
            return null;
        }

        $normalized = trim($code);

        return $normalized === '' ? null : $normalized;
    }

    public static function isValidCodeFormat(?string $code): bool
    {
        if ($code === null) {
            return false;
        }

        return preg_match('/^\d{6}$/', $code) === 1;
    }
}
