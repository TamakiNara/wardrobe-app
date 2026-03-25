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
let searchParamsSourceValue = "";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => ({
    get: (key: string) => (key === "source" ? searchParamsSourceValue : null),
  }),
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
    window.sessionStorage.clear();
    searchParamsSourceValue = "";
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
    expect(container.textContent).toContain("「必須」が付いた項目は登録に必要です。");
    expect(container.textContent).toContain("カテゴリ");
    expect(container.textContent).toContain("形");
    expect(container.textContent).toContain("メインカラー");
    expect(container.textContent).toContain("クリックして画像を選択");
    expect(container.textContent?.match(/必須/g)?.length).toBe(4);
  });

  it("purchase candidate draft から名前とカテゴリ初期値を読み込む", async () => {
    searchParamsSourceValue = "purchase-candidate";
    window.sessionStorage.setItem(
      "purchase-candidate-item-draft",
      JSON.stringify({
        message: "item_draft_ready",
        item_draft: {
          name: "レインコート候補",
          source_category_id: "tops_tshirt",
          category: "tops",
          shape: "tshirt",
          brand_name: "Sample Brand",
          price: 9800,
          purchase_url: "https://example.test/products/coat",
          memo: null,
          size_gender: "women",
          size_label: "M",
          size_note: "厚手ニット込み",
          purchased_at: null,
          size_details: "裄丈 78cm",
          spec: null,
          is_rain_ok: true,
          colors: [],
          seasons: ["春"],
          tpos: ["休日"],
        },
        candidate_summary: {
          id: 1,
          status: "considering",
          priority: "medium",
          name: "レインコート候補",
          converted_item_id: null,
          converted_at: null,
        },
        images: [],
      }),
    );

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const nameInput = container.querySelector<HTMLInputElement>("#name");
    const brandNameInput = container.querySelector<HTMLInputElement>("#brand-name");
    const priceInput = container.querySelector<HTMLInputElement>("#price");
    const purchaseUrlInput = container.querySelector<HTMLInputElement>("#purchase-url");
    const sizeGenderSelect = container.querySelector<HTMLSelectElement>("#size-gender");
    const sizeLabelInput = container.querySelector<HTMLInputElement>("#size-label");
    const sizeNoteInput = container.querySelector<HTMLInputElement>("#size-note");
    const sizeDetailsTextarea = container.querySelector<HTMLTextAreaElement>("#size-details-note");
    const rainCheckbox = container.querySelector<HTMLInputElement>('input[type="checkbox"][class*="text-blue-600"]');
    const categorySelect = container.querySelector<HTMLSelectElement>("#category");
    expect(nameInput?.value).toBe("レインコート候補");
    expect(brandNameInput?.value).toBe("Sample Brand");
    expect(priceInput?.value).toBe("9800");
    expect(purchaseUrlInput?.value).toBe("https://example.test/products/coat");
    expect(sizeGenderSelect?.value).toBe("women");
    expect(sizeLabelInput?.value).toBe("M");
    expect(sizeNoteInput?.value).toBe("厚手ニット込み");
    expect(sizeDetailsTextarea?.value).toBe("裄丈 78cm");
    expect(rainCheckbox?.checked).toBe(true);
    expect(categorySelect?.value).toBe("tops");
    expect(container.textContent).toContain("購入候補の内容を初期値として読み込みました。");
    expect(container.textContent).toContain("購入候補由来画像も保存前に取り除けます。");
  });
});
