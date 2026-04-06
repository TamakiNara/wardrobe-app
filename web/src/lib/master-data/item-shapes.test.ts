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
    ).toEqual(["coat", "trench", "chester", "stainless"]);
    expect(
      getItemShapeOptions("outerwear", "jacket").map((item) => item.value),
    ).toEqual(["jacket", "tailored", "no_collar"]);
  });

  it("skirts の代表カテゴリでは shape 候補を厚めに絞り込む", () => {
    expect(
      getItemShapeOptions("skirts", "skirt").map((item) => item.value),
    ).toEqual(["tight", "flare", "a_line", "pleated"]);
  });

  it("onepiece_dress は種類に応じて shape 候補を最小限に絞り込む", () => {
    expect(
      getItemShapeOptions("onepiece_dress", "onepiece").map(
        (item) => item.value,
      ),
    ).toEqual(["onepiece"]);
    expect(
      getItemShapeOptions("onepiece_dress", "dress").map((item) => item.value),
    ).toEqual(["dress"]);
    expect(
      getItemShapeOptions("onepiece_dress", "other").map((item) => item.value),
    ).toEqual(["other"]);
  });

  it("allinone は種類に応じて shape 候補を最小限に絞り込む", () => {
    expect(
      getItemShapeOptions("allinone", "allinone").map((item) => item.value),
    ).toEqual(["allinone"]);
    expect(
      getItemShapeOptions("allinone", "salopette").map((item) => item.value),
    ).toEqual(["salopette"]);
    expect(
      getItemShapeOptions("allinone", "other").map((item) => item.value),
    ).toEqual(["other"]);
  });

  it("bags の代表カテゴリでは shape 候補を中くらいの厚さに絞り込む", () => {
    expect(
      getItemShapeOptions("bags", "bag").map((item) => item.value),
    ).toEqual(["tote", "shoulder", "backpack", "hand", "clutch", "body"]);
    expect(
      getItemShapeOptions("bags", "other").map((item) => item.value),
    ).toEqual([
      "bag",
      "tote",
      "shoulder",
      "backpack",
      "hand",
      "clutch",
      "body",
    ]);
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
