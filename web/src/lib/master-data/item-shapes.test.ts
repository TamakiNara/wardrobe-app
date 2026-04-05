import { describe, expect, it } from "vitest";
import { getTopsShapeOptions } from "@/lib/master-data/item-tops";
import { getItemShapeOptions } from "@/lib/master-data/item-shapes";

describe("getItemShapeOptions", () => {
  it("pants の種類に応じて候補を絞り込む", () => {
    expect(
      getItemShapeOptions("pants", "denim").map((item) => item.value),
    ).toEqual(["straight", "tapered", "wide", "culottes"]);
  });

  it("outerwear の種類に応じて候補を絞り込む", () => {
    expect(
      getItemShapeOptions("outerwear", "coat").map((item) => item.value),
    ).toEqual(["coat"]);
  });

  it("種類未設定の旧データでは category 単位の候補へ戻す", () => {
    expect(
      getItemShapeOptions("pants", null).map((item) => item.value),
    ).toEqual(["pants", "straight", "tapered", "wide", "culottes"]);
  });
});

describe("getTopsShapeOptions", () => {
  it("tops の種類に応じて候補を絞り込む", () => {
    expect(getTopsShapeOptions("hoodie").map((item) => item.value)).toEqual([
      "tshirt",
    ]);
    expect(
      getTopsShapeOptions("shirt_blouse").map((item) => item.value),
    ).toEqual(["shirt", "blouse"]);
  });
});
