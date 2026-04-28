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
const fetchUserPreferencesMock = vi.fn();
const fetchUserBrandsMock = vi.fn();
const fetchUserTposMock = vi.fn();
const scrollIntoViewMock = vi.fn();
const routerMock = { push: pushMock, refresh: refreshMock };

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(),
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
    id: "underwear",
    name: "アンダーウェア",
    sortOrder: 32,
    categories: [
      {
        id: "underwear_bra",
        groupId: "underwear",
        name: "ブラ",
        sortOrder: 10,
      },
      {
        id: "underwear_shorts",
        groupId: "underwear",
        name: "ショーツ",
        sortOrder: 20,
      },
      {
        id: "underwear_shapewear",
        groupId: "underwear",
        name: "補正下着",
        sortOrder: 30,
      },
      {
        id: "underwear_undershirt",
        groupId: "underwear",
        name: "肌着",
        sortOrder: 40,
      },
      {
        id: "underwear_other",
        groupId: "underwear",
        name: "その他アンダーウェア",
        sortOrder: 50,
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
        id: "fashion_accessories_eyewear",
        groupId: "fashion_accessories",
        name: "メガネ・サングラス",
        sortOrder: 80,
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

function createEditableItemResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Sample Item",
    status: "active",
    care_status: "good",
    sheerness: "slight",
    brand_name: "Sample Brand",
    price: 19800,
    purchase_url: "https://example.test/items/1",
    memo: "sample memo",
    purchased_at: "2026-03-24T00:00:00.000000Z",
    size_gender: "women",
    size_label: "M",
    size_note: "sample note",
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
    is_rain_ok: true,
    category: "tops",
    subcategory: "tshirt_cutsew",
    shape: "tshirt",
    colors: [
      {
        role: "main",
        mode: "preset",
        value: "blue",
        hex: "#3B82F6",
        label: "ブルー",
      },
    ],
    seasons: [],
    tpos: [],
    tpo_ids: [],
    spec: null,
    materials: [],
    images: [],
    ...overrides,
  };
}

function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: files,
  });
}

describe("編集画面", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  async function openSizeDetails() {
    const collapseButton = container.querySelector<HTMLButtonElement>(
      'button[aria-expanded="true"]',
    );
    if (collapseButton) {
      return;
    }

    const toggleButton = container.querySelector<HTMLButtonElement>(
      'button[aria-expanded="false"]',
    );
    expect(toggleButton).not.toBeUndefined();

    await act(async () => {
      toggleButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
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
        "underwear_other",
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
            sheerness: "slight",
            brand_name: "Sample Brand",
            price: 19800,
            purchase_url: "https://example.test/items/1",
            memo: "既存メモ",
            purchased_at: "2026-03-24T00:00:00.000000Z",
            size_gender: "women",
            size_label: "M",
            size_note: "厚手ニット込み",
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
            is_rain_ok: true,
            category: "tops",
            subcategory: "tshirt_cutsew",
            shape: "tshirt",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: null,
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

  it("編集画面でも表示設定に含まれるワンピース / オールインワンと inner をカテゴリ候補に含める", async () => {
    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();
    expect(categorySelect!.value).toBe("tops");
    expect(container.textContent).toContain("アイテム管理");
    expect(container.textContent).toContain("編集");
    expect(container.textContent).toContain(
      "登録済みのアイテム情報を見直して更新します。",
    );
    expect(container.innerHTML).toContain('href="/items/1"');
    expect(container.textContent).toContain("詳細に戻る");

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
      "アンダーウェア",
      "レッグウェア",
      "シューズ",
      "バッグ",
      "ファッション小物",
      "水着",
      "着物",
    ]);
    expect(container.textContent).toContain("カテゴリ");
    expect(container.textContent).toContain("素材・混率");
    expect(container.textContent).toContain(
      "分かる場合だけ入力します。区分ごとの合計が100%になるように設定してください。",
    );
    const materialInput = container.querySelector<HTMLInputElement>(
      'input[list="item-material-name-options"]',
    );
    expect(materialInput?.value).toBe("綿");
    expect(container.textContent).toContain("分類");
    expect(container.textContent).toContain("色とプレビュー");
    expect(container.textContent).toContain("利用条件・特性");
    expect(container.textContent).toContain("サイズ");
    expect(container.textContent).toContain("購入・補足");
    expect(container.textContent).toContain("ケア状態");
    expect(container.textContent).toContain("透け感");
    const pageShell = container.querySelector("main > div.mx-auto");
    expect(pageShell?.className).toContain("max-w-6xl");
    expect(container.textContent).toContain("メインカラー");
    expect(container.textContent).toContain("ブランド候補にも追加する");
    expect(container.textContent?.match(/必須/g)?.length).toBe(3);
    expect(
      (container.querySelector("#subcategory") as HTMLSelectElement | null)
        ?.value,
    ).toBe("tshirt_cutsew");
    expect(
      (container.querySelector("#brand-name") as HTMLInputElement | null)
        ?.value,
    ).toBe("Sample Brand");
    expect(
      (container.querySelector("#price") as HTMLInputElement | null)?.value,
    ).toBe("19800");
    const form = container.querySelector("form");
    expect(form?.className).toContain("xl:grid-cols-[minmax(0,1fr)_20rem]");
    expect(form?.className).not.toContain("lg:grid-cols-[minmax(0,1fr)_20rem]");
    expect(form?.firstElementChild?.className).toContain("xl:col-start-2");

    await openSizeDetails();

    expect(
      (
        container.querySelector(
          "#structured-size-shoulder_width",
        ) as HTMLInputElement | null
      )?.value,
    ).toBe("42");
    expect(
      (
        container.querySelector(
          'input[placeholder="項目名"]',
        ) as HTMLInputElement | null
      )?.value,
    ).toBe("裄丈");
    expect(
      (container.querySelector("#memo") as HTMLTextAreaElement | null)?.value,
    ).toBe("既存メモ");
    expect(container.textContent).toContain("画像");
    expect(container.textContent).toContain(
      "画像を貼り付け、またはドラッグ＆ドロップ",
    );
    expect(container.textContent).toContain("代表画像");
    expect(container.textContent).toContain("削除");
    expect(container.textContent).not.toContain("現在登録されている画像の確認");
    expect(
      (container.querySelector("#care-status") as HTMLSelectElement | null)
        ?.value,
    ).toBe("in_cleaning");
    expect(
      (container.querySelector("#sheerness") as HTMLSelectElement | null)
        ?.value,
    ).toBe("slight");
  }, 20000);

  it("編集画面でボトムス丈とレッグウェア設定を表示できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 2,
            name: "ソックス",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "legwear",
            subcategory: "socks",
            shape: "socks",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {
              legwear: {
                coverage_type: "crew",
              },
            },
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "2" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    expect(
      (
        container.querySelector(
          "#legwear-coverage-type",
        ) as HTMLSelectElement | null
      )?.value,
    ).toBe("crew");
    const legwearSubcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(legwearSubcategorySelect?.value).toBe("socks");
    expect(container.textContent).toContain("ソックスの長さ");
    expect(
      (
        container.querySelector(
          "#legwear-coverage-type",
        ) as HTMLSelectElement | null
      )?.options[0]?.textContent,
    ).toBe("選択してください");
  });

  it("編集画面でレギンスの current coverage_type を自然に復元できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 4,
            name: "ブラックレギンス",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "legwear",
            subcategory: "leggings",
            shape: "leggings",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {
              legwear: {
                coverage_type: "seven_tenths",
              },
            },
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "4" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    expect(
      (
        container.querySelector(
          "#legwear-coverage-type",
        ) as HTMLSelectElement | null
      )?.value,
    ).toBe("seven_tenths");
    const legwearSubcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(legwearSubcategorySelect?.value).toBe("leggings");
    expect(container.textContent).toContain("レギンス・スパッツの長さ");
    expect(
      (
        container.querySelector(
          "#legwear-coverage-type",
        ) as HTMLSelectElement | null
      )?.options[0]?.textContent,
    ).toBe("選択してください");
  });
  it("編集画面でタイツは追加選択なしで扱える", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 3,
            name: "ブラックタイツ",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "legwear",
            subcategory: "tights",
            shape: "tights",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {
              legwear: {
                coverage_type: "tights",
              },
            },
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "3" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    const tightsSubcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(tightsSubcategorySelect?.value).toBe("tights");
    expect(container.querySelector("#legwear-coverage-type")).toBeNull();
    expect(container.textContent).not.toContain("レッグウェア仕様");
  });

  it("編集画面で TPO の取得に失敗した場合は取得失敗を表示する", async () => {
    fetchUserTposMock.mockRejectedValueOnce(new Error("failed"));

    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "2" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    expect(container.textContent).toContain("TPO の取得に失敗しました。");
    expect(container.textContent).not.toContain(
      "有効な TPO はまだありません。",
    );
  });

  it("編集画面でも roomwear_inner は種類に応じて shape を自動設定できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 4,
            name: "インナー",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "inner",
            subcategory: "underwear",
            shape: "underwear",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {},
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "4" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect?.value).toBe("underwear");
    expect(subcategorySelect?.value).toBe("other");
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "other";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("編集画面でも pants の種類に応じて shape 候補を絞り込める", async () => {
    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(categorySelect).not.toBeNull();
    expect(subcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      categorySelect!.value = "pants";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

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
    expect(container.querySelector("#bottoms-rise-type")).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "tops";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#bottoms-rise-type")).toBeNull();
  });

  it("編集画面では pants の股上を初期値として復元する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 2,
            name: "パンツサンプル",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "pants",
            subcategory: "denim",
            shape: "skinny",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {
              bottoms: {
                length_type: "ankle",
                rise_type: "high_waist",
              },
            },
            materials: [],
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "2" }),
        }),
      );
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    const riseTypeSelect =
      container.querySelector<HTMLSelectElement>("#bottoms-rise-type");

    expect(categorySelect?.value).toBe("pants");
    expect(subcategorySelect?.value).toBe("denim");
    expect(shapeSelect?.value).toBe("skinny");
    expect(riseTypeSelect).not.toBeNull();
    expect(riseTypeSelect?.value).toBe("high_waist");
  });

  it("編集画面では skirts の新しい丈 spec を初期値として復元する", async () => {
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
        "underwear_other",
        "legwear_socks",
        "shoes_sneakers",
        "bags_tote",
        "fashion_accessories_belt",
        "fashion_accessories_eyewear",
        "swimwear_swimwear",
        "kimono_kimono",
      ],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 6,
            name: "ミモレスカート",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "skirts",
            subcategory: "skirt",
            shape: "narrow",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {
              skirt: {
                length_type: "mid_calf",
                material_type: "lace",
                design_type: "tiered",
              },
            },
            materials: [],
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "6" }),
        }),
      );
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
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

    expect(categorySelect?.value).toBe("skirts");
    expect(subcategorySelect?.value).toBe("skirt");
    expect(shapeSelect?.value).toBe("narrow");
    expect(lengthTypeSelect?.value).toBe("mid_calf");
    expect(materialTypeSelect?.value).toBe("lace");
    expect(designTypeSelect?.value).toBe("tiered");
    expect(container.querySelector("#bottoms-rise-type")).toBeNull();
  });

  it("編集画面では skirts の旧丈 spec を fallback で復元する", async () => {
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
        "underwear_other",
        "legwear_socks",
        "shoes_sneakers",
        "bags_tote",
        "fashion_accessories_belt",
        "fashion_accessories_eyewear",
        "swimwear_swimwear",
        "kimono_kimono",
      ],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 7,
            name: "旧丈スカート",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "skirts",
            subcategory: "skirt",
            shape: "flare",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {
              bottoms: {
                length_type: "cropped",
              },
            },
            materials: [],
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "7" }),
        }),
      );
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    const lengthTypeSelect = container.querySelector<HTMLSelectElement>(
      "#bottoms-length-type",
    );

    expect(categorySelect?.value).toBe("skirts");
    expect(subcategorySelect?.value).toBe("skirt");
    expect(shapeSelect?.value).toBe("flare");
    expect(lengthTypeSelect?.value).toBe("midi");
    expect(container.querySelector("#bottoms-rise-type")).toBeNull();
  });

  it("編集画面でも other 系の一部カテゴリでは shape を表示しない", async () => {
    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
    });

    await act(async () => {
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

    await act(async () => {
      subcategorySelect!.value = "other";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("編集画面では skirts / other を shape なしで復元し、固定実寸を出さない", async () => {
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
          {
            id: "skirts_other",
            groupId: "skirts",
            name: "その他スカート",
            sortOrder: 20,
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
        "skirts_other",
        "onepiece_dress_onepiece",
        "allinone_allinone",
        "roomwear_inner_roomwear",
        "underwear_other",
        "legwear_socks",
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
            name: "その他スカート編集",
            status: "active",
            care_status: null,
            category: "skirts",
            subcategory: "other",
            shape: "other",
            colors: [],
            seasons: [],
            tpos: [],
            spec: {
              skirt: {
                length_type: "midi",
                material_type: "lace",
              },
            },
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: {
              custom_fields: [
                {
                  label: "裾幅",
                  value: { value: 58, min: null, max: null, note: null },
                  sort_order: 1,
                },
              ],
            },
            is_rain_ok: false,
            images: [],
            materials: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    expect(container.querySelector<HTMLSelectElement>("#category")?.value).toBe(
      "skirts",
    );
    expect(
      container.querySelector<HTMLSelectElement>("#subcategory")?.value,
    ).toBe("other");
    expect(container.querySelector("#shape")).toBeNull();
    expect(
      container.querySelector<HTMLSelectElement>("#bottoms-length-type")?.value,
    ).toBe("midi");
    expect(
      container.querySelector<HTMLSelectElement>("#skirt-material-type")?.value,
    ).toBe("lace");

    const sizeToggle = container.querySelector<HTMLButtonElement>(
      'button[aria-expanded="false"]',
    );
    expect(sizeToggle).not.toBeUndefined();

    await act(async () => {
      sizeToggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#structured-size-waist")).toBeNull();
    expect(container.textContent).toContain(
      "現在のカテゴリと形に対応する固定実寸はありません。必要なら自由項目を追加してください。",
    );
  });

  it("編集画面でも outerwear の種類に応じて shape 候補を絞り込める", async () => {
    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(categorySelect).not.toBeNull();
    expect(subcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      categorySelect!.value = "outerwear";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();

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

  it("編集画面でも allinone の shape を常に表示しない", async () => {
    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "allinone";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "salopette";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("編集画面でも bags は種類 select を表示し、選択に応じて shape を自動設定できる", async () => {
    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

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
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "shoulder";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("編集画面でも rucksack を自然に復元できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 17,
            name: "バッグサンプル",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "bags",
            subcategory: "rucksack",
            shape: "rucksack",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {},
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "17" }),
        }),
      );
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");

    expect(subcategorySelect?.value).toBe("rucksack");
    expect(container.textContent).toContain("リュックサック・バックパック");
    expect(container.querySelector("#shape")).toBeNull();
  });

  it("編集画面でも fashion_accessories は種類に応じて shape を自動設定できる", async () => {
    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    const categorySelect =
      container.querySelector<HTMLSelectElement>("#category");
    expect(categorySelect).not.toBeNull();
    expect(container.querySelector("#shape")).toBeNull();

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
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "watch";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("編集画面でも eyewear を自然に復元できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 16,
            name: "メガネサンプル",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "fashion_accessories",
            subcategory: "eyewear",
            shape: "eyewear",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {},
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "16" }),
        }),
      );
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");

    expect(subcategorySelect?.value).toBe("eyewear");
    expect(container.textContent).toContain("メガネ・サングラス");
    expect(container.querySelector("#shape")).toBeNull();
  });

  it("編集画面で scarf_bandana を自然に復元できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 17,
            name: "スカーフ・バンダナ",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "fashion_accessories",
            subcategory: "scarf_bandana",
            shape: "scarf-bandana",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {},
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "17" }),
        }),
      );
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");

    expect(subcategorySelect?.value).toBe("scarf_bandana");
    expect(container.textContent).toContain("スカーフ・バンダナ");
    expect(container.querySelector("#shape")).toBeNull();
  });

  it("編集画面では旧 wallet_case をその他として復元する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 18,
            name: "財布・カードケース",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "fashion_accessories",
            subcategory: "wallet_case",
            shape: "wallet-case",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {},
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "18" }),
        }),
      );
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");

    expect(subcategorySelect?.value).toBe("other");
    expect(container.querySelector("#shape")).toBeNull();
  });
  it("編集画面でも tops の形は分類セクション側で扱う", async () => {
    const { default: EditItemPage } = await import("./page");

    act(() => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
    });

    await act(async () => {
      await waitForEffects();
    });

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).toBeNull();
    expect(container.querySelector("#tops-shape")).toBeNull();
  });

  it("編集画面では tops の other を未指定 shape として復元する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 1,
            name: "分類保留トップス",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "tops",
            subcategory: "other",
            shape: "tshirt",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: null,
            materials: [],
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect).not.toBeNull();
    expect(subcategorySelect!.value).toBe("other");
    expect(container.querySelector("#shape")).toBeNull();
    expect(container.querySelector("#tops-shape")).toBeNull();
  });

  it("編集画面の tops restore は shape を優先する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: createEditableItemResponse({
            category: "tops",
            subcategory: "shirt_blouse",
            shape: "shirt",
            spec: {
              tops: {
                shape: "blouse",
              },
            },
          }),
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
      await waitForEffects();
    });

    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();
    expect(shapeSelect!.value).toBe("shirt");
  });

  it("編集画面の tops restore は shape だけで成立し、詳細属性も復元できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: createEditableItemResponse({
            category: "tops",
            subcategory: "shirt_blouse",
            shape: "shirt",
            spec: {
              tops: {
                sleeve: "long",
                neck: "regular_collar",
              },
            },
          }),
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
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

  it("編集画面の tops submit は shape を正本として送信する", async () => {
    let putPayload: Record<string, unknown> | null = null;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (!init || !init.method || init.method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              item: createEditableItemResponse({
                category: "tops",
                subcategory: "shirt_blouse",
                shape: "shirt",
                spec: {
                  tops: {
                    shape: "blouse",
                  },
                },
              }),
            }),
          });
        }

        if (url === "/api/items/1" && init.method === "PUT") {
          putPayload = JSON.parse(init.body as string) as Record<
            string,
            unknown
          >;
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              item: createEditableItemResponse({
                category: "tops",
                subcategory: "shirt_blouse",
                shape: "shirt",
              }),
            }),
          });
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ item: createEditableItemResponse() }),
        });
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
      await waitForEffects();
    });

    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    await act(async () => {
      const sheernessSelect =
        container.querySelector<HTMLSelectElement>("#sheerness");
      setNativeInputValue(sheernessSelect!, "high");
      sheernessSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      form!.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await waitForEffects();
    });

    expect(putPayload).not.toBeNull();
    expect(putPayload?.shape).toBe("shirt");
    expect(putPayload?.sheerness).toBe("high");
    expect(
      (putPayload?.spec as { tops?: { shape?: string } })?.tops?.shape,
    ).toBeUndefined();
  });

  it("編集画面でも tops の種類変更に応じて形と候補を連動する", async () => {
    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
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

  it("編集画面でも swimwear は種類 select を表示し、shape を表示しない", async () => {
    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
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

  it("編集画面でも rashguard を自然に復元できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 14,
            name: "ラッシュガードサンプル",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "swimwear",
            subcategory: "rashguard",
            shape: "rashguard",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {},
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "14" }),
        }),
      );
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect?.value).toBe("rashguard");
    expect(container.querySelector("#shape")).toBeNull();
  });

  it("編集画面でも leather_shoes を自然に復元できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 11,
            name: "黒の革靴",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "shoes",
            subcategory: "leather_shoes",
            shape: "leather-shoes",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {},
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "11" }),
        }),
      );
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect?.value).toBe("leather_shoes");
    expect(container.querySelector("#shape")).toBeNull();
  });

  it("編集画面でも rain_shoes_boots を自然に復元できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 12,
            name: "レインブーツ",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "shoes",
            subcategory: "rain_shoes_boots",
            shape: "rain-shoes-boots",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {},
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "12" }),
        }),
      );
      await waitForEffects();
    });

    const subcategorySelect =
      container.querySelector<HTMLSelectElement>("#subcategory");
    expect(subcategorySelect?.value).toBe("rain_shoes_boots");
    expect(container.querySelector("#shape")).toBeNull();
  });
  it("編集画面でも shoes は種類 select を表示し、選択に応じて shape を自動設定できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 1,
            name: "白スニーカー",
            status: "active",
            care_status: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            category: "shoes",
            subcategory: "sneakers",
            shape: "sneakers",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {},
            images: [],
          },
        }),
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
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
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategorySelect!.value = "boots";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });

  it("5000系の更新失敗でも raw message を表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (!init || !init.method || init.method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ item: createEditableItemResponse() }),
          });
        }
        if (url === "/api/items/1" && init.method === "PUT") {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({
              message: "SQLSTATE[42S22]: Unknown column custom_label",
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ item: createEditableItemResponse() }),
        });
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
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

    expect(container.textContent).toContain("アイテムの更新に失敗しました");
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("更新済み後の画像追加失敗でも raw message を表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (!init || !init.method || init.method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ item: createEditableItemResponse() }),
          });
        }
        if (url === "/api/items/1" && init.method === "PUT") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ item: createEditableItemResponse() }),
          });
        }
        if (url === "/api/items/1/images" && init.method === "POST") {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({
              message: "SQLSTATE[42S22]: Unknown column custom_label",
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ item: createEditableItemResponse() }),
        });
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
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
      "アイテムは更新済みですが、画像の追加に失敗しました",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("画像削除失敗でも raw message を表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (!init || !init.method || init.method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              item: createEditableItemResponse({
                images: [
                  {
                    id: 1,
                    item_id: 1,
                    disk: "public",
                    path: "items/1/sample.png",
                    url: "https://example.test/storage/items/1/sample.png",
                    original_filename: "sample.png",
                    mime_type: "image/png",
                    file_size: 1000,
                    sort_order: 1,
                    is_primary: true,
                  },
                ],
              }),
            }),
          });
        }
        if (url === "/api/items/1/images/1" && init?.method === "DELETE") {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({
              message: "SQLSTATE[42S22]: Unknown column custom_label",
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ item: createEditableItemResponse() }),
        });
      }),
    );

    const { default: EditItemPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditItemPage, {
          params: Promise.resolve({ id: "1" }),
        }),
      );
      await waitForEffects();
    });
    await waitForEffects();

    const deleteButtons = Array.from(
      container.querySelectorAll("button"),
    ).filter((button) => button.textContent?.includes("削除"));
    const deleteButton = deleteButtons.at(-1);
    expect(deleteButton).not.toBeUndefined();

    await act(async () => {
      deleteButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("画像の削除に失敗しました");
    expect(container.textContent).not.toContain("SQLSTATE");
  });
});

it("メインカラーの custom_label を初期表示し、更新 payload に含める", async () => {
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
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url === "/api/items/1" && (!init || init.method === undefined)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          item: createEditableItemResponse({
            colors: [
              {
                role: "main",
                mode: "preset",
                value: "blue",
                hex: "#3B82F6",
                label: "ブルー",
                custom_label: "64 BLUE",
              },
            ],
          }),
        }),
      });
    }

    if (url === "/api/items/1" && init?.method === "PUT") {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ item: createEditableItemResponse() }),
      });
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ item: createEditableItemResponse() }),
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  const { default: EditItemPage } = await import("./page");
  const localContainer = document.createElement("div");
  document.body.appendChild(localContainer);
  const localRoot = createRoot(localContainer);

  await act(async () => {
    localRoot.render(
      React.createElement(EditItemPage, {
        params: Promise.resolve({ id: "1" }),
      }),
    );
    await waitForEffects();
  });

  const colorNameInput = localContainer.querySelector<HTMLInputElement>(
    "#main_color_custom_label",
  );
  const form = localContainer.querySelector("form");

  expect(colorNameInput?.value).toBe("64 BLUE");
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

  const putCall = fetchMock.mock.calls.find(
    ([input, init]) =>
      String(input) === "/api/items/1" && init?.method === "PUT",
  );
  const payload = JSON.parse(putCall?.[1]?.body as string);

  expect(payload.colors[0].custom_label).toBe("12 GRAY");

  await act(async () => {
    localRoot.unmount();
  });
  localContainer.remove();
});

it("編集画面でも hoodie の固定実寸があると最初から展開して復元する", async () => {
  vi.clearAllMocks();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

  const localContainer = document.createElement("div");
  document.body.appendChild(localContainer);
  const localRoot = createRoot(localContainer);

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
  fetchUserPreferencesMock.mockResolvedValue({ preferences: {} });
  fetchUserBrandsMock.mockResolvedValue({ brands: [] });
  fetchUserTposMock.mockResolvedValue({ tpos: [] });

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        item: createEditableItemResponse({
          category: "tops",
          subcategory: "hoodie",
          shape: "hoodie",
          size_details: {
            structured: {
              shoulder_width: 48,
              body_length: 66,
            },
          },
        }),
      }),
    }),
  );

  const { default: EditItemPage } = await import("./page");

  await act(async () => {
    localRoot.render(
      React.createElement(EditItemPage, {
        params: Promise.resolve({ id: "1" }),
      }),
    );
    await waitForEffects();
  });

  expect(
    (localContainer.querySelector("#subcategory") as HTMLSelectElement | null)
      ?.value,
  ).toBe("hoodie");
  expect(localContainer.querySelector("#shape")).toBeNull();

  const hoodieSizeToggle = localContainer.querySelector<HTMLButtonElement>(
    'button[aria-expanded="false"]',
  );
  if (hoodieSizeToggle) {
    await act(async () => {
      hoodieSizeToggle.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await waitForEffects();
    });
  }

  expect(
    (
      localContainer.querySelector(
        "#structured-size-shoulder_width",
      ) as HTMLInputElement | null
    )?.value,
  ).toBe("48");
  expect(
    (
      localContainer.querySelector(
        "#structured-size-body_length",
      ) as HTMLInputElement | null
    )?.value,
  ).toBe("66");

  localRoot.unmount();
  localContainer.remove();
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});

it("編集画面で bags の固定実寸を復元できる", async () => {
  vi.clearAllMocks();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

  const localContainer = document.createElement("div");
  document.body.appendChild(localContainer);
  const localRoot = createRoot(localContainer);

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
  fetchUserPreferencesMock.mockResolvedValue({ preferences: {} });
  fetchUserBrandsMock.mockResolvedValue({ brands: [] });
  fetchUserTposMock.mockResolvedValue({ tpos: [] });

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        item: createEditableItemResponse({
          category: "bags",
          subcategory: "tote",
          shape: "tote",
          size_details: {
            structured: {
              height: 21,
              width: 28.5,
              depth: 12,
            },
          },
        }),
      }),
    }),
  );

  const { default: EditItemPage } = await import("./page");

  await act(async () => {
    localRoot.render(
      React.createElement(EditItemPage, {
        params: Promise.resolve({ id: "2" }),
      }),
    );
    await waitForEffects();
  });
  await act(async () => {
    await waitForEffects();
  });
  await act(async () => {
    await waitForEffects();
  });

  const localCategorySelect =
    localContainer.querySelector<HTMLSelectElement>("#category");
  expect(localCategorySelect).not.toBeNull();
  expect(localCategorySelect?.value).toBe("bags");
  expect(
    (localContainer.querySelector("#subcategory") as HTMLSelectElement | null)
      ?.value,
  ).toBe("tote");
  expect(localContainer.querySelector("#shape")).toBeNull();
  expect(localContainer.textContent).toContain("高さ（H）");
  expect(localContainer.textContent).toContain("幅（W）");
  expect(localContainer.textContent).toContain("マチ（D）");

  const bagSizeToggle = localContainer.querySelector<HTMLButtonElement>(
    'button[aria-expanded="false"]',
  );
  if (bagSizeToggle) {
    await act(async () => {
      bagSizeToggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });
  }

  expect(
    (
      localContainer.querySelector(
        "#structured-size-height",
      ) as HTMLInputElement | null
    )?.value,
  ).toBe("21");
  expect(
    (
      localContainer.querySelector(
        "#structured-size-width",
      ) as HTMLInputElement | null
    )?.value,
  ).toBe("28.5");
  expect(
    (
      localContainer.querySelector(
        "#structured-size-depth",
      ) as HTMLInputElement | null
    )?.value,
  ).toBe("12");

  localRoot.unmount();
  localContainer.remove();
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});

function setNativeInputValue(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  value: string,
) {
  const prototype = Object.getPrototypeOf(element) as {
    constructor: {
      prototype: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    };
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    prototype.constructor.prototype,
    "value",
  );
  descriptor?.set?.call(element, value);
}

it("編集フォームでも select と input と date 入力の高さを揃える", async () => {
  vi.clearAllMocks();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
  const localContainer = document.createElement("div");
  document.body.appendChild(localContainer);
  const localRoot = createRoot(localContainer);

  fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
  fetchCategoryVisibilitySettingsMock.mockResolvedValue({
    visibleCategoryIds: [
      "tops_tshirt_cutsew",
      "outerwear_jacket",
      "pants_pants",
      "onepiece_dress_onepiece",
      "allinone_allinone",
      "roomwear_inner_roomwear",
      "underwear_other",
      "legwear_socks",
      "shoes_sneakers",
      "bags_tote",
      "fashion_accessories_belt",
      "fashion_accessories_eyewear",
      "swimwear_swimwear",
      "kimono_kimono",
    ],
  });
  fetchUserPreferencesMock.mockResolvedValue({ preferences: {} });
  fetchUserBrandsMock.mockResolvedValue({ brands: [] });
  fetchUserTposMock.mockResolvedValue({ tpos: [] });

  const localFetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      item: createEditableItemResponse(),
    }),
  });

  vi.stubGlobal("fetch", localFetchMock);

  const { default: EditItemPage } = await import("./page");

  await act(async () => {
    localRoot.render(
      React.createElement(EditItemPage, {
        params: Promise.resolve({ id: "1" }),
      }),
    );
    await waitForEffects();
  });
  await act(async () => {
    await waitForEffects();
  });
  await act(async () => {
    await waitForEffects();
  });

  const categorySelect =
    localContainer.querySelector<HTMLSelectElement>("#category") ??
    localContainer.querySelector<HTMLSelectElement>("select");
  const sizeLabelInput =
    localContainer.querySelector<HTMLInputElement>("#size-label") ??
    localContainer.querySelector<HTMLInputElement>('input[type="text"]');
  const purchasedAtInput =
    localContainer.querySelector<HTMLInputElement>("#purchased-at");
  const priceInput = localContainer.querySelector<HTMLInputElement>("#price");

  expect(categorySelect).not.toBeNull();
  expect(sizeLabelInput).not.toBeNull();
  expect(purchasedAtInput).not.toBeNull();
  expect(priceInput).not.toBeNull();
  expect(categorySelect?.className).toContain("h-[50px]");
  expect(sizeLabelInput?.className).toContain("h-[50px]");
  expect(purchasedAtInput?.className).toContain("h-[50px]");
  expect(priceInput?.className).toContain("h-full");
  expect(priceInput?.parentElement?.className).toContain("h-[50px]");

  localRoot.unmount();
  localContainer.remove();
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});
