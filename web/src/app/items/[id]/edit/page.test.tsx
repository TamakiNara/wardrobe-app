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

describe("編集画面", () => {
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
    expect(container.textContent).toContain("形");
    expect(container.textContent).toContain("分類");
    expect(container.textContent).toContain("色とプレビュー");
    expect(container.textContent).toContain("利用条件・状態");
    expect(container.textContent).toContain("サイズ");
    expect(container.textContent).toContain("購入・補足");
    expect(container.textContent).toContain("ケア状態");
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
    expect(container.textContent).toContain("クリックして画像を選択");
    expect(container.textContent).toContain("代表画像");
    expect(container.textContent).toContain("削除");
    expect(container.textContent).not.toContain("現在登録されている画像の確認");
    expect(
      (container.querySelector("#care-status") as HTMLSelectElement | null)
        ?.value,
    ).toBe("in_cleaning");
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
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategorySelect?.value).toBe("underwear");
    expect(shapeSelect?.value).toBe("underwear");

    await act(async () => {
      subcategorySelect!.value = "other";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(shapeSelect?.value).toBe("roomwear");
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
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(shapeSelect).not.toBeNull();

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
            shape: "a_line",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {
              skirt: {
                length_type: "mid_calf",
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
    const skirtRadio =
      container.querySelector<HTMLInputElement>("#subcategory-skirt");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    const lengthTypeSelect = container.querySelector<HTMLSelectElement>(
      "#bottoms-length-type",
    );

    expect(categorySelect?.value).toBe("skirts");
    expect(skirtRadio?.checked).toBe(true);
    expect(shapeSelect?.value).toBe("a_line");
    expect(lengthTypeSelect?.value).toBe("mid_calf");
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
    const skirtRadio =
      container.querySelector<HTMLInputElement>("#subcategory-skirt");
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    const lengthTypeSelect = container.querySelector<HTMLSelectElement>(
      "#bottoms-length-type",
    );

    expect(categorySelect?.value).toBe("skirts");
    expect(skirtRadio?.checked).toBe(true);
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
    const initialShapeSelect =
      container.querySelector<HTMLSelectElement>("#shape");
    expect(categorySelect).not.toBeNull();
    expect(subcategorySelect).not.toBeNull();
    expect(initialShapeSelect).not.toBeNull();

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
    ).toEqual(["", "jacket", "tailored", "no_collar"]);
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
    let shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(categorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

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
    let shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(categorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

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
    expect(shapeSelect).not.toBeNull();
    expect(shapeSelect!.value).toBe("tshirt");
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
    expect(shapeSelect).not.toBeNull();
    expect(shapeSelect!.value).toBe("polo");
    expect(container.querySelector("#tops-neck")).toBeNull();
    expect(container.querySelector("#tops-design")).toBeNull();

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

  it("編集画面でも swimwear は種類ラジオを表示し、shape を表示しない", async () => {
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

    const subcategoryRadios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="subcategory"]'),
    );

    expect(subcategoryRadios.map((radio) => radio.value)).toEqual([
      "swimwear",
      "rashguard",
      "other",
    ]);
    expect(subcategoryRadios[0]?.checked).toBe(true);
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategoryRadios[1]!.click();
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

    const subcategoryRadios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="subcategory"]'),
    );

    expect(
      subcategoryRadios.find((radio) => radio.value === "rashguard")?.checked,
    ).toBe(true);
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

    const subcategoryRadios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="subcategory"]'),
    );
    expect(
      subcategoryRadios.find((radio) => radio.value === "leather_shoes")
        ?.checked,
    ).toBe(true);
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

    const subcategoryRadios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="subcategory"]'),
    );
    expect(
      subcategoryRadios.find((radio) => radio.value === "rain_shoes_boots")
        ?.checked,
    ).toBe(true);
    expect(container.querySelector("#shape")).toBeNull();
  });
  it("編集画面でも shoes は種類ラジオに応じて shape を自動設定できる", async () => {
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
    expect(container.querySelector("#shape")).toBeNull();

    await act(async () => {
      subcategoryRadios[2]!.click();
      await waitForEffects();
    });

    expect(container.querySelector("#shape")).toBeNull();
  });
});
