<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class ItemMaterialValidator
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public static function validate(array $validated): void
    {
        $materials = $validated['materials'] ?? null;

        if (! is_array($materials) || $materials === []) {
            return;
        }

        $errors = [];
        $partTotals = [];
        $partMaterials = [];

        foreach ($materials as $index => $material) {
            $partLabel = ItemMaterialSupport::normalizeText($material['part_label'] ?? null);
            $materialName = ItemMaterialSupport::normalizeText($material['material_name'] ?? null);
            $ratio = (int) ($material['ratio'] ?? 0);

            if ($partLabel === '' || $materialName === '' || $ratio === 0) {
                $errors["materials.{$index}"] = '素材明細は区分・素材名・混率をすべて入力してください。';

                continue;
            }

            $partTotals[$partLabel] = ($partTotals[$partLabel] ?? 0) + $ratio;
            $materialKey = mb_strtolower($materialName);

            if (isset($partMaterials[$partLabel][$materialKey])) {
                $errors["materials.{$index}.material_name"] = '同じ区分内で同じ素材は重複登録できません。';

                continue;
            }

            $partMaterials[$partLabel][$materialKey] = true;
        }

        foreach ($partTotals as $partLabel => $total) {
            if ($total !== 100) {
                $errors['materials'] = sprintf('区分ごとの合計を100%%にしてください。（%s: %d%%）', $partLabel, $total);
                break;
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }
}
