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
    category,
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
      container.querySelector('[data-testid="wear-log-modal-thumbnail-tops"]'),
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="wear-log-modal-thumbnail-bottoms"]',
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
