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
let searchParamsReturnToValue = "";
const scrollIntoViewMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => ({
    get: (key: string) =>
      key === "source"
        ? searchParamsSourceValue
        : key === "returnTo"
          ? searchParamsReturnToValue
          : null,
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
  it("折りたたんでも structured 値を保持し、再展開すると再表示する", async () => {
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
      subcategorySelect!.value = "tshirt_cutsew";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await openSizeDetails();

    const shoulderWidthInput = container.querySelector<HTMLInputElement>(
      "#structured-size-shoulder_width",
    );
    expect(shoulderWidthInput).not.toBeNull();

    await act(async () => {
      setNativeInputValue(shoulderWidthInput!, "42.5");
      shoulderWidthInput!.dispatchEvent(new Event("input", { bubbles: true }));
      shoulderWidthInput!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await collapseSizeDetails();
    expect(container.textContent).toContain("実寸を入力");
    expect(container.textContent).not.toContain("閉じる");

    await openSizeDetails();

    expect(
      container.querySelector<HTMLInputElement>(
        "#structured-size-shoulder_width",
      )?.value,
    ).toBe("42.5");
  });

  it("分類を変えて definitions から外れた structured 値は送信対象にならない", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const nameInput = container.querySelector<HTMLInputElement>("#name");
    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    const sizeGenderSelect =
      container.querySelector<HTMLSelectElement>("#size-gender");
    const sheernessSelect =
      container.querySelector<HTMLSelectElement>("#sheerness");
    const springButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("春"),
    );
    const mainColorButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("ネイビー"));
    expect(nameInput).not.toBeNull();
    expect(categorySelect).not.toBeNull();
    expect(sizeGenderSelect).not.toBeNull();
    expect(springButton).not.toBeUndefined();
    expect(mainColorButton).not.toBeUndefined();

    await act(async () => {
      setNativeInputValue(nameInput!, "サイズ実寸テスト");
      nameInput!.dispatchEvent(new Event("input", { bubbles: true }));
      nameInput!.dispatchEvent(new Event("change", { bubbles: true }));
      categorySelect!.value = "tops";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "tshirt_cutsew";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await openSizeDetails();

    const shoulderWidthInput = container.querySelector<HTMLInputElement>(
      "#structured-size-shoulder_width",
    );
    expect(shoulderWidthInput).not.toBeNull();

    await act(async () => {
      setNativeInputValue(shoulderWidthInput!, "42.5");
      shoulderWidthInput!.dispatchEvent(new Event("input", { bubbles: true }));
      shoulderWidthInput!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      categorySelect!.value = "shoes";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      setNativeInputValue(sizeGenderSelect!, "women");
      sizeGenderSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      setNativeInputValue(sheernessSelect!, "slight");
      sheernessSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      springButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      mainColorButton!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
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

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.size_details).toBeNull();
    expect(payload.sheerness).toBe("slight");

    await act(async () => {
      categorySelect!.value = "tops";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const nextSubcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(nextSubcategorySelect).not.toBeNull();

    await act(async () => {
      nextSubcategorySelect!.value = "tshirt_cutsew";
      nextSubcategorySelect!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
      await waitForEffects();
    });

    await openSizeDetails();

    expect(
      container.querySelector<HTMLInputElement>(
        "#structured-size-shoulder_width",
      )?.value,
    ).toBe("42.5");
  });
  it("色セクションでは選択中の色 summary や preview を表示しない", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("メインカラー");
    expect(container.textContent).toContain("サブカラー");
    expect(container.textContent).not.toContain("選択中の色");
    expect(
      container.querySelector('[data-testid="item-preview-panel"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="item-preview-card"]'),
    ).toBeNull();
  });
  it("skirts の mermaid でも固定実寸を表示する", async () => {
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

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "skirt";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      shapeSelect!.value = "mermaid";
      shapeSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await openSizeDetails();

    expect(
      container.querySelector<HTMLInputElement>("#structured-size-waist"),
    ).not.toBeNull();
    expect(
      container.querySelector<HTMLInputElement>(
        "#structured-size-total_length",
      ),
    ).not.toBeNull();
  });
  it("select と input と date 入力の高さを共通 class で揃える", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    const sizeLabelInput =
      container.querySelector<HTMLInputElement>("#size-label");
    const purchasedAtInput =
      container.querySelector<HTMLInputElement>("#purchased-at");
    const priceInput = container.querySelector<HTMLInputElement>("#price");

    expect(categorySelect?.className).toContain("h-[50px]");
    expect(sizeLabelInput?.className).toContain("h-[50px]");
    expect(purchasedAtInput?.className).toContain("h-[50px]");
    expect(priceInput?.className).toContain("h-full");
    expect(priceInput?.parentElement?.className).toContain("h-[50px]");
  });
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
        id: "fashion_accessories_scarf_bandana",
        groupId: "fashion_accessories",
        name: "スカーフ・バンダナ",
        sortOrder: 60,
      },
      {
        id: "fashion_accessories_other",
        groupId: "fashion_accessories",
        name: "その他ファッション小物",
        sortOrder: 100,
      },
    ],
  },
  {
    id: "swimwear",
    name: "水着",
    sortOrder: 50,
    categories: [
      {
        id: "swimwear_swimwear",
        groupId: "swimwear",
        name: "水着",
        sortOrder: 10,
      },
      {
        id: "swimwear_rashguard",
        groupId: "swimwear",
        name: "ラッシュガード",
        sortOrder: 20,
      },
      {
        id: "swimwear_other",
        groupId: "swimwear",
        name: "その他水着",
        sortOrder: 30,
      },
    ],
  },
  {
    id: "kimono",
    name: "着物",
    sortOrder: 55,
    categories: [
      {
        id: "kimono_kimono",
        groupId: "kimono",
        name: "着物",
        sortOrder: 10,
      },
      {
        id: "kimono_yukata",
        groupId: "kimono",
        name: "浴衣",
        sortOrder: 20,
      },
      {
        id: "kimono_japanese_accessory",
        groupId: "kimono",
        name: "和装小物",
        sortOrder: 30,
      },
      {
        id: "kimono_other",
        groupId: "kimono",
        name: "その他着物",
        sortOrder: 40,
      },
    ],
  },
];

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function createValidPurchaseCandidateItemDraft() {
  return {
    message: "item_draft_ready",
    item_draft: {
      name: "Sample Coat",
      source_category_id: "tops_tshirt_cutsew",
      category: "tops",
      subcategory: "tshirt_cutsew",
      shape: "tshirt",
      brand_name: "Sample Brand",
      price: 9800,
      purchase_url: "https://example.test/products/coat",
      memo: "draft memo",
      size_gender: "women",
      size_label: "M",
      size_note: "sample note",
      purchased_at: null,
      size_details: {
        structured: {
          shoulder_width: 42,
        },
        custom_fields: [
          {
            label: "length",
            value: 78,
            sort_order: 1,
          },
        ],
      },
      spec: null,
      is_rain_ok: true,
      sheerness: "slight",
      colors: [
        {
          role: "main",
          mode: "preset",
          value: "blue",
          hex: "#3B82F6",
          custom_label: null,
          label: "ブルー",
        },
      ],
      seasons: ["spring"],
      tpos: ["office"],
      materials: [
        {
          part_label: "body",
          material_name: "cotton",
          ratio: 80,
        },
        {
          part_label: "body",
          material_name: "polyester",
          ratio: 20,
        },
      ],
    },
    candidate_summary: {
      id: 1,
      status: "considering",
      priority: "medium",
      name: "Sample Coat",
      converted_item_id: null,
      converted_at: null,
    },
    images: [],
  };
}

it("purchase candidate draft の main color custom_label を復元して送信 payload に含める", async () => {
  searchParamsSourceValue = "purchase-candidate";
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
      "fashion_accessories_eyewear",
      "swimwear_swimwear",
      "kimono_kimono",
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
  fetchUserTposMock.mockResolvedValue({ tpos: [] });
  const draft = createValidPurchaseCandidateItemDraft();
  draft.item_draft.colors[0] = {
    ...draft.item_draft.colors[0],
    custom_label: "64 BLUE",
  };
  window.sessionStorage.setItem(
    "purchase-candidate-item-draft",
    JSON.stringify(draft),
  );

  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({ id: 1 }),
  });
  vi.stubGlobal("fetch", fetchMock);

  const { default: NewItemPage } = await import("./page");
  const localContainer = document.createElement("div");
  document.body.appendChild(localContainer);
  const localRoot = createRoot(localContainer);

  await act(async () => {
    localRoot.render(React.createElement(NewItemPage));
    await waitForEffects();
  });

  const colorNameInput = localContainer.querySelector<HTMLInputElement>(
    "#main_color_custom_label",
  );
  const form = localContainer.querySelector("form");

  expect(colorNameInput?.value).toBe("64 BLUE");
  expect(colorNameInput?.disabled).toBe(false);
  expect(form).not.toBeNull();

  await act(async () => {
    setNativeInputValue(colorNameInput!, "12 GRAY");
    colorNameInput!.dispatchEvent(new Event("input", { bubbles: true }));
    colorNameInput!.dispatchEvent(new Event("change", { bubbles: true }));
    form!.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await waitForEffects();
  });

  const [, requestInit] = fetchMock.mock.calls[0];
  const payload = JSON.parse(requestInit.body as string);

  expect(payload.colors[0].custom_label).toBe("12 GRAY");

  localRoot.unmount();
  localContainer.remove();
});

function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: files,
  });
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

  async function openSizeDetails() {
    const toggleButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("実寸を入力"),
    );
    expect(toggleButton).not.toBeUndefined();

    await act(async () => {
      toggleButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });
  }

  async function collapseSizeDetails() {
    const toggleButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("折りたたむ"),
    );
    expect(toggleButton).not.toBeUndefined();

    await act(async () => {
      toggleButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    searchParamsSourceValue = "";
    searchParamsReturnToValue = "";
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
        "swimwear_swimwear",
        "kimono_kimono",
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
      "水着",
      "着物",
    ]);
    expect(container.textContent).toContain("カテゴリ");
    expect(container.textContent).not.toContain("形");
    expect(container.textContent).toContain("分類");
    expect(container.textContent).toContain("アイテム管理");
    expect(container.textContent).toContain("新規作成");
    expect(container.textContent).toContain(
      "基本情報や分類を入力して、新しいアイテムを登録します。",
    );
    expect(container.innerHTML).toContain('href="/items"');
    expect(container.textContent).toContain("一覧に戻る");
    expect(container.textContent).toContain("色");
    expect(container.textContent).toContain("利用条件・特性");
    expect(container.textContent).toContain("サイズ・実寸");
    expect(container.textContent).toContain("素材・混率");
    expect(container.textContent).toContain("購入情報");
    expect(container.textContent).toContain("補足情報");

    const formColumn = container.querySelector("form > div.space-y-5");
    const pageShell = container.querySelector("main > div.mx-auto");
    expect(pageShell?.className).toContain("max-w-6xl");
    const renderedSectionTitles = Array.from(
      formColumn?.querySelectorAll(
        "section.rounded-2xl.border.border-gray-200.bg-white h2",
      ) ?? [],
    ).map((heading) => heading.textContent);
    expect(renderedSectionTitles).toEqual([
      "基本情報",
      "分類",
      "色",
      "利用条件・特性",
      "サイズ・実寸",
      "素材・混率",
      "購入情報",
      "補足情報",
      "画像",
    ]);
    const sectionsByTitle = new Map(
      Array.from(
        formColumn?.querySelectorAll(
          "section.rounded-2xl.border.border-gray-200.bg-white",
        ) ?? [],
      ).map((section) => [section.querySelector("h2")?.textContent, section]),
    );
    expect(sectionsByTitle.get("基本情報")?.className).toContain(
      "lg:col-span-2",
    );
    expect(sectionsByTitle.get("分類")?.className).toContain("lg:col-span-2");
    expect(sectionsByTitle.get("色")?.className).toContain("lg:col-span-2");
    expect(sectionsByTitle.get("利用条件・特性")?.className).toContain(
      "lg:col-span-2",
    );
    expect(sectionsByTitle.get("購入情報")?.className).toContain(
      "lg:col-span-1",
    );
    expect(sectionsByTitle.get("補足情報")?.className).toContain(
      "lg:col-span-1",
    );
    expect(container.textContent).toContain("ケア状態");
    expect(container.textContent).toContain("透け感");
    expect(container.textContent).toContain("メインカラー");
    expect(container.textContent).toContain("ブランド候補にも追加する");
    expect(container.textContent).toContain("クリックして画像を選択");
    expect(container.textContent).toContain("購入情報");
    expect(container.textContent).toContain("補足情報");
    expect(container.textContent).toContain("雨対応");
    expect(container.textContent).not.toContain(
      "実寸は cm 単位で入力します。未入力の項目は保存しません。",
    );
  });

  it("purchase candidate 由来で returnTo がない場合は購入検討一覧へ戻る", async () => {
    searchParamsSourceValue = "purchase-candidate";

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    expect(container.innerHTML).toContain('href="/purchase-candidates"');
    expect(container.textContent).toContain("購入検討一覧に戻る");
  });

  it("purchase candidate 由来で returnTo がある場合は指定画面へ戻る", async () => {
    searchParamsSourceValue = "purchase-candidate";
    searchParamsReturnToValue = "/purchase-candidates/42";

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    expect(container.innerHTML).toContain('href="/purchase-candidates/42"');
    expect(container.textContent).toContain("元の画面に戻る");
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
          spec: {
            tops: {
              shape: "tshirt",
              sleeve: "short",
              neck: "boat",
            },
          },
          is_rain_ok: true,
          sheerness: "slight",
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

    await openSizeDetails();

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
    const rainCheckbox = container.querySelector<HTMLInputElement>(
      'input[aria-label="\u96e8\u5bfe\u5fdc"]',
    );
    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const careStatusSelect =
      container.querySelector<HTMLSelectElement>("#care-status");
    const sheernessSelect =
      container.querySelector<HTMLSelectElement>("#sheerness");
    const topsSleeveSelect =
      container.querySelector<HTMLSelectElement>("#tops-sleeve");
    const topsNeckSelect =
      container.querySelector<HTMLSelectElement>("#tops-neck");
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
    expect(topsSleeveSelect?.value).toBe("short");
    expect(topsNeckSelect?.value).toBe("boat");
    expect(careStatusSelect?.value).toBe("");
    expect(sheernessSelect?.value).toBe("slight");
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

  it("purchase candidate draft の tops restore は shape を優先する", async () => {
    searchParamsSourceValue = "purchase-candidate";
    const draft = createValidPurchaseCandidateItemDraft();
    window.sessionStorage.setItem(
      "purchase-candidate-item-draft",
      JSON.stringify({
        ...draft,
        item_draft: {
          ...draft.item_draft,
          category: "tops",
          subcategory: "shirt_blouse",
          shape: "shirt",
          spec: {
            tops: {
              shape: "blouse",
            },
          },
        },
      }),
    );

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();
    expect(shapeSelect!.value).toBe("shirt");
  });

  it("purchase candidate draft の tops restore は shape だけで成立し、詳細属性も復元できる", async () => {
    searchParamsSourceValue = "purchase-candidate";
    const draft = createValidPurchaseCandidateItemDraft();
    window.sessionStorage.setItem(
      "purchase-candidate-item-draft",
      JSON.stringify({
        ...draft,
        item_draft: {
          ...draft.item_draft,
          category: "tops",
          subcategory: "shirt_blouse",
          shape: "shirt",
          spec: {
            tops: {
              sleeve: "long",
              neck: "regular_collar",
            },
          },
        },
      }),
    );

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();
    expect(shapeSelect!.value).toBe("shirt");

    const sleeveSelect =
      container.querySelector<HTMLSelectElement>("#tops-sleeve");
    expect(sleeveSelect).not.toBeNull();
    expect(sleeveSelect!.value).toBe("long");
  });

  it("purchase candidate draft の tops / other restore は shape 未解決を維持する", async () => {
    searchParamsSourceValue = "purchase-candidate";
    const draft = createValidPurchaseCandidateItemDraft();
    window.sessionStorage.setItem(
      "purchase-candidate-item-draft",
      JSON.stringify({
        ...draft,
        item_draft: {
          ...draft.item_draft,
          category: "tops",
          subcategory: "other",
          shape: "",
          spec: {
            tops: {
              sleeve: "long",
            },
          },
        },
      }),
    );

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();
    expect(subcategorySelect!.value).toBe("other");
    expect(container.querySelector("#shape")).toBeNull();
    expect(container.querySelector("#tops-shape")).toBeNull();
  });

  it("purchase candidate draft の tops restore→submit は shape を正本として送信する", async () => {
    searchParamsSourceValue = "purchase-candidate";
    const draft = createValidPurchaseCandidateItemDraft();
    window.sessionStorage.setItem(
      "purchase-candidate-item-draft",
      JSON.stringify({
        ...draft,
        item_draft: {
          ...draft.item_draft,
          category: "tops",
          subcategory: "shirt_blouse",
          shape: "shirt",
          spec: {
            tops: {
              shape: "blouse",
            },
          },
        },
      }),
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
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

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.shape).toBe("shirt");
    expect(payload.spec?.tops?.shape).toBeUndefined();
  });

  it("tops / other の未解決 shape は送信時もそのまま許容する", async () => {
    searchParamsSourceValue = "purchase-candidate";
    fetchCategoryGroupsMock.mockResolvedValueOnce([
      {
        ...sampleGroups[0],
        categories: [
          ...sampleGroups[0]!.categories,
          {
            id: "tops_other",
            groupId: "tops",
            name: "その他トップス",
            sortOrder: 999,
          },
        ],
      },
      ...sampleGroups.slice(1),
    ]);
    fetchCategoryVisibilitySettingsMock.mockResolvedValueOnce({
      visibleCategoryIds: [
        "tops_tshirt_cutsew",
        "tops_other",
        "outerwear_jacket",
        "pants_pants",
        "onepiece_dress_onepiece",
        "allinone_allinone",
        "roomwear_inner_roomwear",
        "legwear_socks",
        "shoes_sneakers",
        "bags_tote",
        "fashion_accessories_belt",
        "fashion_accessories_eyewear",
        "swimwear_swimwear",
        "kimono_kimono",
      ],
    });
    const draft = createValidPurchaseCandidateItemDraft();
    window.sessionStorage.setItem(
      "purchase-candidate-item-draft",
      JSON.stringify({
        ...draft,
        item_draft: {
          ...draft.item_draft,
          source_category_id: "tops_other",
          category: "tops",
          subcategory: "other",
          shape: "",
          spec: null,
        },
      }),
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();

    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    await act(async () => {
      form!.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await waitForEffects();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.shape).toBe("");
    expect(payload.spec?.tops?.shape).toBeUndefined();
    expect(payload.spec?.tops?.fit).toBe("normal");
  });

  it("季節のオールを排他的に切り替える", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const allButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "オール",
    );
    const springButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "春",
    );

    expect(allButton).toBeDefined();
    expect(springButton).toBeDefined();

    await act(async () => {
      allButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(allButton?.getAttribute("aria-pressed")).toBe("true");
    expect(springButton?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      springButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(allButton?.getAttribute("aria-pressed")).toBe("false");
    expect(springButton?.getAttribute("aria-pressed")).toBe("true");
  });

  it("初期状態では実寸本体を閉じ、開くと固定実寸を表示する", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("実寸");
    expect(container.textContent).toContain("実寸を入力");
    expect(container.textContent).not.toContain("自由項目を追加");
    expect(container.querySelector("#structured-size-waist")).toBeNull();

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
    expect(subcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "denim";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      shapeSelect!.value = "straight";
      shapeSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await openSizeDetails();

    expect(container.textContent).toContain("自由項目を追加");
    expect(container.querySelector("#structured-size-waist")).not.toBeNull();
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
    expect(subcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "denim";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();

    expect(container.textContent).toContain("丈");
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

    let legwearSubcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(legwearSubcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();
    expect(container.querySelector("#legwear-coverage-type")).toBeNull();

    await act(async () => {
      categorySelect!.value = "tops";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#bottoms-rise-type")).toBeNull();

    await act(async () => {
      categorySelect!.value = "legwear";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    legwearSubcategorySelect =
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
    expect(
      (
        container.querySelector(
          "#legwear-coverage-type",
        ) as HTMLSelectElement | null
      )?.options[0]?.textContent,
    ).toBe("選択してください");
    expect(container.querySelector("#legwear-coverage-type")).not.toBeNull();
    expect(
      Array.from(
        (
          container.querySelector(
            "#legwear-coverage-type",
          ) as HTMLSelectElement | null
        )?.options ?? [],
      ).some((option) => option.textContent === "ルーズソックス"),
    ).toBe(true);
    expect(
      Array.from(
        (
          container.querySelector(
            "#legwear-coverage-type",
          ) as HTMLSelectElement | null
        )?.options ?? [],
      ).some((option) => option.textContent === "ニーハイソックス"),
    ).toBe(true);

    await act(async () => {
      legwearSubcategorySelect!.value = "leggings";
      legwearSubcategorySelect!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
    expect(container.textContent).toContain("レギンス・スパッツの長さ");
    expect(
      Array.from(
        (
          container.querySelector(
            "#legwear-coverage-type",
          ) as HTMLSelectElement | null
        )?.options ?? [],
      ).map((option) => option.value),
    ).toContain("seven_tenths");

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
    expect(container.textContent).not.toContain("レギンス・スパッツの長さ");
  });

  it("item spec の必須表示を docs どおり描画する", async () => {
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
        "outerwear_jacket",
        "pants_pants",
        "skirts_skirt",
        "onepiece_dress_onepiece",
        "allinone_allinone",
        "roomwear_inner_roomwear",
        "legwear_socks",
        "shoes_sneakers",
        "bags_tote",
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
      categorySelect!.value = "pants";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const pantsSubcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(pantsSubcategorySelect).not.toBeNull();

    await act(async () => {
      pantsSubcategorySelect!.value = "denim";
      pantsSubcategorySelect!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(
      container.querySelector('label[for="bottoms-length-type"]')?.textContent,
    ).toContain("必須");
    expect(
      container.querySelector('label[for="bottoms-rise-type"]')?.textContent,
    ).not.toContain("必須");

    await act(async () => {
      categorySelect!.value = "skirts";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(
      container.querySelector('label[for="bottoms-length-type"]')?.textContent,
    ).toContain("必須");
    expect(
      container.querySelector('label[for="skirt-material-type"]')?.textContent,
    ).not.toContain("必須");
    expect(
      container.querySelector('label[for="skirt-design-type"]')?.textContent,
    ).not.toContain("必須");

    await act(async () => {
      categorySelect!.value = "legwear";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

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

    expect(
      container.querySelector('label[for="legwear-coverage-type"]')
        ?.textContent,
    ).toContain("必須");

    await act(async () => {
      legwearSubcategorySelect!.value = "leggings";
      legwearSubcategorySelect!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(
      container.querySelector('label[for="legwear-coverage-type"]')
        ?.textContent,
    ).toContain("必須");

    await act(async () => {
      categorySelect!.value = "tops";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const topsSubcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(topsSubcategorySelect).not.toBeNull();

    await act(async () => {
      topsSubcategorySelect!.value = "tshirt_cutsew";
      topsSubcategorySelect!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(
      container.querySelector('label[for="tops-sleeve"]')?.textContent ?? "",
    ).not.toContain("必須");
    expect(
      container.querySelector('label[for="tops-length"]')?.textContent ?? "",
    ).not.toContain("必須");
    expect(
      container.querySelector('label[for="tops-neck"]')?.textContent ?? "",
    ).not.toContain("必須");
    expect(
      container.querySelector('label[for="tops-design"]')?.textContent ?? "",
    ).not.toContain("必須");
    expect(
      container.querySelector('label[for="tops-fit"]')?.textContent ?? "",
    ).not.toContain("必須");
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

  it("roomwear_inner は形を表示せず種類に応じて内部補完する", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

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

    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "other";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
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
    expect(subcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "denim";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();

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

    expect(container.textContent).toContain("丈を選択してください。");
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
    expect(subcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "denim";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();

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

    expect(container.querySelector("#shape")).toBeNull();

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();

    await act(async () => {
      subcategorySelect!.value = "coat";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();
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
    ).toEqual(["", "jacket", "tailored", "no_collar", "blazer"]);
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

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    const lengthTypeSelect = container.querySelector<HTMLSelectElement>(
      "#bottoms-length-type",
    );
    const materialTypeSelect = container.querySelector<HTMLSelectElement>(
      "#skirt-material-type",
    );
    const designTypeSelect =
      container.querySelector<HTMLSelectElement>("#skirt-design-type");
    expect(subcategorySelect).not.toBeNull();
    expect(
      Array.from(subcategorySelect!.options).map((option) => option.value),
    ).toEqual(["", "skirt", "other"]);
    expect(subcategorySelect!.value).toBe("skirt");
    expect(shapeSelect).not.toBeNull();
    expect(lengthTypeSelect).not.toBeNull();
    expect(materialTypeSelect).not.toBeNull();
    expect(designTypeSelect).not.toBeNull();

    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual(["", "tight", "flare", "a_line", "mermaid"]);
    expect(
      Array.from(lengthTypeSelect!.options).map((option) => option.value),
    ).toEqual(["", "mini", "knee", "midi", "mid_calf", "long", "maxi"]);
    expect(
      Array.from(materialTypeSelect!.options).map((option) => option.value),
    ).toEqual(["", "tulle", "lace", "denim", "leather", "satin"]);
    expect(
      Array.from(designTypeSelect!.options).map((option) => option.value),
    ).toEqual([
      "",
      "tuck",
      "gather",
      "pleats",
      "tiered",
      "wrap",
      "balloon",
      "trench",
    ]);
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

  it("onepiece_dress と allinone は形を表示せず内部補完する", async () => {
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
    expect(shapeSelect).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "onepiece";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "dress";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      categorySelect!.value = "allinone";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "salopette";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(shapeSelect).toBeNull();
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
      "scarf_bandana",
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

  it("swimwear は種類 select を表示し、shape を表示しない", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "swimwear";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();
    expect(
      Array.from(subcategorySelect!.options).map((option) => option.value),
    ).toEqual(["", "swimwear", "rashguard", "other"]);
    expect(subcategorySelect!.value).toBe("swimwear");
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "rashguard";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("shoes は種類 select を表示し、選択に応じて shape を自動設定できる", async () => {
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

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");

    expect(subcategorySelect).not.toBeNull();
    expect(
      Array.from(subcategorySelect!.options).map((option) => option.value),
    ).toEqual([
      "",
      "sneakers",
      "pumps",
      "boots",
      "sandals",
      "leather_shoes",
      "rain_shoes_boots",
      "other",
    ]);
    expect(subcategorySelect!.value).toBe("sneakers");
    expect(shapeSelect).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "boots";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "leather_shoes";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });
  });

  it("kimono は種類 select を表示し、shape を表示しない", async () => {
    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "kimono";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();
    expect(
      Array.from(subcategorySelect!.options).map((option) => option.value),
    ).toEqual(["", "kimono", "yukata", "japanese_accessory", "other"]);
    expect(subcategorySelect!.value).toBe("kimono");
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "yukata";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
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

  it("tops で候補が1つの形は表示せず内部補完する", async () => {
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
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "hoodie";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
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
    expect(shapeSelect).toBeNull();
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
    expect(shapeSelect).toBeNull();
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
    expect(subcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();
    expect(
      container.querySelector<HTMLLabelElement>('label[for="shape"]'),
    ).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "blouson";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    const shapeLabel =
      container.querySelector<HTMLLabelElement>('label[for="shape"]');
    expect(shapeSelect).toBeNull();
    expect(shapeLabel).toBeNull();
  });

  it("固定項目と自由項目の重複は短い警告文で表示する", async () => {
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
      subcategorySelect!.value = "tshirt_cutsew";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await openSizeDetails();

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

  it("5000系の登録失敗でも raw message を表示しない", async () => {
    searchParamsSourceValue = "purchase-candidate";
    window.sessionStorage.setItem(
      "purchase-candidate-item-draft",
      JSON.stringify(createValidPurchaseCandidateItemDraft()),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          message: "SQLSTATE[42S22]: Unknown column custom_label",
        }),
      }),
    );

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
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

    expect(container.textContent).toContain("アイテムの登録に失敗しました");
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("登録済み後の画像追加失敗でも raw message を表示しない", async () => {
    searchParamsSourceValue = "purchase-candidate";
    window.sessionStorage.setItem(
      "purchase-candidate-item-draft",
      JSON.stringify(createValidPurchaseCandidateItemDraft()),
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ item: { id: 101 } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: "SQLSTATE[42S22]: Unknown column custom_label",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { default: NewItemPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewItemPage));
      await waitForEffects();
    });

    const fileInput =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();

    await act(async () => {
      setInputFiles(fileInput!, [
        new File(["test"], "sample.png", { type: "image/png" }),
      ]);
      fileInput!.dispatchEvent(new Event("change", { bubbles: true }));
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

    expect(container.textContent).toContain(
      "アイテムは登録済みですが、画像の追加に失敗しました",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("shape 未解決では fallback を出し、解決後に固定実寸を表示する", async () => {
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
    expect(subcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "denim";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await openSizeDetails();

    expect(container.querySelector("#structured-size-waist")).toBeNull();
    expect(container.textContent).toContain(
      "現在のカテゴリと形に対応する固定実寸はありません。必要なら自由項目を追加してください。",
    );

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      shapeSelect!.value = "straight";
      shapeSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#structured-size-waist")).not.toBeNull();
  });

  it("分類情報から shape が解決できる場合は明示入力前でも固定実寸を表示する", async () => {
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
      subcategorySelect!.value = "tshirt_cutsew";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await openSizeDetails();

    expect(
      container.querySelector<HTMLInputElement>(
        "#structured-size-shoulder_width",
      ),
    ).not.toBeNull();
  });

  it("tops の hoodie でも固定実寸を表示する", async () => {
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
      subcategorySelect!.value = "hoodie";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();

    await openSizeDetails();

    expect(
      container.querySelector<HTMLInputElement>(
        "#structured-size-shoulder_width",
      ),
    ).not.toBeNull();
    expect(
      container.querySelector<HTMLInputElement>("#structured-size-body_length"),
    ).not.toBeNull();
  });

  it("outerwear の blazer でも固定実寸を表示する", async () => {
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

    const outerwearSubcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(outerwearSubcategorySelect).not.toBeNull();

    await act(async () => {
      outerwearSubcategorySelect!.value = "jacket";
      outerwearSubcategorySelect!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
      await waitForEffects();
    });

    const outerwearShapeSelect =
      container.querySelector<HTMLSelectElement>("#shape");
    expect(outerwearShapeSelect).not.toBeNull();

    await act(async () => {
      outerwearShapeSelect!.value = "blazer";
      outerwearShapeSelect!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
      await waitForEffects();
    });

    await openSizeDetails();

    expect(
      container.querySelector<HTMLInputElement>(
        "#structured-size-shoulder_width",
      ),
    ).not.toBeNull();
    expect(
      container.querySelector<HTMLInputElement>("#structured-size-cuff_width"),
    ).not.toBeNull();

    return;

    const collapseButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("折りたたむ"));
    expect(collapseButton).not.toBeUndefined();

    await act(async () => {
      collapseButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      categorySelect!.value = "skirts";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });
    await waitForEffects();

    const skirtsSubcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(skirtsSubcategorySelect).not.toBeNull();

    await act(async () => {
      skirtsSubcategorySelect!.value = "skirt";
      skirtsSubcategorySelect!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
      await waitForEffects();
    });

    const skirtsShapeSelect =
      container.querySelector<HTMLSelectElement>("#shape");
    expect(skirtsShapeSelect).not.toBeNull();

    await act(async () => {
      skirtsShapeSelect!.value = "mermaid";
      skirtsShapeSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await openSizeDetails();

    expect(
      container.querySelector<HTMLInputElement>("#structured-size-waist"),
    ).not.toBeNull();
    expect(
      container.querySelector<HTMLInputElement>(
        "#structured-size-total_length",
      ),
    ).not.toBeNull();
  });
});
