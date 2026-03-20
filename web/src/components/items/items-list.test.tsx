// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryGroupRecord } from "@/types/categories";

const fetchCategoryGroupsMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/components/items/preview-svg/tops-preview-svg", () => ({
  default: () => React.createElement("div", { "data-testid": "tops-preview" }),
}));

vi.mock("@/lib/api/categories", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/categories")>(
    "@/lib/api/categories",
  );

  return {
    ...actual,
    fetchCategoryGroups: fetchCategoryGroupsMock,
  };
});

vi.mock("@/lib/api/settings", () => ({
  fetchCategoryVisibilitySettings: fetchCategoryVisibilitySettingsMock,
}));

const sampleGroups: CategoryGroupRecord[] = [
  {
    id: "tops",
    name: "トップス",
    sortOrder: 10,
    categories: [
      { id: "tops_tshirt", groupId: "tops", name: "Tシャツ", sortOrder: 10 },
      { id: "tops_shirt", groupId: "tops", name: "シャツ / ブラウス", sortOrder: 20 },
    ],
  },
];

const sampleItems = [
  {
    id: 1,
    name: "白T",
    category: "tops",
    shape: "tshirt",
    colors: [
      {
        role: "main",
        mode: "preset",
        value: "white",
        hex: "#eeeeee",
        label: "ホワイト",
      },
    ],
    seasons: ["夏"],
    tpos: ["休日"],
    spec: { tops: { shape: "tshirt", sleeve: "short" } },
  },
  {
    id: 2,
    name: "青シャツ",
    category: "tops",
    shape: "shirt",
    colors: [
      {
        role: "main",
        mode: "preset",
        value: "blue",
        hex: "#336699",
        label: "ブルー",
      },
    ],
    seasons: ["春"],
    tpos: ["仕事"],
    spec: { tops: { shape: "shirt", sleeve: "long" } },
  },
];

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("ItemsList", () => {
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

  it("カテゴリ表示設定に応じて一覧の表示対象を絞り込む", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(React.createElement(ItemsList, { items: sampleItems }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("表示件数： 1 / 1");
    expect(container.textContent).toContain("白T");
    expect(container.textContent).not.toContain("青シャツ");
  });

  it("季節は定義順で表示し、TPO は共通の候補だけを表示する", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(React.createElement(ItemsList, { items: sampleItems }));
      await waitForEffects();
    });

    const selects = Array.from(container.querySelectorAll("select"));
    const seasonOptions = Array.from(selects[1].querySelectorAll("option")).map(
      (option) => option.textContent,
    );
    const tpoOptions = Array.from(selects[2].querySelectorAll("option")).map(
      (option) => option.textContent,
    );

    expect(seasonOptions).toEqual(["すべて", "春", "夏"]);
    expect(tpoOptions).toEqual(["すべて", "仕事", "休日"]);
    expect(container.textContent).toContain("TPO： 仕事");
    expect(container.textContent).not.toContain("TPO： 通勤");
  });
});
