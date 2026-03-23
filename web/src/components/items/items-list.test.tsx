// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryGroupRecord } from "@/types/categories";
import type { ItemRecord } from "@/types/items";

const fetchCategoryGroupsMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const replaceMock = vi.fn();
let searchParamsValue = "";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/items",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
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

const sampleItems: ItemRecord[] = [
  {
    id: 1,
    name: "白T",
    status: "active",
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
    status: "active",
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

const defaultListProps = {
  items: sampleItems,
  totalCount: sampleItems.length,
  totalAllCount: sampleItems.length,
  currentPage: 1,
  lastPage: 1,
  availableCategoryValues: ["tops"],
  availableSeasons: ["春", "夏"],
  availableTpos: ["仕事", "休日"],
};

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(0);
}

describe("ItemsList", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    searchParamsValue = "";
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    vi.useRealTimers();
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
      root.render(
        React.createElement(ItemsList, {
          ...defaultListProps,
          items: [sampleItems[0]],
          totalCount: 1,
          totalAllCount: 1,
          availableSeasons: ["夏"],
          availableTpos: ["休日"],
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("表示件数: 1 / 1");
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
      root.render(React.createElement(ItemsList, defaultListProps));
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
    expect(container.textContent).toContain("TPO: 仕事");
    expect(container.textContent).not.toContain("TPO: 通勤");
  });

  it("ページャ操作で page クエリを更新する", async () => {
    searchParamsValue = "page=2";
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(
        React.createElement(ItemsList, {
          ...defaultListProps,
          currentPage: 2,
          lastPage: 3,
          totalCount: 25,
          totalAllCount: 25,
        }),
      );
      await waitForEffects();
    });

    const nextButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("次へ"),
    );

    await act(async () => {
      nextButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("2 / 3ページ（全25件）");
    expect(replaceMock).toHaveBeenCalledWith("/items?page=3", { scroll: false });
  });

  it("URL クエリの初期値を反映し、条件クリアで URL も戻す", async () => {
    searchParamsValue = "keyword=%E7%99%BD&season=%E5%A4%8F&sort=name_asc";
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(
        React.createElement(ItemsList, {
          ...defaultListProps,
          items: [sampleItems[0]],
          totalCount: 1,
          totalAllCount: 2,
        }),
      );
      await waitForEffects();
    });

    const input = container.querySelector<HTMLInputElement>('input[type="search"]');
    const selects = Array.from(container.querySelectorAll("select"));
    const clearButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("クリア"),
    );

    expect(input?.value).toBe("白");
    expect((selects[1] as HTMLSelectElement).value).toBe("夏");
    expect((selects[3] as HTMLSelectElement).value).toBe("name_asc");
    expect(replaceMock).not.toHaveBeenCalled();

    await act(async () => {
      clearButton?.click();
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith("/items", { scroll: false });
  });

  it("検索結果が 0 件のときは空状態文言を表示する", async () => {
    searchParamsValue = "keyword=%E9%9D%92";
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(
        React.createElement(ItemsList, {
          ...defaultListProps,
          items: [],
          totalCount: 0,
          totalAllCount: 2,
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("条件に一致するアイテムがありません");
    expect(container.textContent).toContain("条件を変えてお試しください。");
    expect(container.textContent).toContain("条件をクリア");
  });

  it("キーワード削除中は debounce 後に URL を更新する", async () => {
    searchParamsValue = "keyword=%E7%99%BDT%E3%82%B7%E3%83%A3%E3%83%84";
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(React.createElement(ItemsList, defaultListProps));
      await waitForEffects();
    });

    const input = container.querySelector<HTMLInputElement>('input[type="search"]');

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      valueSetter?.call(input, "白T");
      input!.dispatchEvent(new Event("input", { bubbles: true }));
      await waitForEffects();
    });

    expect(replaceMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(250);
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith("/items?keyword=%E7%99%BDT", { scroll: false });
  });
});
