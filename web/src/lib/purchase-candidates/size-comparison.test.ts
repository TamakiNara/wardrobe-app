import { describe, expect, it } from "vitest";
import type { ItemRecord, ItemSizeDetails } from "@/types/items";
import type { PurchaseCandidateRecord } from "@/types/purchase-candidates";
import {
  buildPurchaseCandidateSizeComparisonRows,
  getPurchaseCandidateComparisonOptions,
  hasStructuredSizeComparisonBase,
} from "@/lib/purchase-candidates/size-comparison";

function createSizeDetails(
  structured: NonNullable<ItemSizeDetails["structured"]>,
) {
  return { structured };
}

function createCustomOnlySizeDetails(
  customFields: NonNullable<ItemSizeDetails["custom_fields"]>,
) {
  return { custom_fields: customFields };
}

function createItem(overrides: Partial<ItemRecord>): ItemRecord {
  return {
    id: 1,
    name: "比較用アイテム",
    status: "active",
    category: "skirts",
    subcategory: "skirt",
    shape: "narrow",
    colors: [],
    seasons: [],
    tpos: [],
    ...overrides,
  };
}

function createCandidate(
  overrides: Partial<PurchaseCandidateRecord>,
): PurchaseCandidateRecord {
  return {
    id: 10,
    status: "considering",
    priority: "medium",
    name: "候補スカート",
    category_id: "skirts_skirt",
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
    size_label: null,
    size_note: null,
    size_details: null,
    spec: null,
    is_rain_ok: false,
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

describe("getPurchaseCandidateComparisonOptions", () => {
  it("同カテゴリで structured または自由実寸のある active item だけを候補にする", () => {
    const candidate = {
      ...createCandidate({}),
      resolvedCategory: "skirts",
      resolvedSubcategory: "skirt",
      resolvedShape: "narrow",
    };
    const options = getPurchaseCandidateComparisonOptions(candidate, [
      createItem({
        id: 1,
        category: "skirts",
        size_details: createSizeDetails({ waist: { value: 64 } }),
      }),
      createItem({
        id: 2,
        category: "tops",
        size_details: createSizeDetails({ body_width: { value: 48 } }),
      }),
      createItem({
        id: 3,
        category: "skirts",
        status: "disposed",
        size_details: createSizeDetails({ waist: { value: 65 } }),
      }),
      createItem({
        id: 4,
        category: "skirts",
        size_details: null,
      }),
      createItem({
        id: 5,
        category: "skirts",
        size_details: createCustomOnlySizeDetails([
          { label: "裾スリット", value: 12, sort_order: 1 },
        ]),
      }),
    ]);

    expect(options.map((option) => option.id)).toEqual([1, 5]);
  });

  it("subcategory 一致を優先し、その中で shape 一致を優先する", () => {
    const candidate = {
      ...createCandidate({}),
      resolvedCategory: "skirts",
      resolvedSubcategory: "skirt",
      resolvedShape: "narrow",
    };
    const options = getPurchaseCandidateComparisonOptions(candidate, [
      createItem({
        id: 3,
        name: "別種類",
        subcategory: "other",
        shape: "",
        size_details: createSizeDetails({ waist: { value: 64 } }),
      }),
      createItem({
        id: 1,
        name: "ナロー",
        shape: "narrow",
        size_details: createSizeDetails({ waist: { value: 65 } }),
      }),
      createItem({
        id: 2,
        name: "Aライン",
        shape: "a_line",
        size_details: createSizeDetails({ waist: { value: 64 } }),
      }),
    ]);

    expect(options.map((option) => option.id)).toEqual([1, 2, 3]);
  });
});

describe("buildPurchaseCandidateSizeComparisonRows", () => {
  it("固定実寸は購入検討と手持ちを横並びで表示する", () => {
    const candidate = {
      ...createCandidate({
        size_details: createSizeDetails({
          waist: { value: 66 },
          hip: { value: 103 },
          skirt_length: { value: 83.5 },
        }),
      }),
      resolvedCategory: "skirts",
      resolvedSubcategory: "skirt",
      resolvedShape: "narrow",
    };
    const item = createItem({
      size_details: createSizeDetails({
        waist: { value: 64 },
        hip: { value: 103 },
        skirt_length: { value: 84.5 },
      }),
    });

    const rows = buildPurchaseCandidateSizeComparisonRows(candidate, item);

    expect(rows.find((row) => row.key === "waist")).toMatchObject({
      candidateValue: "66cm",
      itemValue: "64cm",
    });
    expect(rows.find((row) => row.key === "hip")).toMatchObject({
      candidateValue: "103cm",
      itemValue: "103cm",
    });
  });

  it("自由実寸も含め、片方だけにある項目は未設定で表示する", () => {
    const candidate = {
      ...createCandidate({
        size_details: {
          structured: {
            waist: { min: 63, max: 67, note: "ヌード寸" },
            hip: { value: 91 },
          },
          custom_fields: [
            { label: "裾スリット", value: 26, note: "後ろ約", sort_order: 1 },
            { label: "ベント", value: 18, sort_order: 2 },
          ],
        },
      }),
      resolvedCategory: "skirts",
      resolvedSubcategory: "skirt",
      resolvedShape: "narrow",
    };
    const item = createItem({
      size_details: {
        structured: {
          waist: { value: 64 },
        },
        custom_fields: [
          { label: "裾スリット", value: 24, sort_order: 1 },
          { label: "ポケット口", value: 14, sort_order: 2 },
        ],
      },
    });

    const rows = buildPurchaseCandidateSizeComparisonRows(candidate, item);

    expect(rows.find((row) => row.key === "waist")).toMatchObject({
      candidateValue: "ヌード寸 63〜67cm",
      itemValue: "64cm",
    });
    expect(rows.find((row) => row.key === "hip")).toMatchObject({
      candidateValue: "91cm",
      itemValue: "未設定",
    });
    expect(rows.find((row) => row.key === "custom:裾スリット")).toMatchObject({
      candidateValue: "後ろ約 26cm",
      itemValue: "24cm",
    });
    expect(rows.find((row) => row.key === "custom:ベント")).toMatchObject({
      candidateValue: "18cm",
      itemValue: "未設定",
    });
    expect(rows.find((row) => row.key === "custom:ポケット口")).toMatchObject({
      candidateValue: "未設定",
      itemValue: "14cm",
    });
  });
});

describe("hasStructuredSizeComparisonBase", () => {
  it("structured 実寸があると true を返す", () => {
    expect(
      hasStructuredSizeComparisonBase(
        createCandidate({
          size_details: createSizeDetails({ waist: { value: 64 } }),
        }),
      ),
    ).toBe(true);
  });

  it("自由実寸だけでも true、未設定なら false を返す", () => {
    expect(
      hasStructuredSizeComparisonBase(
        createCandidate({
          size_details: createCustomOnlySizeDetails([
            { label: "裾スリット", value: 12, sort_order: 1 },
          ]),
        }),
      ),
    ).toBe(true);
    expect(hasStructuredSizeComparisonBase(createCandidate({}))).toBe(false);
  });
});
