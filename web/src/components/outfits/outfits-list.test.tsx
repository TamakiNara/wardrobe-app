// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchCategoryVisibilitySettingsMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/lib/api/settings", () => ({
  fetchCategoryVisibilitySettings: fetchCategoryVisibilitySettingsMock,
}));

const sampleOutfits = [
  {
    id: 1,
    name: "春コーディネート",
    memo: null,
    seasons: ["春"],
    tpos: ["休日"],
    outfitItems: [
      {
        id: 11,
        item_id: 101,
        sort_order: 0,
        item: {
          id: 101,
          name: "白T",
          category: "tops",
          shape: "tshirt",
          colors: [],
        },
      },
      {
        id: 12,
        item_id: 102,
        sort_order: 1,
        item: {
          id: 102,
          name: "シャツ",
          category: "tops",
          shape: "shirt",
          colors: [],
        },
      },
    ],
  },
];

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("OutfitsList", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
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

  it("カテゴリ表示設定に応じて表示アイテム数と案内を切り替える", async () => {
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });

    const { default: OutfitsList } = await import("./outfits-list");

    await act(async () => {
      root.render(React.createElement(OutfitsList, { outfits: sampleOutfits }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("表示アイテム数： 1");
    expect(container.textContent).toContain("現在の表示設定により 1 件を非表示にしています。");
  });
});
