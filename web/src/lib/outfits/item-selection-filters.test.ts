import { describe, expect, it } from "vitest";
import {
  buildOutfitItemSubcategoryOptions,
  filterOutfitCandidateItems,
} from "./item-selection-filters";
import type { ItemRecord } from "@/types/items";

const sampleItems: ItemRecord[] = [
  {
    id: 1,
    name: "白T",
    status: "active",
    brand_name: "UNIQLO",
    memo: "白いTシャツ",
    category: "tops",
    subcategory: "tshirt_cutsew",
    shape: "tshirt",
    colors: [],
    seasons: ["夏"],
    tpos: ["休日"],
  },
  {
    id: 2,
    name: "通勤シャツ",
    status: "active",
    brand_name: "GU",
    memo: "オフィス用",
    category: "tops",
    subcategory: "shirt_blouse",
    shape: "shirt",
    colors: [],
    seasons: ["春"],
    tpos: ["仕事"],
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
    tpos: ["仕事"],
  },
  {
    id: 4,
    name: "通年カーディガン",
    status: "active",
    brand_name: "GLOBAL",
    memo: "通年向け",
    category: "tops",
    subcategory: "cardigan",
    shape: "cardigan",
    colors: [],
    seasons: ["オール"],
    tpos: ["仕事"],
  },
];

describe("コーディネート用アイテム候補の絞り込み", () => {
  it("キーワードで候補 item を絞れる", () => {
    const items = filterOutfitCandidateItems(sampleItems, {
      keyword: "通勤",
      brand: "",
      category: "",
      subcategory: "",
      season: "",
      tpo: "",
    });

    expect(items.map((item) => item.id)).toEqual([2]);
  });

  it("ブランドで候補 item を絞れる", () => {
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

  it("カテゴリと種類で候補 item を絞れる", () => {
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

  it("季節で候補 item を絞れる", () => {
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

  it("季節絞り込みでもオールの item は候補に含める", () => {
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

  it("TPOで候補 item を絞れる", () => {
    const items = filterOutfitCandidateItems(sampleItems, {
      keyword: "",
      brand: "",
      category: "",
      subcategory: "",
      season: "",
      tpo: "仕事",
    });

    expect(items.map((item) => item.id)).toEqual([2, 3, 4]);
  });

  it("カテゴリ選択後に種類候補が変わる", () => {
    const options = buildOutfitItemSubcategoryOptions("tops");

    expect(options.map((option) => option.value)).toContain("tshirt_cutsew");
    expect(options.map((option) => option.value)).toContain("shirt_blouse");
    expect(options.at(-1)?.value).toBe("other");
  });
});
