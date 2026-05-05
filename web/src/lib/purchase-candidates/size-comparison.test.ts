import { describe, expect, it } from "vitest";
import type { ItemRecord } from "@/types/items";
import type { PurchaseCandidateRecord } from "@/types/purchase-candidates";
import {
  buildPurchaseCandidateMultiSizeComparisonRows,
  getPurchaseCandidateComparisonOptions,
  getPurchaseCandidateSizeOptions,
  hasStructuredSizeComparisonBase,
} from "./size-comparison";

function createItem(overrides: Partial<ItemRecord> = {}): ItemRecord {
  return {
    id: 1,
    name: "比較用アイテム",
    status: "active",
    category: "skirts",
    subcategory: "skirt",
    shape: "narrow",
    size_label: "M",
    size_details: {
      structured: {
        waist: { value: 64 },
        hip: { value: 103 },
        skirt_length: { value: 83.5 },
      },
    },
    colors: [],
    seasons: [],
    tpos: [],
    ...overrides,
  };
}

function createCandidate(
  overrides: Partial<PurchaseCandidateRecord> = {},
): PurchaseCandidateRecord {
  return {
    id: 10,
    status: "considering",
    priority: "medium",
    name: "購入検討アイテム",
    category_id: "skirts_skirt",
    shape: "narrow",
    category_name: "スカート",
    brand_name: null,
    price: null,
    release_date: null,
    sale_price: null,
    sale_ends_at: null,
    discount_ends_at: null,
    purchase_url: null,
    memo: null,
    wanted_reason: null,
    size_gender: null,
    size_label: "M",
    size_note: null,
    size_details: {
      structured: {
        waist: { value: 66 },
        hip: { value: 107 },
        skirt_length: { value: 84.5 },
      },
    },
    alternate_size_label: null,
    alternate_size_note: null,
    alternate_size_details: null,
    spec: null,
    is_rain_ok: false,
    sheerness: null,
    group_id: null,
    group_order: null,
    group_candidates: [],
    converted_item_id: null,
    converted_at: null,
    colors: [],
    seasons: [],
    tpos: [],
    materials: [],
    images: [],
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe("size-comparison", () => {
  it("購入検討のサイズ候補を primary / alternate で返す", () => {
    const candidate = createCandidate({
      size_label: "M",
      alternate_size_label: "L",
      alternate_size_note: "ゆったり候補",
      alternate_size_details: {
        structured: {
          waist: { value: 70 },
        },
      },
    });

    expect(getPurchaseCandidateSizeOptions(candidate)).toEqual([
      expect.objectContaining({
        key: "primary",
        label: "M",
        optionLabel: "サイズ候補1（M）",
      }),
      expect.objectContaining({
        key: "alternate",
        label: "L",
        note: "ゆったり候補",
        optionLabel: "サイズ候補2（L）",
      }),
    ]);
  });

  it("自由実寸だけある item も候補に含め、category / subcategory / shape 一致を優先する", () => {
    const candidate = {
      ...createCandidate(),
      resolvedCategory: "skirts",
      resolvedSubcategory: "skirt",
      resolvedShape: "narrow",
    };
    const options = getPurchaseCandidateComparisonOptions(candidate, [
      createItem({
        id: 3,
        name: "同一subcategory・同一shape",
      }),
      createItem({
        id: 2,
        name: "同一subcategory・別shape",
        shape: "flare",
      }),
      createItem({
        id: 4,
        name: "自由実寸のみ",
        size_details: {
          custom_fields: [{ label: "裾スリット", value: 24, sort_order: 1 }],
        },
      }),
      createItem({
        id: 5,
        name: "別subcategory",
        subcategory: "other",
        shape: "",
      }),
      createItem({
        id: 6,
        name: "inactive",
        status: "archived",
      }),
      createItem({
        id: 7,
        name: "別カテゴリ",
        category: "tops",
        subcategory: "tshirt_cutsew",
        shape: "tshirt",
      }),
    ]);

    expect(options.map((option) => option.item.id)).toEqual([4, 3, 2, 5, 7]);
  });

  it("複数サイズ候補ぶんの比較行をまとめて組み立てる", () => {
    const candidate = createCandidate({
      size_details: {
        structured: {
          waist: { value: 66 },
          hip: { value: 107 },
          skirt_length: { value: 84.5 },
        },
        custom_fields: [
          { label: "裾スリット", value: 26, note: "後ろ約", sort_order: 1 },
        ],
      },
      alternate_size_label: "L",
      alternate_size_details: {
        structured: {
          waist: { value: 68 },
        },
      },
    });

    const rows = buildPurchaseCandidateMultiSizeComparisonRows(
      getPurchaseCandidateSizeOptions(candidate),
      {
        category: "skirts",
        shape: "narrow",
      },
      createItem({
        size_details: {
          structured: {
            waist: { value: 64 },
          },
          custom_fields: [{ label: "裾スリット", value: 24, sort_order: 1 }],
        },
      }),
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        key: "waist",
        label: "ウエスト",
        candidateValues: expect.objectContaining({
          primary: "66cm",
          alternate: "68cm",
        }),
        itemValue: "64cm",
      }),
    );
    expect(rows.at(-1)).toEqual(
      expect.objectContaining({
        key: "custom:裾スリット",
        label: "裾スリット",
        candidateValues: expect.objectContaining({
          primary: "後ろ約 26cm",
          alternate: "未設定",
        }),
        itemValue: "24cm",
      }),
    );
  });

  it("underwear の bra 固定実寸もサイズ比較行に含める", () => {
    const candidate = createCandidate({
      category_id: "underwear_bra",
      category_name: "ブラ",
      shape: "bra",
      resolvedCategory: "underwear",
      resolvedSubcategory: "bra",
      resolvedShape: "bra",
      size_label: "C70",
      size_details: {
        structured: {
          underbust: { value: 68 },
          top_bust: { value: 83.5 },
        },
      },
    });

    const rows = buildPurchaseCandidateMultiSizeComparisonRows(
      getPurchaseCandidateSizeOptions(candidate),
      {
        category: "underwear",
        shape: "bra",
      },
      createItem({
        category: "underwear",
        subcategory: "bra",
        shape: "bra",
        size_label: "C70",
        size_details: {
          structured: {
            underbust: { value: 67 },
            top_bust: { value: 82 },
          },
        },
      }),
    );

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "underbust",
          label: "アンダーバスト",
          candidateValues: expect.objectContaining({
            primary: "68cm",
          }),
          itemValue: "67cm",
        }),
        expect.objectContaining({
          key: "top_bust",
          label: "トップバスト",
          candidateValues: expect.objectContaining({
            primary: "83.5cm",
          }),
          itemValue: "82cm",
        }),
      ]),
    );
  });

  it("どちらかのサイズ候補に実寸があれば比較可能とみなす", () => {
    expect(
      hasStructuredSizeComparisonBase(
        createCandidate({
          size_details: null,
          alternate_size_label: "L",
          alternate_size_details: {
            custom_fields: [{ label: "裄丈", value: 58, sort_order: 1 }],
          },
        }),
      ),
    ).toBe(true);
  });
});
