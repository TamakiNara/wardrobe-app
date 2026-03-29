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
    category,
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
            renderThumbnailItem(2, "bottoms", [
              { role: "main", hex: "#111111", label: "黒" },
            ]),
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
      container.querySelector('[data-testid="wear-log-thumbnail-bottoms"]'),
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

  it("main / sub color を 90 / 10 で描画し、sub なしでも表示できる", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogColorThumbnail, {
          items: [
            renderThumbnailItem(1, "tops", [
              { role: "main", hex: "#eeeeee", label: "白" },
              { role: "sub", hex: "#333333", label: "黒" },
            ]),
            renderThumbnailItem(2, "bottoms", [
              { role: "main", hex: "#2255cc", label: "青" },
            ]),
          ],
        }),
      );
    });

    const allBands = container.querySelectorAll(
      '[data-testid="wear-log-thumbnail-tops-segment"], [data-testid="wear-log-thumbnail-bottoms-segment"]',
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
