// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Outfit, OutfitsListProps } from "./outfits-list";

const fetchCategoryVisibilitySettingsMock = vi.fn();
const replaceMock = vi.fn();
const pushMock = vi.fn();
let searchParamsValue = "";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/outfits",
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

vi.mock("@/lib/api/settings", () => ({
  fetchCategoryVisibilitySettings: fetchCategoryVisibilitySettingsMock,
}));

vi.mock("@/components/outfits/outfit-duplicate-action", () => ({
  default: ({ outfitId }: { outfitId: number }) =>
    React.createElement("span", null, `duplicate-${outfitId}`),
}));

const sampleOutfits: Outfit[] = [
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
          colors: [
            {
              role: "main",
              mode: "preset",
              value: "white",
              hex: "#eeeeee",
              label: "ホワイト",
            },
          ],
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
          colors: [
            {
              role: "main",
              mode: "preset",
              value: "blue",
              hex: "#0077D9",
              label: "ブルー",
            },
          ],
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

const defaultListProps: OutfitsListProps = {
  outfits: sampleOutfits,
  totalCount: sampleOutfits.length,
  totalAllCount: sampleOutfits.length,
  currentPage: 1,
  lastPage: 1,
  availableTpos: ["仕事", "休日"],
};

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(0);
}

describe("OutfitsList", () => {
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
    expect(container.textContent).toContain("duplicate-1");
    expect(container.querySelector('[data-testid="outfit-color-thumbnail"]')).not.toBeNull();
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

  it("キーワード削除中は debounce 後に URL を更新する", async () => {
    searchParamsValue = "keyword=%E5%A4%8F%E3%82%B3%E3%83%BC%E3%83%87";
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: OutfitsList } = await import("./outfits-list");

    await act(async () => {
      root.render(React.createElement(OutfitsList, defaultListProps));
      await waitForEffects();
    });

    const input = container.querySelector<HTMLInputElement>('input[type="search"]');

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      valueSetter?.call(input, "夏コー");
      input!.dispatchEvent(new Event("input", { bubbles: true }));
      await waitForEffects();
    });

    expect(replaceMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(250);
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith("/outfits?keyword=%E5%A4%8F%E3%82%B3%E3%83%BC", {
      scroll: false,
    });
  });

  it("URL に season がない場合は初期季節を 1 回だけ query に反映する", async () => {
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: OutfitsList } = await import("./outfits-list");

    await act(async () => {
      root.render(
        React.createElement(OutfitsList, {
          ...defaultListProps,
          initialSeasonFilter: "秋",
        }),
      );
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith("/outfits?season=%E7%A7%8B", { scroll: false });
  });

  it("URL に season がある場合は初期季節を上書きしない", async () => {
    searchParamsValue = "season=summer";
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: OutfitsList } = await import("./outfits-list");

    await act(async () => {
      root.render(
        React.createElement(OutfitsList, {
          ...defaultListProps,
          initialSeasonFilter: "秋",
        }),
      );
      await waitForEffects();
    });

    expect(replaceMock).not.toHaveBeenCalledWith("/outfits?season=%E7%A7%8B", { scroll: false });
  });
});
