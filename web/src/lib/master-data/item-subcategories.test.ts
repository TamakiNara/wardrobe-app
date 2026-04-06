import { describe, expect, it } from "vitest";
import {
  resolveItemSubcategoryForForm,
  shouldShowItemSubcategoryField,
} from "@/lib/master-data/item-subcategories";

describe("item subcategory helpers", () => {
  it("skirts と bags では通常入力で種類を表示しない", () => {
    expect(shouldShowItemSubcategoryField("skirts")).toBe(false);
    expect(shouldShowItemSubcategoryField("bags")).toBe(false);
    expect(shouldShowItemSubcategoryField("tops")).toBe(true);
  });

  it("通常入力で種類を出さないカテゴリは代表サブカテゴリを補完する", () => {
    expect(resolveItemSubcategoryForForm("skirts", null)).toBe("skirt");
    expect(resolveItemSubcategoryForForm("bags", null)).toBe("bag");
  });

  it("既存データの other は hidden UI でも内部値として保持する", () => {
    expect(resolveItemSubcategoryForForm("bags", "other")).toBe("other");
  });
});
