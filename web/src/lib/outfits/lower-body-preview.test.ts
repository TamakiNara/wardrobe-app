import { describe, expect, it } from "vitest";
import { buildOutfitLowerBodyPreviewSource, type OutfitLowerBodyPreviewItem } from "./lower-body-preview";

function createOutfitItem(
  id: number,
  sortOrder: number,
  category: string,
  spec: OutfitLowerBodyPreviewItem["item"]["spec"],
  shape = "shape",
) {
  return {
    sort_order: sortOrder,
    item: {
      id,
      category,
      shape,
      colors: [
        { role: "main" as const, hex: `#00000${id}`, label: `main-${id}` },
        { role: "sub" as const, hex: `#11111${id}`, label: `sub-${id}` },
      ],
      spec,
    },
  };
}

describe("buildOutfitLowerBodyPreviewSource", () => {
  it("bottoms 複数時は sort_order 最小の有効 spec を採用する", () => {
    const source = buildOutfitLowerBodyPreviewSource([
      createOutfitItem(10, 2, "bottoms", { bottoms: { length_type: "ankle" } }),
      createOutfitItem(11, 1, "bottoms", { bottoms: { length_type: "mini" } }),
    ]);

    expect(source?.representativeBottomsItemId).toBe(11);
    expect(source?.lengthType).toBe("mini");
  });

  it("legwear 複数時は sort_order 最小の有効 spec を採用する", () => {
    const source = buildOutfitLowerBodyPreviewSource([
      createOutfitItem(10, 1, "bottoms", { bottoms: { length_type: "midi" } }),
      createOutfitItem(20, 2, "legwear", { legwear: { coverage_type: "knee_socks" } }, "socks"),
      createOutfitItem(21, 1, "legwear", { legwear: { coverage_type: "crew_socks" } }, "socks"),
    ]);

    expect(source?.representativeLegwearItemId).toBe(21);
    expect(source?.coverageType).toBe("crew_socks");
  });

  it("先頭候補の spec 不足時は次候補へフォールバックする", () => {
    const source = buildOutfitLowerBodyPreviewSource([
      createOutfitItem(10, 1, "bottoms", { bottoms: {} }),
      createOutfitItem(11, 2, "bottoms", { bottoms: { length_type: "full" } }),
      createOutfitItem(20, 1, "legwear", { legwear: {} }, "leggings"),
      createOutfitItem(21, 2, "legwear", { legwear: { coverage_type: "leggings_full" } }, "leggings"),
    ]);

    expect(source?.representativeBottomsItemId).toBe(11);
    expect(source?.representativeLegwearItemId).toBe(21);
    expect(source?.lengthType).toBe("full");
    expect(source?.coverageType).toBe("leggings_full");
  });

  it("bottoms がなければ preview source を作らない", () => {
    const source = buildOutfitLowerBodyPreviewSource([
      createOutfitItem(20, 1, "legwear", { legwear: { coverage_type: "tights" } }, "tights"),
    ]);

    expect(source).toBeNull();
  });

  it("bottoms があり legwear がなければ bottoms のみで描画する source を返す", () => {
    const source = buildOutfitLowerBodyPreviewSource([
      createOutfitItem(10, 1, "bottoms", { bottoms: { length_type: "knee" } }),
    ]);

    expect(source?.representativeBottomsItemId).toBe(10);
    expect(source?.representativeLegwearItemId).toBeNull();
    expect(source?.coverageType).toBeNull();
  });
});
