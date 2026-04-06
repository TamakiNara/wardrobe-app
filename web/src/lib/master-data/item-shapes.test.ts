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
    expect(
      getItemShapeOptions("outerwear", "other").map((item) => item.value),
    ).toEqual([
      "jacket",
      "tailored",
      "no_collar",
      "blouson",
      "down-padded",
      "coat",
      "trench",
      "chester",
      "stainless",
      "mountain-parka",
    ]);
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
    ).toEqual([]);
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
    ).toEqual([]);
  });

  it("bags は種類に応じて shape 候補を最小限に絞り込む", () => {
    expect(
      getItemShapeOptions("bags", "tote").map((item) => item.value),
    ).toEqual(["tote"]);
    expect(
      getItemShapeOptions("bags", "hand").map((item) => item.value),
    ).toEqual(["hand"]);
    expect(
      getItemShapeOptions("bags", "other").map((item) => item.value),
    ).toEqual([]);
  });

  it("fashion_accessories は種類に応じて shape 候補を最小限に絞り込む", () => {
    expect(
      getItemShapeOptions("fashion_accessories", "belt").map(
        (item) => item.value,
      ),
    ).toEqual(["belt"]);
    expect(
      getItemShapeOptions("fashion_accessories", "wallet_case").map(
        (item) => item.value,
      ),
    ).toEqual(["wallet-case"]);
    expect(
      getItemShapeOptions("fashion_accessories", "other").map(
        (item) => item.value,
      ),
    ).toEqual([]);
    expect(
      getItemShapeOptions("fashion_accessories", null).map(
        (item) => item.value,
      ),
    ).toEqual([]);
  });

  it("shoes / legwear / kimono も種類に応じた候補で扱える", () => {
    expect(
      getItemShapeOptions("shoes", "sneakers").map((item) => item.value),
    ).toEqual(["sneakers"]);
    expect(
      getItemShapeOptions("shoes", "boots").map((item) => item.value),
    ).toEqual(["short-boots"]);
    expect(
      getItemShapeOptions("shoes", "other").map((item) => item.value),
    ).toEqual([]);
    expect(
      getItemShapeOptions("legwear", "socks").map((item) => item.value),
    ).toEqual(["socks"]);
    expect(
      getItemShapeOptions("legwear", "leggings").map((item) => item.value),
    ).toEqual(["leggings"]);
    expect(
      getItemShapeOptions("legwear", "other").map((item) => item.value),
    ).toEqual([]);
    expect(
      getItemShapeOptions("kimono", "kimono").map((item) => item.value),
    ).toEqual(["kimono"]);
    expect(
      getItemShapeOptions("kimono", "other").map((item) => item.value),
    ).toEqual([]);
  });

  it("種類未設定の旧データでは category 単位の候補へ戻す", () => {
    expect(
      getItemShapeOptions("pants", null).map((item) => item.value),
    ).toEqual(["pants", "straight", "tapered", "wide", "culottes"]);
    expect(getItemShapeOptions("bags", null).map((item) => item.value)).toEqual(
      [],
    );
    expect(
      getItemShapeOptions("shoes", null).map((item) => item.value),
    ).toEqual([]);
    expect(
      getItemShapeOptions("legwear", null).map((item) => item.value),
    ).toEqual([]);
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
