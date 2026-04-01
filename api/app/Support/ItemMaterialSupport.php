<?php

namespace App\Support;

class ItemMaterialSupport
{
    private const DEFAULT_PART_ORDER = [
        '本体',
        '裏地',
        '別布',
        'リブ',
    ];

    /**
     * @param  array<int, array<string, mixed>>  $materials
     * @return array<int, array{part_label:string, material_name:string, ratio:int}>
     */
    public static function normalizeForStorage(array $materials): array
    {
        $normalized = array_map(function (array $material): array {
            return [
                'part_label' => self::normalizeText($material['part_label'] ?? null),
                'material_name' => self::normalizeText($material['material_name'] ?? null),
                'ratio' => (int) ($material['ratio'] ?? 0),
            ];
        }, $materials);

        usort($normalized, [self::class, 'compareMaterials']);

        return array_values($normalized);
    }

    /**
     * @param  array<int, array<string, mixed>>  $materials
     * @return array<int, array{part_label:string, material_name:string, ratio:int}>
     */
    public static function buildPayload(array $materials): array
    {
        return self::normalizeForStorage($materials);
    }

    public static function normalizeText(mixed $value): string
    {
        return trim((string) ($value ?? ''));
    }

    /**
     * @param  array{part_label:string, material_name:string, ratio:int}  $left
     * @param  array{part_label:string, material_name:string, ratio:int}  $right
     */
    private static function compareMaterials(array $left, array $right): int
    {
        $partOrder = self::comparePartLabel($left['part_label'], $right['part_label']);

        if ($partOrder !== 0) {
            return $partOrder;
        }

        if ($left['ratio'] !== $right['ratio']) {
            return $right['ratio'] <=> $left['ratio'];
        }

        return strcmp($left['material_name'], $right['material_name']);
    }

    private static function comparePartLabel(string $left, string $right): int
    {
        $leftIndex = array_search($left, self::DEFAULT_PART_ORDER, true);
        $rightIndex = array_search($right, self::DEFAULT_PART_ORDER, true);

        if ($leftIndex !== false && $rightIndex !== false) {
            return $leftIndex <=> $rightIndex;
        }

        if ($leftIndex !== false) {
            return -1;
        }

        if ($rightIndex !== false) {
            return 1;
        }

        return strcmp($left, $right);
    }
}
