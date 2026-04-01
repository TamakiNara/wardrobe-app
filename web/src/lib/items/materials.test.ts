import { describe, expect, it } from "vitest";
import {
  createEmptyItemMaterialRow,
  validateItemMaterials,
} from "@/lib/items/materials";

describe("validateItemMaterials", () => {
  it("空行は payload から除外する", () => {
    const result = validateItemMaterials([createEmptyItemMaterialRow()]);

    expect(result.payload).toEqual([]);
    expect(result.errors).toEqual({});
  });

  it("区分ごとの合計が100でないと errors.materials を返す", () => {
    const result = validateItemMaterials([
      {
        id: "row-1",
        part_label: "本体",
        material_name: "綿",
        ratio: "70",
      },
      {
        id: "row-2",
        part_label: "本体",
        material_name: "ポリエステル",
        ratio: "20",
      },
    ]);

    expect(result.errors.materials).toBe(
      "区分ごとの合計を100%にしてください。（本体: 90%）",
    );
  });

  it("同一区分内の同素材重複を弾く", () => {
    const result = validateItemMaterials([
      {
        id: "row-1",
        part_label: "本体",
        material_name: "綿",
        ratio: "50",
      },
      {
        id: "row-2",
        part_label: "本体",
        material_name: "綿",
        ratio: "50",
      },
    ]);

    expect(result.errors["materials.1.material_name"]).toBe(
      "同じ区分内で同じ素材は重複登録できません。",
    );
  });
});
