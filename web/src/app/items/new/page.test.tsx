// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/client";
import type { CategoryGroupRecord } from "@/types/categories";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const fetchCategoryGroupsMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const fetchUserPreferencesMock = vi.fn();
const fetchUserBrandsMock = vi.fn();
const fetchUserTposMock = vi.fn();
const routerMock = { push: pushMock, refresh: refreshMock };
let searchParamsSourceValue = "";
const scrollIntoViewMock = vi.fn();

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
  fetchUserPreferences: fetchUserPreferencesMock,
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
      {
        id: "tops_tshirt_cutsew",
        groupId: "tops",
        name: "Tシャツ・カットソー",
        sortOrder: 10,
      },
    ],
  },
  {
    id: "outerwear",
    name: "ジャケット・アウター",
    sortOrder: 12,
    categories: [
      {
        id: "outerwear_jacket",
        groupId: "outerwear",
        name: "ジャケット",
        sortOrder: 10,
      },
    ],
  },
  {
    id: "pants",
    name: "パンツ",
    sortOrder: 15,
    categories: [
      {
        id: "pants_pants",
        groupId: "pants",
        name: "パンツ",
        sortOrder: 10,
      },
    ],
  },
  {
    id: "onepiece_dress",
    name: "ワンピース・ドレス",
    sortOrder: 20,
    categories: [
      {
        id: "onepiece_dress_onepiece",
        groupId: "onepiece_dress",
        name: "ワンピース",
        sortOrder: 10,
      },
    ],
  },
  {
    id: "allinone",
    name: "オールインワン",
    sortOrder: 25,
    categories: [
      {
        id: "allinone_allinone",
        groupId: "allinone",
        name: "オールインワン",
        sortOrder: 10,
      },
    ],
  },
  {
    id: "roomwear_inner",
    name: "ルームウェア・インナー",
    sortOrder: 30,
    categories: [
      {
        id: "roomwear_inner_roomwear",
        groupId: "roomwear_inner",
        name: "ルームウェア",
        sortOrder: 10,
      },
      {
        id: "roomwear_inner_other",
        groupId: "roomwear_inner",
        name: "その他ルームウェア・インナー",
        sortOrder: 40,
      },
    ],
  },
  {
    id: "legwear",
    name: "レッグウェア",
    sortOrder: 35,
    categories: [
      {
        id: "legwear_socks",
        groupId: "legwear",
        name: "ソックス",
        sortOrder: 10,
      },
    ],
  },
  {
    id: "shoes",
    name: "シューズ",
    sortOrder: 37,
    categories: [
      {
        id: "shoes_sneakers",
        groupId: "shoes",
        name: "スニーカー",
        sortOrder: 10,
      },
      {
        id: "shoes_pumps",
        groupId: "shoes",
        name: "パンプス",
        sortOrder: 20,
      },
      {
        id: "shoes_boots",
        groupId: "shoes",
        name: "ブーツ",
        sortOrder: 30,
      },
      {
        id: "shoes_sandals",
        groupId: "shoes",
        name: "サンダル",
        sortOrder: 40,
      },
      {
        id: "shoes_other",
        groupId: "shoes",
        name: "その他シューズ",
        sortOrder: 50,
      },
    ],
  },
  {
    id: "bags",
    name: "バッグ",
    sortOrder: 40,
    categories: [
      { id: "bags_tote", groupId: "bags", name: "トートバッグ", sortOrder: 10 },
      {
        id: "bags_shoulder",
        groupId: "bags",
        name: "ショルダーバッグ",
        sortOrder: 20,
      },
      {
        id: "bags_rucksack",
        groupId: "bags",
        name: "リュックサック・バックパック",
        sortOrder: 30,
      },
      { id: "bags_hand", groupId: "bags", name: "ハンドバッグ", sortOrder: 40 },
      {
        id: "bags_clutch",
        groupId: "bags",
        name: "クラッチバッグ",
        sortOrder: 50,
      },
      { id: "bags_body", groupId: "bags", name: "ボディバッグ", sortOrder: 60 },
      {
        id: "bags_other",
        groupId: "bags",
        name: "その他バッグ",
        sortOrder: 70,
      },
    ],
  },
  {
    id: "fashion_accessories",
    name: "ファッション小物",
    sortOrder: 45,
    categories: [
      {
        id: "fashion_accessories_hat",
        groupId: "fashion_accessories",
        name: "帽子",
        sortOrder: 10,
      },
      {
        id: "fashion_accessories_belt",
        groupId: "fashion_accessories",
        name: "ベルト",
        sortOrder: 20,
      },
      {
        id: "fashion_accessories_other",
        groupId: "fashion_accessories",
        name: "その他ファッション小物",
        sortOrder: 100,
      },
    ],
  },
];

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function setNativeInputValue(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  value: string,
) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(element, value);
}

describe("新規登録画面", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    searchParamsSourceValue = "";
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: [
        "tops_tshirt_cutsew",
        "outerwear_jacket",
        "pants_pants",
        "onepiece_dress_onepiece",
        "allinone_allinone",
        "roomwear_inner_roomwear",
        "legwear_socks",
        "shoes_sneakers",
        "bags_tote",
        "fashion_accessories_belt",
      ],
    });
    fetchUserPreferencesMock.mockResolvedValue({
      preferences: {
        currentSeason: null,
        defaultWearLogStatus: null,
        calendarWeekStart: null,
        skinTonePreset: "neutral_medium",
      },
    });
    fetchUserBrandsMock.mockResolvedValue({ brands: [] });
    fetchUserTposMock.mockResolvedValue({
      tpos: [
        { id: 1, name: "仕事", sortOrder: 1, isActive: true, isPreset: true },
        { id: 2, name: "休日", sortOrder: 2, isActive: true, isPreset: true },
      ],
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("表示設定に含まれるワンピース / オールインワンと inner をカテゴリ候補に含める", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    const optionLabels = Array.from(categorySelect!.options).map(
      (option) => option.textContent,
    );
    expect(optionLabels).toEqual([
      "選択してください",
      "トップス",
      "ジャケット・アウター",
      "パンツ",
      "ワンピース・ドレス",
      "オールインワン",
      "ルームウェア・インナー",
      "レッグウェア",
      "シューズ",
      "バッグ",
      "ファッション小物",
    ]);
    expect(container.textContent).toContain("カテゴリ");
    expect(container.textContent).toContain("形");
    expect(container.textContent).toContain("分類");
    expect(container.textContent).toContain("アイテム管理");
    expect(container.textContent).toContain("新規作成");
    expect(container.textContent).toContain(
      "基本情報や分類を入力して、新しいアイテムを登録します。",
    );
    expect(container.innerHTML).toContain('href="/items"');
    expect(container.textContent).toContain("一覧に戻る");
    expect(container.textContent).toContain("色とプレビュー");
    expect(container.textContent).toContain("利用条件・状態");
    expect(container.textContent).toContain("サイズ");
    expect(container.textContent).toContain("素材・混率");
    expect(container.textContent).toContain("購入・補足");
    expect(container.textContent).toContain("ケア状態");
    expect(container.textContent).toContain("メインカラー");
    expect(container.textContent).toContain("ブランド候補にも追加する");
    expect(container.textContent).toContain("クリックして画像を選択");
    expect(container.textContent).not.toContain(
      "実寸は cm 単位で入力します。未入力の項目は保存しません。",
    );
  });

  it("purchase candidate draft から名前とカテゴリ初期値を読み込む", async () => {
    searchParamsSourceValue = "purchase-candidate";
    window.sessionStorage.setItem(
      "purchase-candidate-item-draft",
      JSON.stringify({
        message: "item_draft_ready",
        item_draft: {
          name: "レインコート候補",
          source_category_id: "tops_tshirt_cutsew",
          category: "tops",
          subcategory: "tshirt_cutsew",
          shape: "tshirt",
          brand_name: "Sample Brand",
          price: 9800,
          purchase_url: "https://example.test/products/coat",
          memo: "候補メモ",
          size_gender: "women",
          size_label: "M",
          size_note: "厚手ニット込み",
          purchased_at: null,
          size_details: {
            structured: {
              shoulder_width: 42,
            },
            custom_fields: [
              {
                label: "裄丈",
                value: 78,
                sort_order: 1,
              },
            ],
          },
          spec: null,
          is_rain_ok: true,
          colors: [],
          seasons: ["春"],
          tpos: ["休日"],
          materials: [
            {
              part_label: "本体",
              material_name: "綿",
              ratio: 80,
            },
            {
              part_label: "本体",
              material_name: "ポリエステル",
              ratio: 20,
            },
          ],
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
    const brandNameInput =
      container.querySelector<HTMLInputElement>("#brand-name");
    const priceInput = container.querySelector<HTMLInputElement>("#price");
    const purchaseUrlInput =
      container.querySelector<HTMLInputElement>("#purchase-url");
    const memoTextarea = container.querySelector<HTMLTextAreaElement>("#memo");
    const sizeGenderSelect =
      container.querySelector<HTMLSelectElement>("#size-gender");
    const sizeLabelInput =
      container.querySelector<HTMLInputElement>("#size-label");
    const sizeNoteInput =
      container.querySelector<HTMLInputElement>("#size-note");
    const shoulderWidthInput = container.querySelector<HTMLInputElement>(
      "#structured-size-shoulder_width",
    );
    const customLabelInput = container.querySelector<HTMLInputElement>(
      'input[placeholder="項目名"]',
    );
    const customValueInput = container.querySelector<HTMLInputElement>(
      'input[placeholder="値"]',
    );
    const rainCheckbox = Array.from(container.querySelectorAll("label"))
      .find((element) => element.textContent?.includes("雨対応"))
      ?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const careStatusSelect =
      container.querySelector<HTMLSelectElement>("#care-status");
    expect(nameInput?.value).toBe("レインコート候補");
    expect(brandNameInput?.value).toBe("Sample Brand");
    expect(priceInput?.value).toBe("9800");
    expect(purchaseUrlInput?.value).toBe("https://example.test/products/coat");
    expect(memoTextarea?.value).toBe("候補メモ");
    expect(sizeGenderSelect?.value).toBe("women");
    expect(sizeLabelInput?.value).toBe("M");
    expect(sizeNoteInput?.value).toBe("厚手ニット込み");
    expect(shoulderWidthInput?.value).toBe("42");
    expect(customLabelInput?.value).toBe("裄丈");
    expect(customValueInput?.value).toBe("78");
    expect(rainCheckbox?.checked).toBe(true);
    expect(categorySelect?.value).toBe("tops");
    expect(subcategorySelect?.value).toBe("tshirt_cutsew");
    expect(careStatusSelect?.value).toBe("");
    const materialPartInputs = Array.from(
      container.querySelectorAll('input[list="item-material-part-options"]'),
    ) as HTMLInputElement[];
    const materialNameInputs = Array.from(
      container.querySelectorAll('input[list="item-material-name-options"]'),
    ) as HTMLInputElement[];
    const materialRatioInputs = Array.from(
      container.querySelectorAll('input[id$="-ratio"]'),
    ) as HTMLInputElement[];
    expect(materialPartInputs[0]?.value).toBe("本体");
    expect(materialNameInputs[0]?.value).toBe("綿");
    expect(materialRatioInputs[0]?.value).toBe("80");
    expect(container.textContent).toContain(
      "購入検討の内容を初期値として読み込みました。",
    );
    expect(container.textContent).toContain(
      "引き継いだ画像も保存前に取り除けます。",
    );
    expect(container.textContent).not.toContain("引き継ぎ画像の確認");
    expect(container.textContent).toContain("ブランド候補にも追加する");
  });

  it("カテゴリに応じてボトムス丈とレッグウェア入力を切り替える", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "pants";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "denim";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("ボトムス丈");
    expect(container.textContent).toContain("股上");
    expect(container.querySelector("#bottoms-length-type")).not.toBeNull();
    expect(container.querySelector("#bottoms-rise-type")).not.toBeNull();
    expect(container.querySelector("#legwear-coverage-type")).toBeNull();
    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual([
      "",
      "straight",
      "tapered",
      "wide",
      "culottes",
      "jogger",
      "skinny",
      "gaucho",
    ]);
    expect(
      Array.from(
        (container.querySelector("#bottoms-length-type") as HTMLSelectElement)
          .options,
      ).map((option) => option.value),
    ).toEqual(["", "mini", "short", "half", "cropped", "ankle", "full"]);
    await act(async () => {
      categorySelect!.value = "legwear";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const legwearSubcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(legwearSubcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();
    expect(container.querySelector("#legwear-coverage-type")).toBeNull();

    await act(async () => {
      legwearSubcategorySelect!.value = "socks";
      legwearSubcategorySelect!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
    expect(container.textContent).toContain("レッグウェア");
    expect(container.textContent).toContain("ソックスの長さ");
    expect(container.querySelector("#legwear-coverage-type")).not.toBeNull();

    await act(async () => {
      legwearSubcategorySelect!.value = "tights";
      legwearSubcategorySelect!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
    expect(container.querySelector("#legwear-coverage-type")).toBeNull();
    expect(container.textContent).not.toContain("ソックスの長さ");
  });

  it("認証切れで TPO 取得が失敗した場合はログインへ戻す", async () => {
    fetchUserTposMock.mockRejectedValueOnce(new ApiClientError(401, null));

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
    expect(container.textContent).not.toContain(
      "TPO の取得に失敗しました。再読み込みしても改善しない場合は設定を確認してください。",
    );
  });

  it("roomwear_inner は種類に応じて shape を自動設定できる", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(categorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "inner";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "underwear";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(shapeSelect!.value).toBe("underwear");

    await act(async () => {
      subcategorySelect!.value = "other";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(shapeSelect!.value).toBe("roomwear");
  });

  it("ボトムス丈とソックスの未選択時に分かりやすいエラーを表示する", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "pants";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "denim";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      shapeSelect!.value = "straight";
      shapeSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    await act(async () => {
      form!.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("ボトムス丈を選択してください。");
    expect(container.textContent).toContain("入力内容を確認してください。");

    await act(async () => {
      categorySelect!.value = "legwear";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      form!.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("種類を選択してください。");

    const legwearSubcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(legwearSubcategorySelect).not.toBeNull();

    await act(async () => {
      legwearSubcategorySelect!.value = "socks";
      legwearSubcategorySelect!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
      await waitForEffects();
    });

    await act(async () => {
      form!.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "レッグウェアの種類を選択してください。",
    );
  });

  it("pants の種類に応じて shape 候補を絞り込む", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "pants";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "denim";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual([
      "",
      "straight",
      "tapered",
      "wide",
      "culottes",
      "jogger",
      "skinny",
      "gaucho",
    ]);
  });

  it("outerwear の種類に応じて shape 候補を絞り込む", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "outerwear";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "coat";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual(["", "coat", "trench", "chester", "stainless"]);

    await act(async () => {
      subcategorySelect!.value = "jacket";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual(["", "jacket", "tailored", "no_collar"]);
  });

  it("skirts は軽い種類 UI と shape 候補を表示できる", async () => {
    fetchCategoryGroupsMock.mockResolvedValueOnce([
      ...sampleGroups,
      {
        id: "skirts",
        name: "スカート",
        sortOrder: 16,
        categories: [
          {
            id: "skirts_skirt",
            groupId: "skirts",
            name: "スカート",
            sortOrder: 10,
          },
        ],
      },
    ]);
    fetchCategoryVisibilitySettingsMock.mockResolvedValueOnce({
      visibleCategoryIds: [
        "tops_tshirt_cutsew",
        "pants_pants",
        "skirts_skirt",
        "onepiece_dress_onepiece",
        "allinone_allinone",
        "roomwear_inner_roomwear",
        "legwear_socks",
      ],
    });

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "skirts";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategoryRadios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="subcategory"]'),
    );
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategoryRadios).toHaveLength(2);
    expect(subcategoryRadios.map((radio) => radio.value)).toEqual([
      "skirt",
      "other",
    ]);
    expect(subcategoryRadios[0]?.checked).toBe(true);
    expect(shapeSelect).not.toBeNull();

    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual(["", "tight", "flare", "a_line", "mermaid"]);
  });

  it("other 系の一部カテゴリでは shape を表示しない", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "pants";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    let subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "other";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      categorySelect!.value = "outerwear";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "other";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("onepiece_dress と allinone は種類に応じて shape 候補を絞り込む", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "onepiece_dress";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    let subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    let shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "onepiece";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual(["", "onepiece"]);
    expect(shapeSelect!.value).toBe("onepiece");

    await act(async () => {
      subcategorySelect!.value = "dress";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual(["", "dress"]);
    expect(shapeSelect!.value).toBe("dress");

    await act(async () => {
      categorySelect!.value = "allinone";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "salopette";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual(["", "salopette"]);
    expect(shapeSelect!.value).toBe("salopette");
  });

  it("bags は種類 select を表示し、選択に応じて shape を自動設定できる", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "bags";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

    expect(
      Array.from(subcategorySelect!.options).map((option) => option.value),
    ).toEqual([
      "",
      "tote",
      "shoulder",
      "boston",
      "hand",
      "rucksack",
      "body",
      "waist_pouch",
      "messenger",
      "clutch",
      "sacoche",
      "pochette",
      "drawstring",
      "basket_bag",
      "briefcase",
      "marche_bag",
      "other",
    ]);

    await act(async () => {
      subcategorySelect!.value = "tote";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("bags の other では形を任意寄りで扱う", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "bags";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "other";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("fashion_accessories は種類 select を表示し、選択に応じて shape を自動設定できる", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "fashion_accessories";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

    expect(
      Array.from(subcategorySelect!.options).map((option) => option.value),
    ).toEqual([
      "",
      "hat",
      "belt",
      "scarf_stole",
      "gloves",
      "jewelry",
      "wallet_case",
      "hair_accessory",
      "eyewear",
      "watch",
      "other",
    ]);

    await act(async () => {
      subcategorySelect!.value = "belt";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("shoes は種類ラジオを表示し、選択に応じて shape を自動設定できる", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "shoes";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategoryRadios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="subcategory"]'),
    );
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");

    expect(subcategoryRadios.map((radio) => radio.value)).toEqual([
      "sneakers",
      "pumps",
      "boots",
      "sandals",
      "leather_shoes",
      "rain_shoes_boots",
      "other",
    ]);
    expect(subcategoryRadios[0]?.checked).toBe(true);
    expect(shapeSelect).toBeNull();

    await act(async () => {
      subcategoryRadios[2]!.click();
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategoryRadios[4]!.click();
      await waitForEffects();
    });
  });

  it("fashion_accessories の other では形を任意寄りで扱う", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "fashion_accessories";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "other";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("tops で候補が1つの形を自動選択する", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "tops";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "hoodie";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual(["", "hoodie"]);
    expect(shapeSelect!.value).toBe("hoodie");
    expect(shapeSelect!.disabled).toBe(true);
    expect(container.querySelector("#tops-neck")).toBeNull();
    expect(container.querySelector("#tops-shape")).toBeNull();
  });

  it("tops で種類変更時に形と候補が連動する", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "tops";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "polo_shirt";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    let shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();
    expect(shapeSelect!.value).toBe("polo");
    expect(container.querySelector("#tops-neck")).toBeNull();
    expect(container.querySelector("#tops-design")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "vest_gilet";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    const vestNeckSelect =
      container.querySelector<HTMLSelectElement>("#tops-neck");
    expect(shapeSelect).not.toBeNull();
    expect(shapeSelect!.value).toBe("vest");
    expect(container.querySelector("#tops-sleeve")).toBeNull();
    expect(vestNeckSelect).not.toBeNull();
    expect(vestNeckSelect!.value).toBe("crew");
    expect(
      Array.from(vestNeckSelect!.options).map((option) => option.value),
    ).toEqual(["", "crew", "v", "boat", "turtle"]);

    await act(async () => {
      subcategorySelect!.value = "tanktop";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const tanktopNeckSelect =
      container.querySelector<HTMLSelectElement>("#tops-neck");
    expect(tanktopNeckSelect).not.toBeNull();
    expect(
      Array.from(tanktopNeckSelect!.options).map((option) => option.value),
    ).toEqual([
      "",
      "crew",
      "v",
      "u",
      "square",
      "boat",
      "highneck",
      "halter",
      "mock",
    ]);
    expect(container.querySelector("#tops-fit")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "other";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
    expect(container.querySelector("#tops-neck")).toBeNull();
  });

  it("outerwear の1候補形は自動設定して過剰な選択を求めない", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "outerwear";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    const shapeLabel =
      container.querySelector<HTMLLabelElement>('label[for="shape"]');
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();
    expect(shapeLabel).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "blouson";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(shapeSelect!.value).toBe("blouson");
    expect(shapeSelect!.disabled).toBe(true);
    expect(shapeLabel?.textContent).not.toContain("必須");
  });

  it("固定項目と自由項目の重複は短い警告文で表示する", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(categorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "tops";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      shapeSelect!.value = "tshirt";
      shapeSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent?.includes("自由項目を追加"),
    );
    expect(addButton).not.toBeUndefined();

    await act(async () => {
      addButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });

    const customLabelInput = container.querySelector<HTMLInputElement>(
      'input[placeholder="項目名"]',
    );
    expect(customLabelInput).not.toBeNull();

    await act(async () => {
      setNativeInputValue(customLabelInput!, "肩幅");
      customLabelInput!.dispatchEvent(new Event("input", { bubbles: true }));
      customLabelInput!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("同名の実寸項目があります。");
    expect(container.textContent).not.toContain(
      "固定項目または自由項目で同名の実寸があります。必要に応じて整理してください。",
    );
  });

  it("TPO の取得に失敗した場合は空状態ではなく取得失敗を表示する", async () => {
    fetchUserTposMock.mockRejectedValueOnce(new Error("failed"));

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("TPO の取得に失敗しました。");
    expect(container.textContent).not.toContain(
      "有効な TPO はまだありません。",
    );
  });
});
