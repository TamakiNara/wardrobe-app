import { describe, expect, it } from "vitest";
import {
  resolveCurrentItemCategoryValue,
  resolveCurrentItemShapeValue,
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
    expect(resolveCurrentItemShapeValue("pants", "slacks")).toBe("pants");
    expect(resolveCurrentItemShapeValue("outer", "down")).toBe("down-padded");
    expect(resolveCurrentItemShapeValue("shoes", "short-boots")).toBe(
      "short-boots",
    );
  });
});
