import type { ItemMaterialRecord } from "@/types/items";

export const ITEM_MATERIAL_PART_OPTIONS = [
  "本体",
  "裏地",
  "別布",
  "リブ",
] as const;

export const ITEM_MATERIAL_NAME_OPTIONS = [
  "綿",
  "ポリエステル",
  "レーヨン",
  "ナイロン",
  "アクリル",
  "毛",
  "ポリウレタン",
  "麻",
  "再生繊維",
  "合成皮革",
] as const;

export type EditableItemMaterial = {
  id: string;
  part_label: string;
  material_name: string;
  ratio: string;
};

type ItemMaterialValidationResult = {
  payload: ItemMaterialRecord[];
  errors: Record<string, string>;
  totals: Array<{ partLabel: string; total: number }>;
};

let nextMaterialRowId = 1;

export function createEmptyItemMaterialRow(): EditableItemMaterial {
  const rowId = nextMaterialRowId;
  nextMaterialRowId += 1;

  return {
    id: `material-row-${rowId}`,
    part_label: "",
    material_name: "",
    ratio: "",
  };
}

export function buildEditableItemMaterials(
  materials?: ItemMaterialRecord[] | null,
): EditableItemMaterial[] {
  if (!materials || materials.length === 0) {
    return [createEmptyItemMaterialRow()];
  }

  return materials.map((material) => ({
    id: createEmptyItemMaterialRow().id,
    part_label: material.part_label,
    material_name: material.material_name,
    ratio: String(material.ratio),
  }));
}

export function validateItemMaterials(
  rows: EditableItemMaterial[],
): ItemMaterialValidationResult {
  const errors: Record<string, string> = {};
  const payload: ItemMaterialRecord[] = [];
  const totalsByPart = new Map<string, number>();
  const seenMaterialsByPart = new Map<string, Set<string>>();

  rows.forEach((row, index) => {
    const partLabel = row.part_label.trim();
    const materialName = row.material_name.trim();
    const ratioText = row.ratio.trim();
    const isBlank = partLabel === "" && materialName === "" && ratioText === "";

    if (isBlank) {
      return;
    }

    if (partLabel === "" || materialName === "" || ratioText === "") {
      errors[`materials.${index}`] =
        "素材明細は区分・素材名・混率をすべて入力してください。";
      return;
    }

    if (!/^\d+$/.test(ratioText)) {
      errors[`materials.${index}.ratio`] =
        "混率は1〜100の整数で入力してください。";
      return;
    }

    const ratio = Number(ratioText);

    if (ratio < 1 || ratio > 100) {
      errors[`materials.${index}.ratio`] =
        "混率は1〜100の整数で入力してください。";
      return;
    }

    const normalizedMaterialName = materialName.toLocaleLowerCase("ja-JP");
    const currentMaterials =
      seenMaterialsByPart.get(partLabel) ?? new Set<string>();

    if (currentMaterials.has(normalizedMaterialName)) {
      errors[`materials.${index}.material_name`] =
        "同じ区分内で同じ素材は重複登録できません。";
      return;
    }

    currentMaterials.add(normalizedMaterialName);
    seenMaterialsByPart.set(partLabel, currentMaterials);
    totalsByPart.set(partLabel, (totalsByPart.get(partLabel) ?? 0) + ratio);
    payload.push({
      part_label: partLabel,
      material_name: materialName,
      ratio,
    });
  });

  const totals = Array.from(totalsByPart.entries())
    .map(([partLabel, total]) => ({ partLabel, total }))
    .sort((left, right) => comparePartLabels(left.partLabel, right.partLabel));

  const invalidTotal = totals.find((entry) => entry.total !== 100);

  if (invalidTotal) {
    errors.materials = `区分ごとの合計を100%にしてください。（${invalidTotal.partLabel}: ${invalidTotal.total}%）`;
  }

  return { payload, errors, totals };
}

export function groupItemMaterialsForDisplay(
  materials?: ItemMaterialRecord[] | null,
): Array<{ partLabel: string; labels: string[] }> {
  if (!materials || materials.length === 0) {
    return [];
  }

  const grouped = new Map<string, string[]>();

  materials.forEach((material) => {
    const entries = grouped.get(material.part_label) ?? [];
    entries.push(`${material.material_name} ${material.ratio}%`);
    grouped.set(material.part_label, entries);
  });

  return Array.from(grouped.entries())
    .map(([partLabel, labels]) => ({ partLabel, labels }))
    .sort((left, right) => comparePartLabels(left.partLabel, right.partLabel));
}

function comparePartLabels(left: string, right: string): number {
  const leftIndex = ITEM_MATERIAL_PART_OPTIONS.indexOf(
    left as (typeof ITEM_MATERIAL_PART_OPTIONS)[number],
  );
  const rightIndex = ITEM_MATERIAL_PART_OPTIONS.indexOf(
    right as (typeof ITEM_MATERIAL_PART_OPTIONS)[number],
  );

  if (leftIndex >= 0 && rightIndex >= 0) {
    return leftIndex - rightIndex;
  }

  if (leftIndex >= 0) {
    return -1;
  }

  if (rightIndex >= 0) {
    return 1;
  }

  return left.localeCompare(right, "ja");
}
