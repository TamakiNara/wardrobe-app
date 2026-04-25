<?php

namespace App\Support;

class ItemColorSupport
{
    /**
     * @param  array<int, array<string, mixed>>  $colors
     * @return array<int, array<string, mixed>>
     */
    public static function normalize(array $colors): array
    {
        return collect($colors)
            ->values()
            ->map(function (array $color) {
                $normalized = [
                    'role' => $color['role'],
                    'mode' => $color['mode'],
                    'value' => $color['value'],
                    'hex' => $color['hex'],
                    'label' => $color['label'],
                ];

                if (($color['role'] ?? null) !== 'main') {
                    $normalized['custom_label'] = null;

                    return $normalized;
                }

                $customLabel = trim((string) ($color['custom_label'] ?? ''));
                $normalized['custom_label'] = $customLabel === '' ? null : $customLabel;

                return $normalized;
            })
            ->all();
    }
}
