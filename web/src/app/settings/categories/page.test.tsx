// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryGroupRecord } from "@/types/categories";
import type { ItemRecord } from "@/types/items";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
let searchParamsValue = "";
const fetchCategoryGroupsMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const updateCategoryVisibilitySettingsMock = vi.fn();
const fetchItemsMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(searchParamsValue),
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

vi.mock("@/lib/api/items", () => ({
  fetchItems: fetchItemsMock,
}));

vi.mock("@/lib/api/settings", () => ({
  fetchCategoryVisibilitySettings: fetchCategoryVisibilitySettingsMock,
  updateCategoryVisibilitySettings: updateCategoryVisibilitySettingsMock,
}));

const sampleGroups: CategoryGroupRecord[] = [
  {
    id: "tops",
    name: "トップス",
    sortOrder: 10,
    categories: [
      {
        id: "tops_tshirt_cutsew",
        groupId: "tops",
        name: "Tシャツ・カットソー",
        sortOrder: 10,
      },
      {
        id: "tops_shirt_blouse",
        groupId: "tops",
        name: "シャツ・ブラウス",
        sortOrder: 20,
      },
    ],
  },
];

const sampleItems: ItemRecord[] = [
  {
    id: 1,
    name: "白T",
    status: "active",
    category: "tops",
    shape: "tshirt",
    colors: [],
    seasons: [],
    tpos: [],
  },
];

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function getSaveButtons(container: HTMLDivElement) {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>("button"),
  ).filter(
    (button) =>
      button.textContent === "表示設定を保存" ||
      button.textContent === "保存してはじめる" ||
      button.textContent === "保存中..." ||
      button.textContent === "変更なし",
  );
}

function getCategoryCheckboxes(container: HTMLDivElement) {
  return Array.from(
    container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
  ).filter((input) => input.id === "");
}

describe("SettingsCategoriesPage", () => {
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
      visibleCategoryIds: ["tops_tshirt_cutsew"],
    });
    fetchItemsMock.mockResolvedValue(sampleItems);
    searchParamsValue = "";
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("カテゴリ表示設定の初期表示を描画できる", async () => {
    const { default: SettingsCategoriesPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsCategoriesPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("カテゴリ表示設定");
    expect(container.textContent).toContain(
      "ON にしたカテゴリのみ、登録や選択時に表示されます。",
    );
    expect(container.textContent).toContain("1 / 2");
    expect(container.innerHTML).toContain('href="/settings"');

    const checkboxes = getCategoryCheckboxes(container);
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]?.checked).toBe(true);
    expect(checkboxes[1]?.checked).toBe(false);
  });

  it("未保存変更があると保存ボタンが有効になり、保存後に戻る", async () => {
    updateCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt_cutsew", "tops_shirt_blouse"],
    });

    const { default: SettingsCategoriesPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsCategoriesPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("カテゴリ表示設定");
    expect(getSaveButtons(container)).toHaveLength(2);
    expect(getSaveButtons(container).every((button) => button.disabled)).toBe(
      true,
    );

    const checkboxes = getCategoryCheckboxes(container);

    await act(async () => {
      checkboxes[1]!.click();
      await waitForEffects();
    });

    expect(getSaveButtons(container).every((button) => !button.disabled)).toBe(
      true,
    );

    await act(async () => {
      getSaveButtons(container)[0].click();
      await waitForEffects();
    });

    expect(updateCategoryVisibilitySettingsMock).toHaveBeenCalledWith({
      visibleCategoryIds: ["tops_shirt_blouse", "tops_tshirt_cutsew"],
    });
    expect(getSaveButtons(container).every((button) => button.disabled)).toBe(
      true,
    );
  });

  it("custom onboarding では初期状態で保存でき、保存後にホームへ進む", async () => {
    searchParamsValue = "mode=onboarding&preset=custom";
    updateCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_shirt_blouse", "tops_tshirt_cutsew"],
    });

    const { default: SettingsCategoriesPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsCategoriesPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("カテゴリ表示設定");
    const checkboxes = getCategoryCheckboxes(container);
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]?.checked).toBe(true);
    expect(checkboxes[1]?.checked).toBe(true);

    const saveButtons = getSaveButtons(container);
    expect(saveButtons).toHaveLength(2);
    expect(saveButtons.every((button) => !button.disabled)).toBe(true);
    expect(saveButtons[0].textContent).toBe("保存してはじめる");

    await act(async () => {
      saveButtons[0].click();
      await waitForEffects();
    });

    expect(updateCategoryVisibilitySettingsMock).toHaveBeenCalledWith({
      visibleCategoryIds: ["tops_shirt_blouse", "tops_tshirt_cutsew"],
    });
    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
