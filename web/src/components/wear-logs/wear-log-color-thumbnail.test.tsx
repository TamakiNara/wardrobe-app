// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import WearLogColorThumbnail from "./wear-log-color-thumbnail";

function renderThumbnailItem(
  sourceItemId: number | null,
  category: string | null,
  colors: Array<{
    role: "main" | "sub";
    hex: string;
    label?: string | null;
  }>,
) {
  return {
    source_item_id: sourceItemId,
    sort_order: sourceItemId ?? 0,
    category,
    shape: null,
    spec: null,
    colors: colors.map((color) => ({
      role: color.role,
      hex: color.hex,
      label: color.label ?? null,
    })),
  };
}

describe("WearLogColorThumbnail", () => {
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
        React.createElement(WearLogColorThumbnail, {
          items: [
            renderThumbnailItem(1, "tops", [
              { role: "main", hex: "#ffffff", label: "白" },
            ]),
            {
              ...renderThumbnailItem(2, "bottoms", [
                { role: "main", hex: "#111111", label: "黒" },
              ]),
              shape: "pants",
              spec: { bottoms: { length_type: "full" } },
            },
            renderThumbnailItem(3, "shoes", [
              { role: "main", hex: "#224488", label: "青" },
            ]),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-tops"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-lower-body"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-main-top"]')
        ?.className,
    ).toContain("h-1/2");
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-main-bottom"]')
        ?.className,
    ).toContain("h-1/2");
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others-bar"]')
        ?.className,
    ).toContain("h-[0.875rem]");
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others-full"]'),
    ).toBeNull();
  });

  it("bottoms がある場合は legwear を others ではなく lower-body preview で描画する", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogColorThumbnail, {
          items: [
            renderThumbnailItem(1, "tops", [
              { role: "main", hex: "#ffffff", label: "白" },
            ]),
            {
              ...renderThumbnailItem(2, "bottoms", [
                { role: "main", hex: "#111111", label: "黒" },
              ]),
              shape: "pants",
              spec: { bottoms: { length_type: "full" } },
            },
            {
              ...renderThumbnailItem(3, "legwear", [
                { role: "main", hex: "#888888", label: "グレー" },
              ]),
              shape: "socks",
              spec: { legwear: { coverage_type: "crew_socks" } },
            },
          ],
          skinTonePreset: "yellow_medium",
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-lower-body"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-bottoms"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="lower-body-preview-svg"]'),
    ).not.toBeNull();
    expect(
      container
        .querySelector('[data-testid="lower-body-skin-base"]')
        ?.getAttribute("fill"),
    ).toBe("#E9C29B");
  });

  it("onepiece + bottoms は dedicated mode のまま縮小最適化しつつ others バーを維持する", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogColorThumbnail, {
          items: [
            {
              ...renderThumbnailItem(1, "tops", [
                { role: "main", hex: "#ffffff", label: "白" },
              ]),
              shape: "tshirt",
              sort_order: 1,
            },
            {
              ...renderThumbnailItem(2, "onepiece_allinone", [
                { role: "main", hex: "#223355", label: "ネイビー" },
                { role: "sub", hex: "#e5d8bd", label: "ベージュ" },
              ]),
              shape: "onepiece",
              sort_order: 3,
            },
            {
              ...renderThumbnailItem(3, "bottoms", [
                { role: "main", hex: "#111111", label: "黒" },
              ]),
              shape: "pants",
              sort_order: 4,
              spec: { bottoms: { length_type: "full" } },
            },
            {
              ...renderThumbnailItem(4, "legwear", [
                { role: "main", hex: "#888888", label: "グレー" },
              ]),
              shape: "socks",
              sort_order: 5,
              spec: { legwear: { coverage_type: "crew_socks" } },
            },
            {
              ...renderThumbnailItem(5, "shoes", [
                { role: "main", hex: "#cccccc", label: "グレー" },
              ]),
              shape: "sneakers",
              sort_order: 6,
            },
          ],
          skinTonePreset: "yellow_medium",
        }),
      );
    });

    expect(
      container.querySelector(
        '[data-testid="wear-log-thumbnail-onepiece-allinone-main"]',
      ),
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="wear-log-thumbnail-onepiece-allinone-layer"]',
      ),
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="wear-log-thumbnail-onepiece-allinone-lower-body"]',
      ),
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="wear-log-thumbnail-onepiece-allinone-top-underlay"]',
      ),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others-bar"]'),
    ).not.toBeNull();
    expect(
      container
        .querySelector('[data-testid="lower-body-skin-base"]')
        ?.getAttribute("fill"),
    ).toBe("#E9C29B");
    expect(
      container
        .querySelector(
          '[data-testid="wear-log-thumbnail-onepiece-allinone-layer"]',
        )
        ?.getAttribute("style"),
    ).toContain("bottom: 8%");
    expect(
      container
        .querySelector(
          '[data-testid="wear-log-thumbnail-onepiece-allinone-top-underlay"]',
        )
        ?.getAttribute("style"),
    ).toContain("height: 10%");
    expect(
      container
        .querySelector(
          '[data-testid="wear-log-thumbnail-onepiece-allinone-lower-body"]',
        )
        ?.getAttribute("style"),
    ).toContain("height: 14%");
  });

  it("allinone + bottoms は standard mode のまま描画する", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogColorThumbnail, {
          items: [
            {
              ...renderThumbnailItem(1, "onepiece_allinone", [
                { role: "main", hex: "#111111", label: "黒" },
              ]),
              shape: "allinone",
              sort_order: 1,
            },
            {
              ...renderThumbnailItem(2, "bottoms", [
                { role: "main", hex: "#444444", label: "グレー" },
              ]),
              shape: "pants",
              sort_order: 2,
              spec: { bottoms: { length_type: "full" } },
            },
          ],
        }),
      );
    });

    expect(
      container.querySelector(
        '[data-testid="wear-log-thumbnail-onepiece-allinone-main"]',
      ),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-lower-body"]'),
    ).not.toBeNull();
  });

  it("tops / bottoms 両方ありで others がない場合は 2 層だけを使う", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogColorThumbnail, {
          items: [
            renderThumbnailItem(1, "tops", [
              { role: "main", hex: "#ffffff", label: "白" },
            ]),
            renderThumbnailItem(2, "bottoms", [
              { role: "main", hex: "#111111", label: "黒" },
            ]),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-main-top"]')
        ?.className,
    ).toContain("h-1/2");
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-main-bottom"]')
        ?.className,
    ).toContain("h-1/2");
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others-bar"]'),
    ).toBeNull();
  });

  it("tops のみ + others ありでは tops がメイン全体を使い、others バーを出す", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogColorThumbnail, {
          items: [
            renderThumbnailItem(1, "tops", [
              { role: "main", hex: "#ffffff", label: "白" },
            ]),
            renderThumbnailItem(2, "bag", [
              { role: "main", hex: "#111111", label: "黒" },
            ]),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-main-top"]')
        ?.className,
    ).toContain("h-full");
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-main-bottom"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others-bar"]'),
    ).not.toBeNull();
  });

  it("bottoms のみで others がない場合は bottoms が全体を使う", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogColorThumbnail, {
          items: [
            renderThumbnailItem(1, "bottoms", [
              { role: "main", hex: "#111111", label: "黒" },
            ]),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-main-top"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-main-bottom"]')
        ?.className,
    ).toContain("h-full");
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others-bar"]'),
    ).toBeNull();
  });

  it("others のみの場合は全体を others で使う", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogColorThumbnail, {
          items: [
            renderThumbnailItem(1, "outer", [
              { role: "main", hex: "#888888", label: "グレー" },
            ]),
            renderThumbnailItem(2, "shoes", [
              { role: "main", hex: "#222222", label: "黒" },
            ]),
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others-full"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-tops"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-bottoms"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others"]'),
    ).toBeNull();
  });

  it("bottoms がない legwear は others に戻さない", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogColorThumbnail, {
          items: [
            {
              ...renderThumbnailItem(1, "legwear", [
                { role: "main", hex: "#888888", label: "グレー" },
              ]),
              shape: "socks",
              spec: { legwear: { coverage_type: "crew_socks" } },
            },
          ],
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others-full"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-others"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-thumbnail-lower-body"]'),
    ).toBeNull();
  });

  it("main / sub color を 90 / 10 で描画し、sub なしでも表示できる", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogColorThumbnail, {
          items: [
            renderThumbnailItem(1, "tops", [
              { role: "main", hex: "#eeeeee", label: "白" },
              { role: "sub", hex: "#333333", label: "黒" },
            ]),
            renderThumbnailItem(2, "tops", [
              { role: "main", hex: "#2255cc", label: "青" },
            ]),
          ],
        }),
      );
    });

    const allBands = container.querySelectorAll(
      '[data-testid="wear-log-thumbnail-tops-segment"]',
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
        React.createElement(WearLogColorThumbnail, {
          items: [renderThumbnailItem(null, "tops", [])],
        }),
      );
    });

    const main = container.querySelector(
      '[data-testid="wear-log-thumbnail-tops-segment"] span > span',
    );
    expect(main?.getAttribute("style")).toContain("rgb(229, 231, 235)");
  });

  it("item が空でも白箱ではなくフォールバック色で描画する", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogColorThumbnail, {
          items: [],
        }),
      );
    });

    const main = container.querySelector(
      '[data-testid="wear-log-thumbnail-others-full-segment"] span > span',
    );
    expect(main?.getAttribute("style")).toContain("rgb(229, 231, 235)");
  });
});
