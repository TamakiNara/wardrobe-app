// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import WearLogModalColorThumbnail from "./wear-log-modal-color-thumbnail";

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

describe("WearLogModalColorThumbnail", () => {
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

  it("tops / bottoms / others の構成に応じて簡略版サムネイルを描画する", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogModalColorThumbnail, {
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
      container.querySelector('[data-testid="wear-log-modal-thumbnail-tops"]'),
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="wear-log-modal-thumbnail-lower-body"]',
      ),
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="wear-log-modal-thumbnail-others"]',
      ),
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="wear-log-modal-thumbnail-others-full"]',
      ),
    ).toBeNull();
  });

  it("bottoms がある場合は modal でも lower-body preview を優先する", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogModalColorThumbnail, {
          items: [
            {
              ...renderThumbnailItem(1, "bottoms", [
                { role: "main", hex: "#111111", label: "黒" },
              ]),
              shape: "pants",
              spec: { bottoms: { length_type: "full" } },
            },
            {
              ...renderThumbnailItem(2, "legwear", [
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
      container.querySelector(
        '[data-testid="wear-log-modal-thumbnail-lower-body"]',
      ),
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="wear-log-modal-thumbnail-bottoms"]',
      ),
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="wear-log-modal-thumbnail-others"]',
      ),
    ).toBeNull();
    expect(
      container
        .querySelector('[data-testid="lower-body-skin-base"]')
        ?.getAttribute("fill"),
    ).toBe("#E9C29B");
  });

  it("onepiece + bottoms は modal でも dedicated mode で描画する", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogModalColorThumbnail, {
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
          ],
          skinTonePreset: "yellow_medium",
        }),
      );
    });

    expect(
      container.querySelector(
        '[data-testid="wear-log-modal-thumbnail-onepiece-allinone-main"]',
      ),
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="wear-log-modal-thumbnail-onepiece-allinone-layer"]',
      ),
    ).not.toBeNull();
    expect(
      container
        .querySelector('[data-testid="lower-body-skin-base"]')
        ?.getAttribute("fill"),
    ).toBe("#E9C29B");
  });

  it("others のみの場合は全体を others で使う", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogModalColorThumbnail, {
          items: [
            renderThumbnailItem(1, "outer", [
              { role: "main", hex: "#888888", label: "グレー" },
            ]),
          ],
        }),
      );
    });

    expect(
      container.querySelector(
        '[data-testid="wear-log-modal-thumbnail-others-full"]',
      ),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="wear-log-modal-thumbnail-tops"]'),
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="wear-log-modal-thumbnail-bottoms"]',
      ),
    ).toBeNull();
  });
});
