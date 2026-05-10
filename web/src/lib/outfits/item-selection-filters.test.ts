import { describe, expect, it } from "vitest";
import {
  buildOutfitItemSubcategoryOptions,
  buildOutfitItemTpoOptions,
  filterOutfitCandidateItems,
} from "./item-selection-filters";
import type { ItemRecord } from "@/types/items";

const sampleItems: ItemRecord[] = [
  {
    id: 1,
    name: "白Tシャツ",
    status: "active",
    brand_name: "UNIQLO",
    memo: "白の半袖",
    category: "tops",
    subcategory: "tshirt_cutsew",
    shape: "tshirt",
    colors: [],
    seasons: ["夏"],
    tpos: ["休日"],
  },
  {
    id: 2,
    name: "青シャツ",
    status: "active",
    brand_name: "GU",
    memo: "オフィス用",
    category: "tops",
    subcategory: "shirt_blouse",
    shape: "shirt",
    colors: [],
    seasons: ["春"],
    tpos: ["通勤"],
  },
  {
    id: 3,
    name: "黒パンツ",
    status: "active",
    brand_name: "UNIQLO",
    memo: "きれいめパンツ",
    category: "pants",
    subcategory: "pants",
    shape: "pants",
    colors: [],
    seasons: ["春"],
    tpos: ["通勤"],
  },
  {
    id: 4,
    name: "薄手カーディガン",
    status: "active",
    brand_name: "GLOBAL",
    memo: "温度調整向け",
    category: "tops",
    subcategory: "cardigan",
    shape: "cardigan",
    colors: [],
    seasons: ["オール"],
    tpos: ["通勤"],
  },
];

describe("コーディネート用アイテム絞り込み", () => {
  it("keyword で該当 item を絞り込める", () => {
    const items = filterOutfitCandidateItems(sampleItems, {
      keyword: "青シャツ",
      brand: "",
      category: "",
      subcategory: "",
      season: "",
      tpo: "",
    });

    expect(items.map((item) => item.id)).toEqual([2]);
  });

  it("brand で該当 item を絞り込める", () => {
    const items = filterOutfitCandidateItems(sampleItems, {
      keyword: "",
      brand: "uniqlo",
      category: "",
      subcategory: "",
      season: "",
      tpo: "",
    });

    expect(items.map((item) => item.id)).toEqual([1, 3]);
  });

  it("カテゴリとサブカテゴリで該当 item を絞り込める", () => {
    const items = filterOutfitCandidateItems(sampleItems, {
      keyword: "",
      brand: "",
      category: "tops",
      subcategory: "shirt_blouse",
      season: "",
      tpo: "",
    });

    expect(items.map((item) => item.id)).toEqual([2]);
  });

  it("季節で該当 item を絞り込める", () => {
    const items = filterOutfitCandidateItems(sampleItems, {
      keyword: "",
      brand: "",
      category: "",
      subcategory: "",
      season: "夏",
      tpo: "",
    });

    expect(items.map((item) => item.id)).toEqual([1, 4]);
  });

  it("季節未指定のオールシーズン item も季節絞り込みに含める", () => {
    const items = filterOutfitCandidateItems(sampleItems, {
      keyword: "",
      brand: "",
      category: "",
      subcategory: "",
      season: "春",
      tpo: "",
    });

    expect(items.map((item) => item.id)).toEqual([2, 3, 4]);
  });

  it("TPO で該当 item を絞り込める", () => {
    const items = filterOutfitCandidateItems(sampleItems, {
      keyword: "",
      brand: "",
      category: "",
      subcategory: "",
      season: "",
      tpo: "通勤",
    });

    expect(items.map((item) => item.id)).toEqual([2, 3, 4]);
  });

  it("tpos が null の item があっても TPO options を組み立てられる", () => {
    const items = [
      ...sampleItems,
      {
        id: 5,
        name: "確認用アイテム",
        status: "active",
        brand_name: null,
        memo: null,
        category: "tops",
        subcategory: "tshirt_cutsew",
        shape: "tshirt",
        colors: [],
        seasons: [],
        tpos: null as unknown as string[],
      },
    ];

    expect(buildOutfitItemTpoOptions(items)).toEqual(["休日", "通勤"]);
  });

  it("tpos が null の item があっても TPO 絞り込みで落ちない", () => {
    const items = [
      ...sampleItems,
      {
        id: 5,
        name: "確認用アイテム",
        status: "active",
        brand_name: null,
        memo: null,
        category: "tops",
        subcategory: "tshirt_cutsew",
        shape: "tshirt",
        colors: [],
        seasons: null as unknown as string[],
        tpos: null as unknown as string[],
      },
    ];

    const filtered = filterOutfitCandidateItems(items, {
      keyword: "",
      brand: "",
      category: "",
      subcategory: "",
      season: "",
      tpo: "通勤",
    });

    expect(filtered.map((item) => item.id)).toEqual([2, 3, 4]);
  });

  it("カテゴリ選択後にサブカテゴリ候補が並ぶ", () => {
    const options = buildOutfitItemSubcategoryOptions("tops");

    expect(options.map((option) => option.value)).toContain("tshirt_cutsew");
    expect(options.map((option) => option.value)).toContain("shirt_blouse");
    expect(options.at(-1)?.value).toBe("other");
  });
});
