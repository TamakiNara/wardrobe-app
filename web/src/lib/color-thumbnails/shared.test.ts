import { describe, expect, it } from "vitest";
import {
  buildColorThumbnailLayout,
  buildColorThumbnailRoleLayout,
  resolveColorThumbnailGroup,
} from "./shared";

describe("resolveColorThumbnailGroup", () => {
  it("tops と outerwear を main_upper に分類する", () => {
    expect(resolveColorThumbnailGroup("tops")).toBe("main_upper");
    expect(resolveColorThumbnailGroup("outerwear")).toBe("main_upper");
  });

  it("pants / skirts / legwear を main_lower に分類する", () => {
    expect(resolveColorThumbnailGroup("pants")).toBe("main_lower");
    expect(resolveColorThumbnailGroup("skirts")).toBe("main_lower");
    expect(resolveColorThumbnailGroup("legwear")).toBe("main_lower");
  });

  it("onepiece / allinone / swimwear / kimono を main_full に分類する", () => {
    expect(resolveColorThumbnailGroup("onepiece_dress")).toBe("main_full");
    expect(resolveColorThumbnailGroup("onepiece_allinone")).toBe("main_full");
    expect(resolveColorThumbnailGroup("allinone")).toBe("main_full");
    expect(resolveColorThumbnailGroup("swimwear")).toBe("main_full");
    expect(resolveColorThumbnailGroup("kimono")).toBe("main_full");
  });

  it("bags / shoes / fashion_accessories を support に分類する", () => {
    expect(resolveColorThumbnailGroup("bags")).toBe("support");
    expect(resolveColorThumbnailGroup("shoes")).toBe("support");
    expect(resolveColorThumbnailGroup("fashion_accessories")).toBe("support");
  });

  it("inner を hidden に分類する", () => {
    expect(resolveColorThumbnailGroup("inner")).toBe("hidden");
    expect(resolveColorThumbnailGroup("roomwear_inner")).toBe("hidden");
  });
});

describe("buildColorThumbnailRoleLayout", () => {
  it("hidden を残しつつ support と main_upper を分ける", () => {
    const layout = buildColorThumbnailRoleLayout([
      { id: 1, category: "tops", colors: [{ role: "main", hex: "#ffffff" }] },
      {
        id: 2,
        category: "outerwear",
        colors: [{ role: "main", hex: "#111111" }],
      },
      { id: 3, category: "bags", colors: [{ role: "main", hex: "#222222" }] },
      { id: 4, category: "inner", colors: [{ role: "main", hex: "#333333" }] },
    ]);

    expect(layout.mainUpper).toHaveLength(2);
    expect(layout.support).toHaveLength(1);
    expect(layout.hidden).toHaveLength(1);
  });
});

describe("buildColorThumbnailLayout", () => {
  it("support だけが others に入り、outerwear は tops 側へ入る", () => {
    const layout = buildColorThumbnailLayout([
      {
        id: 1,
        category: "outerwear",
        colors: [{ role: "main", hex: "#111111" }],
      },
      { id: 2, category: "bags", colors: [{ role: "main", hex: "#222222" }] },
      { id: 3, category: "inner", colors: [{ role: "main", hex: "#333333" }] },
    ]);

    expect(layout.tops).toHaveLength(1);
    expect(layout.others).toHaveLength(1);
    expect(layout.hasOthersBar).toBe(true);
    expect(layout.usesFullHeightForOthers).toBe(false);
  });

  it("main_full は従来互換で others 側へ流す", () => {
    const layout = buildColorThumbnailLayout([
      {
        id: 1,
        category: "onepiece_allinone",
        colors: [{ role: "main", hex: "#111111" }],
      },
    ]);

    expect(layout.tops).toHaveLength(0);
    expect(layout.bottoms).toHaveLength(0);
    expect(layout.others).toHaveLength(1);
    expect(layout.usesFullHeightForOthers).toBe(true);
  });
});
