// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchCategoryVisibilitySettingsMock = vi.fn();
const replaceMock = vi.fn();
let searchParamsValue = "";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/outfits",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
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
  {
    id: 2,
    name: "夏の散歩",
    memo: null,
    seasons: ["夏"],
    tpos: ["休日"],
    outfitItems: [],
  },
];

const defaultListProps = {
  outfits: sampleOutfits,
  totalCount: sampleOutfits.length,
  totalAllCount: sampleOutfits.length,
  currentPage: 1,
  lastPage: 1,
};

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
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("カテゴリ表示設定に応じて表示アイテム数と案内を切り替える", async () => {
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });

    const { default: OutfitsList } = await import("./outfits-list");

    await act(async () => {
      root.render(React.createElement(OutfitsList, defaultListProps));
      await waitForEffects();
    });

    expect(container.textContent).toContain("表示アイテム数: 1");
    expect(container.textContent).toContain("現在の表示設定により 1 件を非表示にしています。");
  });

  it("ページャ操作で page クエリを更新する", async () => {
    searchParamsValue = "page=2";
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: OutfitsList } = await import("./outfits-list");

    await act(async () => {
      root.render(
        React.createElement(OutfitsList, {
          ...defaultListProps,
          currentPage: 2,
          lastPage: 4,
          totalCount: 30,
          totalAllCount: 30,
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

    expect(container.textContent).toContain("2 / 4ページ（全30件）");
    expect(replaceMock).toHaveBeenCalledWith("/outfits?page=3", { scroll: false });
  });

  it("URL クエリの初期値を反映し、条件クリアで URL も戻す", async () => {
    searchParamsValue = "keyword=%E5%A4%8F&season=%E5%A4%8F&sort=name_asc";
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: OutfitsList } = await import("./outfits-list");

    await act(async () => {
      root.render(
        React.createElement(OutfitsList, {
          ...defaultListProps,
          outfits: [sampleOutfits[1]],
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

    expect(input?.value).toBe("夏");
    expect((selects[0] as HTMLSelectElement).value).toBe("夏");
    expect((selects[2] as HTMLSelectElement).value).toBe("name_asc");
    expect(container.textContent).toContain("夏の散歩");
    expect(container.textContent).not.toContain("春コーディネート");
    expect(replaceMock).not.toHaveBeenCalled();

    await act(async () => {
      clearButton?.click();
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith("/outfits", { scroll: false });
  });

  it("検索結果が 0 件のときは空状態文言を表示する", async () => {
    searchParamsValue = "keyword=%E5%86%AC";
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: OutfitsList } = await import("./outfits-list");

    await act(async () => {
      root.render(
        React.createElement(OutfitsList, {
          ...defaultListProps,
          outfits: [],
          totalCount: 0,
          totalAllCount: 2,
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("条件に一致するコーディネートがありません");
    expect(container.textContent).toContain("条件を変えてお試しください。");
    expect(container.textContent).toContain("条件をクリア");
  });
});
