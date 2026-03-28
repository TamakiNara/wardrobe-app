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
const fetchUserBrandsMock = vi.fn();
const fetchUserTposMock = vi.fn();
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
  fetchUserBrands: fetchUserBrandsMock,
  fetchUserTpos: fetchUserTposMock,
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

describe("EditItemPage", () => {
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
    fetchUserBrandsMock.mockResolvedValue({ brands: [] });
    fetchUserTposMock.mockResolvedValue({
      tpos: [
        { id: 1, name: "仕事", sortOrder: 1, isActive: true, isPreset: true },
        { id: 2, name: "休日", sortOrder: 2, isActive: true, isPreset: true },
      ],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 1,
            name: "サンプル",
            status: "active",
            care_status: "in_cleaning",
            brand_name: "Sample Brand",
            price: 19800,
            purchase_url: "https://example.test/items/1",
            memo: "既存メモ",
            purchased_at: "2026-03-24T00:00:00.000000Z",
            size_gender: "women",
            size_label: "M",
            size_note: "厚手ニット込み",
            size_details: {
              note: "裄丈 78cm",
            },
            is_rain_ok: true,
            category: "tops",
            shape: "tshirt",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: null,
            images: [
              {
                id: 1,
                item_id: 1,
                disk: "public",
                path: "items/1/coat.png",
                url: "https://example.test/storage/items/1/coat.png",
                original_filename: "coat.png",
                mime_type: "image/png",
                file_size: 1000,
                sort_order: 1,
                is_primary: true,
              },
            ],
          },
        }),
      }),
    );
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("編集画面でも表示設定に含まれる dress と inner をカテゴリ候補に含める", async () => {
    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(React.createElement(EditItemPage, { params: Promise.resolve({ id: "1" }) }));
    });

    await act(async () => {
      await waitForEffects();
    });

    const categorySelect = container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();
    expect(categorySelect!.value).toBe("tops");

    const optionLabels = Array.from(categorySelect!.options).map((option) => option.textContent);
    expect(optionLabels).toEqual([
      "選択してください",
      "トップス",
      "ワンピース・オールインワン",
      "ルームウェア・インナー",
    ]);
    expect(container.textContent).toContain("「必須」が付いた項目は更新に必要です。");
    expect(container.textContent).toContain("カテゴリ");
    expect(container.textContent).toContain("形");
    expect(container.textContent).toContain("ケア状態");
    expect(container.textContent).toContain("メインカラー");
    expect(container.textContent).toContain("ブランド候補にも追加する");
    expect(container.textContent?.match(/必須/g)?.length).toBe(4);
    expect((container.querySelector("#brand-name") as HTMLInputElement | null)?.value).toBe("Sample Brand");
    expect((container.querySelector("#price") as HTMLInputElement | null)?.value).toBe("19800");
    expect((container.querySelector("#memo") as HTMLTextAreaElement | null)?.value).toBe("既存メモ");
    expect(container.textContent).toContain("画像");
    expect(container.textContent).toContain("クリックして画像を選択");
    expect(container.textContent).toContain("代表画像");
    expect(container.textContent).toContain("削除");
    expect((container.querySelector("#care-status") as HTMLSelectElement | null)?.value).toBe("in_cleaning");
  }, 20000);
});
