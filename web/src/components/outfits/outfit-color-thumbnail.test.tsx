// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import OutfitColorThumbnail from "./outfit-color-thumbnail";

function renderOutfitItem(
  id: number,
  category: string,
  colors: Array<{
    role: "main" | "sub";
    mode?: "preset" | "custom";
    value?: string;
    hex: string;
    label: string;
  }>,
  options?: {
    sortOrder?: number;
    shape?: string;
    spec?: {
      bottoms?: { length_type?: string | null } | null;
      legwear?: { coverage_type?: string | null } | null;
    } | null;
  },
) {
  return {
    id,
    item_id: id,
    sort_order: options?.sortOrder ?? id,
    item: {
      id,
      name: `item-${id}`,
      category,
      shape: options?.shape ?? "shape",
      colors: colors.map((color) => ({
        role: color.role,
        mode: color.mode ?? "preset",
        value: color.value ?? color.label,
        hex: color.hex,
        label: color.label,
      })),
      spec: options?.spec ?? null,
    },
  };
}

describe("OutfitColorThumbnail", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("tops / bottoms / others の構成に応じてレイアウトが変わる", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(1, "tops", [
              { role: "main", hex: "#ffffff", label: "白" },
            ]),
            renderOutfitItem(2, "bottoms", [
              { role: "main", hex: "#111111", label: "黒" },
            ]),
            renderOutfitItem(3, "shoes", [
              { role: "main", hex: "#224488", label: "青" },
            ]),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="thumbnail-tops"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-lower-body"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-others"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-main-top"]')?.className,
    ).toContain("h-1/2");
    expect(
      container.querySelector('[data-testid="thumbnail-main-bottom"]')
        ?.className,
    ).toContain("h-1/2");
    expect(
      container.querySelector('[data-testid="thumbnail-others-bar"]')
        ?.className,
    ).toContain("h-[0.875rem]");
    expect(
      container.querySelector('[data-testid="thumbnail-others-full"]'),
    ).toBeNull();
  });

  it("tops / bottoms 両方ありで others がない場合は 2 層だけを使う", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(1, "tops", [
              { role: "main", hex: "#ffffff", label: "白" },
            ]),
            renderOutfitItem(2, "bottoms", [
              { role: "main", hex: "#111111", label: "黒" },
            ]),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="thumbnail-main-top"]')?.className,
    ).toContain("h-1/2");
    expect(
      container.querySelector('[data-testid="thumbnail-main-bottom"]')
        ?.className,
    ).toContain("h-1/2");
    expect(
      container.querySelector('[data-testid="thumbnail-others-bar"]'),
    ).toBeNull();
  });

  it("tops のみ + others ありでは tops がメイン全体を使い、others バーを出す", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(1, "tops", [
              { role: "main", hex: "#ffffff", label: "白" },
            ]),
            renderOutfitItem(2, "bag", [
              { role: "main", hex: "#111111", label: "黒" },
            ]),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="thumbnail-main-top"]')?.className,
    ).toContain("h-full");
    expect(
      container.querySelector('[data-testid="thumbnail-main-bottom"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-others-bar"]'),
    ).not.toBeNull();
  });

  it("bottoms のみで others がない場合は bottoms が全体を使う", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(1, "bottoms", [
              { role: "main", hex: "#111111", label: "黒" },
            ]),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="thumbnail-main-top"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-main-bottom"]')
        ?.className,
    ).toContain("h-full");
    expect(
      container.querySelector('[data-testid="thumbnail-others-bar"]'),
    ).toBeNull();
  });

  it("others のみの場合は全体を others で使う", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(1, "outer", [
              { role: "main", hex: "#888888", label: "グレー" },
            ]),
            renderOutfitItem(2, "shoes", [
              { role: "main", hex: "#222222", label: "黒" },
            ]),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="thumbnail-others-full"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-tops"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-bottoms"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-others"]'),
    ).toBeNull();
  });

  it("main / sub color を 90 / 10 で描画し、sub なしでも表示できる", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(1, "tops", [
              { role: "main", hex: "#eeeeee", label: "白" },
              { role: "sub", hex: "#333333", label: "黒" },
            ]),
            renderOutfitItem(2, "tops", [
              { role: "main", hex: "#2255cc", label: "青" },
            ]),
          ],
        }),
      );
    });

    const allBands = container.querySelectorAll(
      '[data-testid="thumbnail-tops-segment"]',
    );
    const firstMain = allBands[0]?.querySelector("span > span");
    const firstSub = allBands[0]?.querySelector("span > span + span");
    const secondMain = allBands[1]?.querySelector("span > span");
    const secondSub = allBands[1]?.querySelector("span > span + span");

    expect(firstMain?.getAttribute("style")).toContain("width: 90%");
    expect(firstMain?.getAttribute("style")).toContain("rgb(238, 238, 238)");
    expect(firstSub?.getAttribute("style")).toContain("width: 10%");
    expect(firstSub?.getAttribute("style")).toContain("rgb(51, 51, 51)");
    expect(secondMain?.getAttribute("style")).toContain("width: 100%");
    expect(secondSub).toBeNull();
  });

  it("色が取れない item はフォールバック色で描画する", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [renderOutfitItem(1, "tops", [])],
        }),
      );
    });

    const main = container.querySelector(
      '[data-testid="thumbnail-tops-segment"] span > span',
    );
    expect(main?.getAttribute("style")).toContain("rgb(229, 231, 235)");
  });

  it("representative bottoms があると lower-body preview を表示する", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(
              1,
              "bottoms",
              [
                { role: "main", hex: "#cbb79d", label: "ベージュ" },
                { role: "sub", hex: "#8a9099", label: "グレー" },
              ],
              {
                spec: { bottoms: { length_type: "midi" } },
              },
            ),
            renderOutfitItem(
              2,
              "legwear",
              [{ role: "main", hex: "#334155", label: "ネイビー" }],
              {
                shape: "socks",
                spec: { legwear: { coverage_type: "crew_socks" } },
              },
            ),
          ],
          skinTonePreset: "yellow_medium",
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="thumbnail-lower-body"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-bottoms"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-others"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-others-bar"]'),
    ).toBeNull();
    expect(
      container
        .querySelector('[data-testid="lower-body-skin-base"]')
        ?.getAttribute("fill"),
    ).toBe("#E9C29B");
    expect(
      container
        .querySelector('[data-testid="lower-body-skin-base"]')
        ?.getAttribute("x"),
    ).toBe("0");
    expect(
      container
        .querySelector('[data-testid="lower-body-skin-base"]')
        ?.getAttribute("y"),
    ).toBe("0");
  });

  it("legwear は others ではなく lower-body 専用として扱う", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(1, "tops", [
              { role: "main", hex: "#ffffff", label: "白" },
            ]),
            renderOutfitItem(
              2,
              "legwear",
              [{ role: "main", hex: "#334155", label: "ネイビー" }],
              {
                shape: "socks",
                spec: { legwear: { coverage_type: "crew_socks" } },
              },
            ),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="thumbnail-tops"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-others"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-others-bar"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="thumbnail-lower-body"]'),
    ).toBeNull();
  });

  it("representative bottoms がなければ lower-body preview を表示しない", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(1, "tops", [
              { role: "main", hex: "#ffffff", label: "白" },
            ]),
            renderOutfitItem(
              2,
              "legwear",
              [{ role: "main", hex: "#111111", label: "黒" }],
              {
                shape: "tights",
                spec: { legwear: { coverage_type: "tights" } },
              },
            ),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="thumbnail-lower-body"]'),
    ).toBeNull();
  });

  it("stockings 合成時は裾より下の露出領域だけに重ねる", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(
              1,
              "bottoms",
              [{ role: "main", hex: "#44516A", label: "ネイビー" }],
              {
                spec: { bottoms: { length_type: "knee" } },
              },
            ),
            renderOutfitItem(
              2,
              "legwear",
              [{ role: "main", hex: "#D8B89F", label: "ベージュ" }],
              {
                shape: "stockings",
                spec: { legwear: { coverage_type: "stockings" } },
              },
            ),
          ],
        }),
      );
    });

    expect(
      container
        .querySelector('[data-testid="bottoms-garment"]')
        ?.getAttribute("fill"),
    ).toBe("#44516A");
    expect(
      container
        .querySelector('[data-testid="legwear-overlay"]')
        ?.getAttribute("y"),
    ).not.toBe("0");
  });

  it("coverage_type 未設定の legwear でも full-length fallback として描画する", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(
              1,
              "bottoms",
              [{ role: "main", hex: "#44516A", label: "ネイビー" }],
              {
                spec: { bottoms: { length_type: "knee" } },
              },
            ),
            renderOutfitItem(
              2,
              "legwear",
              [{ role: "main", hex: "#334155", label: "ネイビー" }],
              {
                shape: "socks",
                spec: { legwear: {} },
              },
            ),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="thumbnail-lower-body"]'),
    ).not.toBeNull();
    expect(
      container
        .querySelector('[data-testid="legwear-overlay"]')
        ?.getAttribute("y"),
    ).toBe("0");
  });

  it("lower-body は legwear を先、その上に bottoms を重ねる", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(
              1,
              "bottoms",
              [{ role: "main", hex: "#44516A", label: "ネイビー" }],
              {
                spec: { bottoms: { length_type: "knee" } },
              },
            ),
            renderOutfitItem(
              2,
              "legwear",
              [{ role: "main", hex: "#334155", label: "ネイビー" }],
              {
                shape: "tights",
                spec: {},
              },
            ),
          ],
        }),
      );
    });

    const svg = container.querySelector(
      '[data-testid="lower-body-preview-svg"]',
    );
    const children = Array.from(
      svg?.querySelectorAll("[data-testid]") ?? [],
    ).map((node) => {
      return node.getAttribute("data-testid");
    });
    expect(children.indexOf("legwear-overlay")).toBeGreaterThan(-1);
    expect(children.indexOf("bottoms-garment")).toBeGreaterThan(-1);
    expect(children.indexOf("legwear-overlay")).toBeLessThan(
      children.indexOf("bottoms-garment"),
    );
  });
});
