import { describe, expect, it } from "vitest";
import {
  resolveCurrentItemCategoryValue,
  resolveCurrentItemSubcategoryValue,
  resolveCurrentItemShapeValue,
  resolveDefaultShapeForSubcategory,
  resolveVisibleCategoryIdForItem,
} from "@/lib/items/current-item-read-model";

describe("current item read model", () => {
  it("current / legacy category を現在の item category に寄せて読める", () => {
    expect(resolveCurrentItemCategoryValue("bottoms", "wide")).toBe("pants");
    expect(resolveCurrentItemCategoryValue("bottoms", "flare-skirt")).toBe(
      "skirts",
    );
    expect(resolveCurrentItemCategoryValue("outer", "trench")).toBe(
      "outerwear",
    );
    expect(resolveCurrentItemCategoryValue("accessories", "tote")).toBe("bags");
    expect(resolveCurrentItemCategoryValue("accessories", "hat")).toBe(
      "fashion_accessories",
    );
  });

  it("legacy shape を現在の item shape に寄せて読める", () => {
    expect(resolveCurrentItemShapeValue("bottoms", "flare-skirt")).toBe(
      "flare",
    );
    expect(resolveCurrentItemShapeValue("skirts", "mermaid")).toBe("mermaid");
    expect(resolveCurrentItemShapeValue("skirts", "pleated")).toBe("pleated");
    expect(resolveCurrentItemShapeValue("pants", "slacks")).toBe("pants");
    expect(resolveCurrentItemShapeValue("outer", "down")).toBe("down-padded");
    expect(resolveCurrentItemShapeValue("shoes", "short-boots")).toBe(
      "short-boots",
    );
    expect(resolveCurrentItemShapeValue("shoes", "leather-shoes")).toBe(
      "leather-shoes",
    );
    expect(resolveCurrentItemShapeValue("shoes", "rain-shoes-boots")).toBe(
      "rain-shoes-boots",
    );
  });

  it("current / legacy 値から現在の subcategory を読める", () => {
    expect(
      resolveCurrentItemSubcategoryValue("inner", "roomwear", "underwear"),
    ).toBe("underwear");
    expect(resolveCurrentItemSubcategoryValue("bags", "tote", null)).toBe(
      "tote",
    );
    expect(
      resolveCurrentItemSubcategoryValue("shoes", "leather-shoes", null),
    ).toBe("leather_shoes");
    expect(
      resolveCurrentItemSubcategoryValue("shoes", "rain-shoes-boots", null),
    ).toBe("rain_shoes_boots");
    expect(
      resolveCurrentItemSubcategoryValue("fashion_accessories", "belt", null),
    ).toBe("belt");
    expect(resolveCurrentItemSubcategoryValue("tops", "polo", null)).toBe(
      "polo_shirt",
    );
    expect(resolveCurrentItemSubcategoryValue("tops", "", "other")).toBe(
      "other",
    );
    expect(resolveCurrentItemSubcategoryValue("legwear", "socks", null)).toBe(
      "socks",
    );
    expect(
      resolveCurrentItemSubcategoryValue("legwear", "leggings", null),
    ).toBe("leggings");
    expect(resolveCurrentItemSubcategoryValue("skirts", "mermaid", null)).toBe(
      "skirt",
    );
    expect(
      resolveCurrentItemSubcategoryValue("skirts", "pleated", null),
    ).toBeNull();
  });

  it("swimwear の current 値を自然に解釈できる", () => {
    expect(
      resolveCurrentItemSubcategoryValue("swimwear", "rashguard", null),
    ).toBe("rashguard");
    expect(resolveVisibleCategoryIdForItem("swimwear", "rashguard", null)).toBe(
      "swimwear_rashguard",
    );
  });

  it("bags の current 値を自然に解釈できる", () => {
    expect(resolveCurrentItemSubcategoryValue("bags", "rucksack", null)).toBe(
      "rucksack",
    );
    expect(resolveVisibleCategoryIdForItem("bags", "rucksack")).toBe(
      "bags_rucksack",
    );
    expect(resolveCurrentItemSubcategoryValue("bags", "boston", null)).toBe(
      "boston",
    );
    expect(resolveVisibleCategoryIdForItem("bags", "boston")).toBe(
      "bags_boston",
    );
  });

  it("subcategory から default shape を読める", () => {
    expect(resolveDefaultShapeForSubcategory("inner", "other")).toBe(
      "roomwear",
    );
    expect(resolveDefaultShapeForSubcategory("shoes", "boots")).toBe(
      "short-boots",
    );
    expect(resolveDefaultShapeForSubcategory("tops", "hoodie")).toBe("hoodie");
    expect(resolveDefaultShapeForSubcategory("tops", "other")).toBeNull();
  });

  it("current / legacy item から visible category id を読める", () => {
    expect(
      resolveVisibleCategoryIdForItem("inner", "roomwear", "underwear"),
    ).toBe("roomwear_inner_underwear");
    expect(resolveVisibleCategoryIdForItem("bags", "tote")).toBe("bags_tote");
    expect(resolveVisibleCategoryIdForItem("shoes", "leather-shoes")).toBe(
      "shoes_leather_shoes",
    );
    expect(resolveVisibleCategoryIdForItem("shoes", "rain-shoes-boots")).toBe(
      "shoes_rain_shoes_boots",
    );
    expect(resolveVisibleCategoryIdForItem("accessories", "hat")).toBe(
      "fashion_accessories_hat",
    );
    expect(resolveVisibleCategoryIdForItem("tops", "vest")).toBe(
      "tops_vest_gilet",
    );
    expect(resolveVisibleCategoryIdForItem("tops", "", "other")).toBe(
      "tops_other",
    );
    expect(resolveVisibleCategoryIdForItem("legwear", "socks")).toBe(
      "legwear_socks",
    );
    expect(resolveVisibleCategoryIdForItem("legwear", "leggings")).toBe(
      "legwear_leggings",
    );
    expect(resolveVisibleCategoryIdForItem("pants", "", "other")).toBe(
      "pants_other",
    );
    expect(resolveVisibleCategoryIdForItem("skirts", "", "other")).toBe(
      "skirts_other",
    );
    expect(resolveVisibleCategoryIdForItem("skirts", "mermaid")).toBe(
      "skirts_skirt",
    );
    expect(resolveVisibleCategoryIdForItem("skirts", "pleated")).toBeNull();
    expect(resolveVisibleCategoryIdForItem("outerwear", "", "other")).toBe(
      "outerwear_other",
    );
  });
});
