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
) {
  return {
    id,
    item_id: id,
    sort_order: id,
    item: {
      id,
      name: `item-${id}`,
      category,
      shape: "shape",
      colors: colors.map((color) => ({
        role: color.role,
        mode: color.mode ?? "preset",
        value: color.value ?? color.label,
        hex: color.hex,
        label: color.label,
      })),
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
            renderOutfitItem(1, "tops", [{ role: "main", hex: "#ffffff", label: "白" }]),
            renderOutfitItem(2, "bottoms", [{ role: "main", hex: "#111111", label: "黒" }]),
            renderOutfitItem(3, "shoes", [{ role: "main", hex: "#224488", label: "青" }]),
          ],
        }),
      );
    });

    expect(container.querySelector('[data-testid="thumbnail-tops"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="thumbnail-bottoms"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="thumbnail-others"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="thumbnail-others-full"]')).toBeNull();
  });

  it("others のみの場合は全体を others で使う", async () => {
    await act(async () => {
      root.render(
        React.createElement(OutfitColorThumbnail, {
          outfitItems: [
            renderOutfitItem(1, "outer", [{ role: "main", hex: "#888888", label: "グレー" }]),
            renderOutfitItem(2, "shoes", [{ role: "main", hex: "#222222", label: "黒" }]),
          ],
        }),
      );
    });

    expect(container.querySelector('[data-testid="thumbnail-others-full"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="thumbnail-tops"]')).toBeNull();
    expect(container.querySelector('[data-testid="thumbnail-bottoms"]')).toBeNull();
    expect(container.querySelector('[data-testid="thumbnail-others"]')).toBeNull();
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
            renderOutfitItem(2, "bottoms", [{ role: "main", hex: "#2255cc", label: "青" }]),
          ],
        }),
      );
    });

    const allBands = container.querySelectorAll('[data-testid="thumbnail-tops-segment"], [data-testid="thumbnail-bottoms-segment"]');
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

    const main = container.querySelector('[data-testid="thumbnail-tops-segment"] span > span');
    expect(main?.getAttribute("style")).toContain("rgb(229, 231, 235)");
  });
});
