// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryGroupRecord } from "@/types/categories";
import type { ItemRecord } from "@/types/items";

const fetchCategoryGroupsMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const fetchItemsIndexMock = vi.fn();
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

vi.mock("@/lib/api/items", () => ({
  fetchItemsIndex: fetchItemsIndexMock,
}));

const sampleGroups: CategoryGroupRecord[] = [
  {
    id: "tops",
    name: "トップス",
    sortOrder: 10,
    categories: [
      { id: "tops_tshirt", groupId: "tops", name: "Tシャツ", sortOrder: 10 },
      {
        id: "tops_shirt",
        groupId: "tops",
        name: "シャツ / ブラウス",
        sortOrder: 20,
      },
    ],
  },
  {
    id: "bottoms",
    name: "ボトムス",
    sortOrder: 20,
    categories: [
      {
        id: "bottoms_pants",
        groupId: "bottoms",
        name: "パンツ",
        sortOrder: 10,
      },
    ],
  },
  {
    id: "outer",
    name: "アウター",
    sortOrder: 30,
    categories: [
      { id: "outer_coat", groupId: "outer", name: "コート", sortOrder: 10 },
    ],
  },
];

const sampleItems: ItemRecord[] = [
  {
    id: 1,
    name: "白T",
    status: "active",
    care_status: "in_cleaning",
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
    images: [
      {
        id: 11,
        item_id: 1,
        disk: "public",
        path: "items/1/main.png",
        url: "https://example.test/storage/items/1/main.png",
        original_filename: "main.png",
        mime_type: "image/png",
        file_size: 1000,
        sort_order: 1,
        is_primary: true,
      },
    ],
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
    images: [],
  },
];

const defaultListProps = {
  items: sampleItems,
  totalCount: sampleItems.length,
  totalAllCount: sampleItems.length,
  currentPage: 1,
  lastPage: 1,
  availableCategoryValues: ["tops", "bottoms", "outer"],
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
    expect(container.textContent).toContain("クリーニング中");
    expect(container.textContent).not.toContain("青シャツ");
    const image = container.querySelector('img[alt="main.png"]');
    expect(image?.getAttribute("src")).toBe(
      "https://example.test/storage/items/1/main.png",
    );
  });

  it("初期カテゴリ候補が渡されている場合は mount 後の追加 fetch を行わない", async () => {
    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(
        React.createElement(ItemsList, {
          ...defaultListProps,
          initialCategoryOptions: [
            { value: "tops", label: "トップス" },
            { value: "bottoms", label: "ボトムス" },
          ],
        }),
      );
      await waitForEffects();
    });

    expect(fetchCategoryGroupsMock).not.toHaveBeenCalled();
    expect(fetchCategoryVisibilitySettingsMock).not.toHaveBeenCalled();
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

    const nextButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("次へ"),
    );

    await act(async () => {
      nextButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("2 / 3ページ（全25件）");
    expect(replaceMock).toHaveBeenCalledWith("/items?page=3", {
      scroll: false,
    });
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

    const input = container.querySelector<HTMLInputElement>(
      'input[type="search"]',
    );
    const selects = Array.from(container.querySelectorAll("select"));
    const clearButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("クリア"),
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

    expect(container.textContent).toContain(
      "条件に一致するアイテムがありません",
    );
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

    const input = container.querySelector<HTMLInputElement>(
      'input[type="search"]',
    );

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

    expect(replaceMock).toHaveBeenCalledWith("/items?keyword=%E7%99%BDT", {
      scroll: false,
    });
  });

  it("URL に season がない場合は初期季節を 1 回だけ query に反映する", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(
        React.createElement(ItemsList, {
          ...defaultListProps,
          initialSeasonFilter: "春",
        }),
      );
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith("/items?season=%E6%98%A5", {
      scroll: false,
    });
  });

  it("URL に season がある場合は初期季節を上書きしない", async () => {
    searchParamsValue = "season=summer";
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(
        React.createElement(ItemsList, {
          ...defaultListProps,
          initialSeasonFilter: "春",
        }),
      );
      await waitForEffects();
    });

    expect(replaceMock).not.toHaveBeenCalledWith("/items?season=%E6%98%A5", {
      scroll: false,
    });
  });

  it("表示切替でクローゼットビューを開き、中分類ごとに表示する", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt", "bottoms_pants"],
    });

    const closetItems: ItemRecord[] = [
      sampleItems[0],
      sampleItems[1],
      {
        id: 3,
        name: "黒カーディガン",
        status: "active",
        category: "tops",
        shape: "cardigan",
        colors: [
          {
            role: "main",
            mode: "preset",
            value: "black",
            hex: "#1F1F1F",
            label: "ブラック",
          },
        ],
        seasons: ["冬"],
        tpos: ["仕事"],
        images: [],
      },
      {
        id: 5,
        name: "ネイビーパンツ",
        status: "active",
        category: "bottoms",
        shape: "pants",
        colors: [
          {
            role: "main",
            mode: "preset",
            value: "navy",
            hex: "#2F4058",
            label: "ネイビー",
          },
        ],
        seasons: ["冬"],
        tpos: ["仕事"],
        images: [],
      },
      {
        id: 4,
        name: "処分済みコート",
        status: "disposed",
        category: "outer",
        shape: "coat",
        colors: [
          {
            role: "main",
            mode: "preset",
            value: "brown",
            hex: "#704E3E",
            label: "ブラウン",
          },
        ],
        seasons: ["冬"],
        tpos: ["休日"],
        images: [],
      },
    ];

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(
        React.createElement(ItemsList, {
          ...defaultListProps,
          items: closetItems,
          totalCount: closetItems.length,
          totalAllCount: closetItems.length,
          availableSeasons: ["春", "夏", "冬"],
        }),
      );
      await waitForEffects();
    });

    const closetButton = Array.from(container.querySelectorAll("button")).find(
      (button) =>
        button.getAttribute("aria-label") === "クローゼットビューに切り替え",
    );
    const listButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.getAttribute("aria-label") === "通常一覧に切り替え",
    );

    await act(async () => {
      closetButton?.click();
      await waitForEffects();
    });

    expect(listButton?.className).not.toContain("bg-blue-600");
    expect(closetButton?.className).toContain("bg-blue-600");
    expect(container.textContent).toContain("トップス");
    expect(container.textContent).toContain("ボトムス");
    expect(container.textContent).not.toContain("アウター");
    expect(container.textContent).toContain("Tシャツ/カットソー");
    expect(container.textContent).toContain("シャツ");
    expect(container.textContent).toContain("カーディガン");

    const categoryHeading = Array.from(container.querySelectorAll("h2")).find(
      (heading) => heading.textContent === "トップス",
    );
    const categoryCard = categoryHeading?.closest("section");
    const shapeRow = Array.from(
      categoryCard?.querySelectorAll("div") ?? [],
    ).find(
      (element) =>
        element.className.includes("flex-wrap") &&
        element.className.includes("items-start"),
    );

    expect(shapeRow).toBeTruthy();
    expect(shapeRow?.className).toContain("flex-wrap");
    const topsLink = container.querySelector<HTMLAnchorElement>(
      'a[aria-label="白T / Tシャツ/カットソー / ホワイト"]',
    );
    const bottomsLink = Array.from(
      container.querySelectorAll<HTMLAnchorElement>("a"),
    ).find(
      (link) =>
        link.getAttribute("aria-label")?.includes("ネイビーパンツ /") &&
        link.getAttribute("aria-label")?.includes("/ ネイビー"),
    );
    const cardiganLink = container.querySelector<HTMLAnchorElement>(
      'a[aria-label="黒カーディガン / カーディガン / ブラック"]',
    );

    expect(topsLink?.getAttribute("href")).toBe("/items/1");
    expect(bottomsLink?.getAttribute("href")).toBe("/items/5");
    expect(cardiganLink?.getAttribute("href")).toBe("/items/3");
    expect(topsLink?.className).toContain("focus-visible:ring-2");
    expect(
      container.querySelector('a[aria-label*="処分済みコート"]'),
    ).toBeNull();
    expect(container.textContent).toContain(`表示中: ${closetItems.length}件`);
    expect(container.textContent).not.toContain("1 / 1ページ");
    expect(fetchItemsIndexMock).not.toHaveBeenCalled();
  });

  it("クローゼットビューでも絞り込み後 0 件なら既存空状態を使う", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: [
        "tops_tshirt",
        "tops_shirt",
        "bottoms_pants",
        "outer_coat",
      ],
    });

    const disposedOnlyItems: ItemRecord[] = [
      {
        id: 10,
        name: "処分済みコート",
        status: "disposed",
        category: "outer",
        shape: "coat",
        colors: [],
        seasons: ["冬"],
        tpos: ["休日"],
        images: [],
      },
    ];

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(
        React.createElement(ItemsList, {
          ...defaultListProps,
          items: disposedOnlyItems,
          totalCount: disposedOnlyItems.length,
          totalAllCount: disposedOnlyItems.length,
          availableSeasons: ["冬"],
          availableTpos: ["休日"],
        }),
      );
      await waitForEffects();
    });

    const closetButton = Array.from(container.querySelectorAll("button")).find(
      (button) =>
        button.getAttribute("aria-label") === "クローゼットビューに切り替え",
    );

    await act(async () => {
      closetButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "条件に一致するアイテムがありません",
    );
    expect(container.textContent).toContain("条件を変えてお試しください。");
  });

  it("クローゼットビューでは全件取得し、ページャーを出さない", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt", "bottoms_pants"],
    });
    fetchItemsIndexMock.mockResolvedValue({
      items: [
        sampleItems[0],
        sampleItems[1],
        {
          id: 3,
          name: "黒カーディガン",
          status: "active",
          category: "tops",
          shape: "cardigan",
          colors: [
            {
              role: "main",
              mode: "preset",
              value: "black",
              hex: "#1F1F1F",
              label: "ブラック",
            },
          ],
          seasons: ["冬"],
          tpos: ["仕事"],
          images: [],
        },
      ],
      meta: {
        total: 3,
        totalAll: 3,
        page: 1,
        lastPage: 1,
        availableCategories: ["tops", "bottoms"],
        availableSeasons: ["春", "夏", "冬"],
        availableTpos: ["仕事", "休日"],
      },
    });

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(
        React.createElement(ItemsList, {
          ...defaultListProps,
          items: [sampleItems[0], sampleItems[1]],
          totalCount: 3,
          totalAllCount: 3,
          currentPage: 1,
          lastPage: 2,
          availableSeasons: ["春", "夏", "冬"],
        }),
      );
      await waitForEffects();
    });

    const closetButton = Array.from(container.querySelectorAll("button")).find(
      (button) =>
        button.getAttribute("aria-label") === "クローゼットビューに切り替え",
    );

    await act(async () => {
      closetButton?.click();
      await waitForEffects();
    });

    await act(async () => {
      await Promise.resolve();
      await waitForEffects();
    });

    expect(fetchItemsIndexMock).toHaveBeenCalledWith({
      keyword: "",
      category: "",
      season: "",
      tpo: "",
      sort: "updated_at_desc",
      all: true,
    });
    expect(container.textContent).toContain("表示中: 3件");
    expect(container.textContent).toContain("黒カーディガン");
    expect(container.textContent).not.toContain("1 / 2ページ");
    expect(
      Array.from(container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("次へ"),
      ),
    ).toBeUndefined();
  });

  it("クローゼットビューでは絞り込み条件付きでも結果全件を取得する", async () => {
    searchParamsValue =
      "keyword=%E7%99%BD&category=tops&season=%E5%A4%8F&tpo=%E4%BC%91%E6%97%A5&sort=name_asc&page=2";
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });
    fetchItemsIndexMock.mockResolvedValue({
      items: [sampleItems[0]],
      meta: {
        total: 1,
        totalAll: 2,
        page: 1,
        lastPage: 1,
        availableCategories: ["tops"],
        availableSeasons: ["夏"],
        availableTpos: ["休日"],
      },
    });

    const { default: ItemsList } = await import("./items-list");

    await act(async () => {
      root.render(
        React.createElement(ItemsList, {
          ...defaultListProps,
          items: [],
          totalCount: 1,
          totalAllCount: 2,
          currentPage: 2,
          lastPage: 2,
          availableSeasons: ["夏"],
          availableTpos: ["休日"],
        }),
      );
      await waitForEffects();
    });

    const closetButton = Array.from(container.querySelectorAll("button")).find(
      (button) =>
        button.getAttribute("aria-label") === "クローゼットビューに切り替え",
    );

    await act(async () => {
      closetButton?.click();
      await waitForEffects();
    });

    await act(async () => {
      await Promise.resolve();
      await waitForEffects();
    });

    expect(fetchItemsIndexMock).toHaveBeenCalledWith({
      keyword: "白",
      category: "tops",
      season: "夏",
      tpo: "休日",
      sort: "name_asc",
      all: true,
    });
    expect(container.textContent).toContain("表示中: 1件");
    expect(container.textContent).toContain("トップス");
    expect(container.textContent).toContain("白T");
    expect(container.textContent).not.toContain("2 / 2ページ");
  });
});
