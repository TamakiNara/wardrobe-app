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
      { id: "bags_backpack", groupId: "bags", name: "リュック", sortOrder: 30 },
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
      visibleCategoryIds: [
        "tops_tshirt_cutsew",
        "outerwear_jacket",
        "pants_pants",
        "onepiece_dress_onepiece",
        "allinone_allinone",
        "roomwear_inner_roomwear",
        "legwear_socks",
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
      "バッグ",
      "ファッション小物",
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
    expect(container.textContent).toContain("詳細属性");
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
            shape: "socks",
            colors: [],
            seasons: [],
            tpos: [],
            tpo_ids: [],
            spec: {
              legwear: {
                coverage_type: "crew_socks",
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
    ).toBe("crew_socks");
    expect(container.textContent).toContain("レッグウェア仕様");
    expect(container.textContent).toContain(
      "ソックスの長さを選択してください。",
    );
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
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(categorySelect).not.toBeNull();
    expect(subcategorySelect).not.toBeNull();
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
    ).toEqual(["", "straight", "tapered", "wide", "culottes"]);
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
    const shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(categorySelect).not.toBeNull();
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

    await act(async () => {
      categorySelect!.value = "outerwear";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

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
    shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

    expect(
      Array.from(subcategorySelect!.options).map((option) => option.value),
    ).toEqual([
      "",
      "tote",
      "shoulder",
      "backpack",
      "hand",
      "clutch",
      "body",
      "other",
    ]);
    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual([""]);

    await act(async () => {
      subcategorySelect!.value = "shoulder";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(shapeSelect!.value).toBe("shoulder");
    expect(shapeSelect!.disabled).toBe(true);
    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual(["", "shoulder"]);
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
    shapeSelect = container.querySelector<HTMLSelectElement>("#shape");
    expect(subcategorySelect).not.toBeNull();
    expect(shapeSelect).not.toBeNull();

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
    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual([""]);

    await act(async () => {
      subcategorySelect!.value = "watch";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(shapeSelect!.value).toBe("watch");
    expect(shapeSelect!.disabled).toBe(true);
    expect(
      Array.from(shapeSelect!.options).map((option) => option.value),
    ).toEqual(["", "watch"]);
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
});
