// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryGroupRecord } from "@/types/categories";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const fetchCategoryGroupsMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const routerMock = { push: pushMock, refresh: refreshMock };

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
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

vi.mock("@/components/items/color-chip", () => ({
  default: () => React.createElement("div"),
}));

vi.mock("@/components/items/color-select", () => ({
  default: () => React.createElement("div"),
}));

vi.mock("@/components/items/item-preview-card", () => ({
  default: () => React.createElement("div"),
}));

const sampleGroups: CategoryGroupRecord[] = [
  {
    id: "tops",
    name: "トップス",
    sortOrder: 10,
    categories: [
      { id: "tops_tshirt", groupId: "tops", name: "Tシャツ", sortOrder: 10 },
    ],
  },
  {
    id: "dress",
    name: "ワンピース・オールインワン",
    sortOrder: 20,
    categories: [
      { id: "dress_onepiece", groupId: "dress", name: "ワンピース", sortOrder: 10 },
    ],
  },
  {
    id: "inner",
    name: "ルームウェア・インナー",
    sortOrder: 30,
    categories: [
      { id: "inner_roomwear", groupId: "inner", name: "ルームウェア", sortOrder: 10 },
    ],
  },
];

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("NewItemPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "dress_onepiece", "inner_roomwear"],
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("表示設定に含まれる dress と inner をカテゴリ候補に含める", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect = container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    const optionLabels = Array.from(categorySelect!.options).map((option) => option.textContent);
    expect(optionLabels).toEqual([
      "選択してください",
      "トップス",
      "ワンピース・オールインワン",
      "ルームウェア・インナー",
    ]);
  });
});
