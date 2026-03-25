<?php

namespace App\Support;

class BrandNormalizer
{
    public static function normalizeName(string $value): string
    {
        $normalized = mb_convert_kana($value, 'as', 'UTF-8');
        $normalized = preg_replace('/\s+/u', ' ', trim($normalized)) ?? trim($normalized);

        return mb_strtolower($normalized, 'UTF-8');
    }

    public static function normalizeKana(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        if ($trimmed === '') {
            return null;
        }

        $normalized = mb_convert_kana($trimmed, 'c', 'UTF-8');
        $normalized = preg_replace('/\s+/u', ' ', trim($normalized)) ?? trim($normalized);

        return $normalized === '' ? null : $normalized;
    }
}
