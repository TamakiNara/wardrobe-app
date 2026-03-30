import { describe, expect, it } from "vitest";
import {
  buildOutfitLowerBodyPreviewSource,
  buildOutfitOnepieceAllinoneLowerBodyPreviewSource,
  selectRepresentativeBottoms,
  selectRepresentativeLegwear,
  selectRepresentativeOnepieceAllinone,
  type OutfitLowerBodyPreviewItem,
} from "./lower-body-preview";

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

describe("selectRepresentativeBottoms current 選定", () => {
  it("bottoms 複数時は sort_order 最小の有効 spec を採用する", () => {
    const representative = selectRepresentativeBottoms([
      createOutfitItem(10, 2, "bottoms", { bottoms: { length_type: "ankle" } }),
      createOutfitItem(11, 1, "bottoms", { bottoms: { length_type: "mini" } }),
    ]);

    expect(representative?.item.id).toBe(11);
  });

  it("先頭候補の spec 不足時は次候補へフォールバックする", () => {
    const representative = selectRepresentativeBottoms([
      createOutfitItem(10, 1, "bottoms", { bottoms: {} }),
      createOutfitItem(11, 2, "bottoms", { bottoms: { length_type: "full" } }),
    ]);

    expect(representative?.item.id).toBe(11);
  });

  it("全候補が無効でも先頭候補を採用する", () => {
    const representative = selectRepresentativeBottoms([
      createOutfitItem(10, 1, "bottoms", { bottoms: {} }),
      createOutfitItem(11, 2, "bottoms", { bottoms: {} }),
    ]);

    expect(representative?.item.id).toBe(10);
  });
});

describe("selectRepresentativeLegwear current 選定", () => {
  it("legwear 複数時は sort_order 最小の有効 spec を採用する", () => {
    const representative = selectRepresentativeLegwear([
      createOutfitItem(10, 1, "bottoms", { bottoms: { length_type: "midi" } }),
      createOutfitItem(
        20,
        2,
        "legwear",
        { legwear: { coverage_type: "knee_socks" } },
        "socks",
      ),
      createOutfitItem(
        21,
        1,
        "legwear",
        { legwear: { coverage_type: "crew_socks" } },
        "socks",
      ),
    ]);

    expect(representative?.item.id).toBe(21);
  });

  it("先頭候補の spec 不足時は次候補へフォールバックする", () => {
    const representative = selectRepresentativeLegwear([
      createOutfitItem(20, 1, "legwear", { legwear: {} }, "leggings"),
      createOutfitItem(
        21,
        2,
        "legwear",
        { legwear: { coverage_type: "leggings_full" } },
        "leggings",
      ),
    ]);

    expect(representative?.item.id).toBe(21);
  });

  it("legwear の全候補が無効なら先頭候補を代表として返す", () => {
    const representative = selectRepresentativeLegwear([
      createOutfitItem(20, 1, "legwear", { legwear: {} }, "socks"),
      createOutfitItem(21, 2, "legwear", { legwear: {} }, "leggings"),
    ]);

    expect(representative?.item.id).toBe(20);
  });

  it("stockings は coverage_type 未設定でも representative 候補に残る", () => {
    const representative = selectRepresentativeLegwear([
      createOutfitItem(20, 1, "legwear", { legwear: {} }, "stockings"),
    ]);

    expect(representative?.item.id).toBe(20);
  });

  it("stockings / tights は固定 coverage_type を持つので後続候補より先に代表になりうる", () => {
    const representative = selectRepresentativeLegwear([
      createOutfitItem(20, 1, "legwear", { legwear: {} }, "stockings"),
      createOutfitItem(
        21,
        2,
        "legwear",
        { legwear: { coverage_type: "crew_socks" } },
        "socks",
      ),
    ]);

    expect(representative?.item.id).toBe(20);
  });
});

describe("selectRepresentativeOnepieceAllinone current 選定", () => {
  it("onepiece_allinone 候補は sort_order 最大を代表にする", () => {
    const representative = selectRepresentativeOnepieceAllinone([
      createOutfitItem(10, 1, "onepiece_allinone", null, "onepiece"),
      createOutfitItem(11, 3, "onepiece_allinone", null, "allinone"),
      createOutfitItem(12, 2, "tops", null, "tshirt"),
    ]);

    expect(representative?.item.id).toBe(11);
    expect(representative?.item.shape).toBe("allinone");
  });
});

describe("buildOutfitLowerBodyPreviewSource current source build", () => {
  it("bottoms がなければ preview source を作らない", () => {
    const source = buildOutfitLowerBodyPreviewSource([
      createOutfitItem(
        20,
        1,
        "legwear",
        { legwear: { coverage_type: "tights" } },
        "tights",
      ),
    ]);

    expect(source).toBeNull();
  });

  it("bottoms の全候補が無効でも先頭候補を full 扱いで採用する", () => {
    const source = buildOutfitLowerBodyPreviewSource([
      createOutfitItem(10, 1, "bottoms", { bottoms: {} }),
      createOutfitItem(11, 2, "bottoms", { bottoms: {} }),
      createOutfitItem(
        20,
        1,
        "legwear",
        { legwear: { coverage_type: "crew_socks" } },
        "socks",
      ),
    ]);

    expect(source?.representativeBottomsItemId).toBe(10);
    expect(source?.lengthType).toBe("full");
    expect(source?.representativeLegwearItemId).toBe(20);
  });

  it("先頭候補の spec 不足時は次候補へフォールバックする", () => {
    const source = buildOutfitLowerBodyPreviewSource([
      createOutfitItem(10, 1, "bottoms", { bottoms: {} }),
      createOutfitItem(11, 2, "bottoms", { bottoms: { length_type: "full" } }),
      createOutfitItem(20, 1, "legwear", { legwear: {} }, "leggings"),
      createOutfitItem(
        21,
        2,
        "legwear",
        { legwear: { coverage_type: "leggings_full" } },
        "leggings",
      ),
    ]);

    expect(source?.representativeBottomsItemId).toBe(11);
    expect(source?.representativeLegwearItemId).toBe(21);
    expect(source?.lengthType).toBe("full");
    expect(source?.coverageType).toBe("leggings_full");
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

describe("buildOutfitOnepieceAllinoneLowerBodyPreviewSource current source build", () => {
  it("onepiece は固定の裾位置で legwear を下側 preview に流用する", () => {
    const source = buildOutfitOnepieceAllinoneLowerBodyPreviewSource([
      createOutfitItem(10, 1, "onepiece_allinone", null, "onepiece"),
      createOutfitItem(
        20,
        2,
        "legwear",
        { legwear: { coverage_type: "stockings" } },
        "stockings",
      ),
    ]);

    expect(source?.representativeOnepieceAllinoneItemId).toBe(10);
    expect(source?.lengthType).toBe("midi");
    expect(source?.coverageType).toBe("stockings");
  });

  it("allinone は full 扱いで lower-body を見せない前提を返す", () => {
    const source = buildOutfitOnepieceAllinoneLowerBodyPreviewSource([
      createOutfitItem(10, 1, "onepiece_allinone", null, "allinone"),
    ]);

    expect(source?.representativeOnepieceAllinoneItemId).toBe(10);
    expect(source?.lengthType).toBe("full");
    expect(source?.coverageType).toBeNull();
  });
});
