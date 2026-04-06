import { describe, expect, it } from "vitest";
import {
  resolveItemSubcategoryForForm,
  shouldShowItemSubcategoryField,
  shouldUseItemSubcategoryRadioField,
} from "@/lib/master-data/item-subcategories";

describe("item subcategory helpers", () => {
  it("skirts と bags では通常入力で種類を軽い UI で表示する", () => {
    expect(shouldShowItemSubcategoryField("skirts")).toBe(true);
    expect(shouldShowItemSubcategoryField("bags")).toBe(true);
    expect(shouldUseItemSubcategoryRadioField("skirts")).toBe(true);
    expect(shouldUseItemSubcategoryRadioField("bags")).toBe(true);
    expect(shouldShowItemSubcategoryField("tops")).toBe(true);
    expect(shouldUseItemSubcategoryRadioField("tops")).toBe(false);
  });

  it("通常入力の既定値として代表サブカテゴリを補完できる", () => {
    expect(resolveItemSubcategoryForForm("skirts", null)).toBe("skirt");
    expect(resolveItemSubcategoryForForm("bags", null)).toBe("bag");
  });

  it("既存データの other は UI 表示時も内部値として保持する", () => {
    expect(resolveItemSubcategoryForForm("bags", "other")).toBe("other");
  });
});
