import { describe, expect, it } from "vitest";
import {
  buildItemShapeForSubmit,
  buildItemSpecForSubmit,
  isItemShapeRequired,
  resolveItemShapeForSubmit,
  shouldShowItemShapeField,
} from "@/lib/items/input-requirements";

describe("item input requirements", () => {
  it("候補が複数ある種類では形を必須にする", () => {
    expect(isItemShapeRequired("outerwear", "coat")).toBe(true);
    expect(isItemShapeRequired("pants", "denim")).toBe(true);
    expect(isItemShapeRequired("skirts", "skirt")).toBe(true);
    expect(isItemShapeRequired("tops", "shirt_blouse")).toBe(true);
  });

  it("候補が1件または other の種類では形を任意寄りにする", () => {
    expect(isItemShapeRequired("outerwear", "blouson")).toBe(false);
    expect(isItemShapeRequired("onepiece_dress", "dress")).toBe(false);
    expect(isItemShapeRequired("bags", "tote")).toBe(false);
    expect(isItemShapeRequired("bags", "other")).toBe(false);
    expect(isItemShapeRequired("bags", null)).toBe(false);
    expect(isItemShapeRequired("fashion_accessories", "belt")).toBe(false);
    expect(isItemShapeRequired("fashion_accessories", "other")).toBe(false);
    expect(isItemShapeRequired("fashion_accessories", null)).toBe(false);
    expect(isItemShapeRequired("shoes", "sneakers")).toBe(false);
    expect(isItemShapeRequired("shoes", "other")).toBe(false);
    expect(isItemShapeRequired("shoes", null)).toBe(false);
    expect(isItemShapeRequired("legwear", "socks")).toBe(false);
    expect(isItemShapeRequired("legwear", "other")).toBe(false);
    expect(isItemShapeRequired("legwear", null)).toBe(false);
    expect(isItemShapeRequired("inner", "roomwear")).toBe(false);
    expect(isItemShapeRequired("inner", "other")).toBe(false);
    expect(isItemShapeRequired("inner", null)).toBe(false);
    expect(isItemShapeRequired("tops", "hoodie")).toBe(false);
    expect(isItemShapeRequired("tops", "other")).toBe(false);
    expect(isItemShapeRequired("kimono", "other")).toBe(false);
  });
  it("形が不要なカテゴリや種類では shape UI を出さない", () => {
    expect(shouldShowItemShapeField(undefined, undefined)).toBe(false);
    expect(shouldShowItemShapeField("onepiece_dress", "dress")).toBe(false);
    expect(shouldShowItemShapeField("allinone", "allinone")).toBe(false);
    expect(shouldShowItemShapeField("inner", "roomwear")).toBe(false);
    expect(shouldShowItemShapeField("legwear", "socks")).toBe(false);
    expect(shouldShowItemShapeField("shoes", "sneakers")).toBe(false);
    expect(shouldShowItemShapeField("bags", "other")).toBe(false);
    expect(shouldShowItemShapeField("outerwear", null)).toBe(false);
    expect(shouldShowItemShapeField("outerwear", "blouson")).toBe(false);
    expect(shouldShowItemShapeField("outerwear", "other")).toBe(false);
    expect(shouldShowItemShapeField("pants", "other")).toBe(false);
    expect(shouldShowItemShapeField("skirts", "other")).toBe(false);
    expect(shouldShowItemShapeField("tops", null)).toBe(false);
    expect(shouldShowItemShapeField("tops", "hoodie")).toBe(false);
    expect(shouldShowItemShapeField("tops", "other")).toBe(false);
  });

  it("種類だけで shape が一意に決まらない場合は shape UI を出す", () => {
    expect(shouldShowItemShapeField("pants", "denim")).toBe(true);
    expect(shouldShowItemShapeField("skirts", "skirt")).toBe(true);
    expect(shouldShowItemShapeField("outerwear", "jacket")).toBe(true);
    expect(shouldShowItemShapeField("outerwear", "coat")).toBe(true);
    expect(shouldShowItemShapeField("tops", "shirt_blouse")).toBe(true);
  });

  it("任意寄りのときは送信用の形を自動補完する", () => {
    expect(resolveItemShapeForSubmit("pants", "other", "")).toBe("pants");
    expect(resolveItemShapeForSubmit("outerwear", "blouson", "")).toBe(
      "blouson",
    );
    expect(resolveItemShapeForSubmit("outerwear", "other", "")).toBe("jacket");
    expect(resolveItemShapeForSubmit("bags", "tote", "")).toBe("tote");
    expect(resolveItemShapeForSubmit("bags", "other", "")).toBe("bag");
    expect(resolveItemShapeForSubmit("fashion_accessories", "belt", "")).toBe(
      "belt",
    );
    expect(resolveItemShapeForSubmit("fashion_accessories", "other", "")).toBe(
      "other",
    );
    expect(resolveItemShapeForSubmit("skirts", null, "")).toBe("skirt");
    expect(resolveItemShapeForSubmit("shoes", "boots", "")).toBe("short-boots");
    expect(resolveItemShapeForSubmit("shoes", "other", "")).toBe("other");
    expect(resolveItemShapeForSubmit("shoes", null, "")).toBe("other");
    expect(resolveItemShapeForSubmit("legwear", "tights", "")).toBe("tights");
    expect(resolveItemShapeForSubmit("legwear", "other", "")).toBe("socks");
    expect(resolveItemShapeForSubmit("legwear", null, "")).toBe("socks");
    expect(resolveItemShapeForSubmit("inner", "roomwear", "")).toBe("roomwear");
    expect(resolveItemShapeForSubmit("inner", "other", "")).toBe("roomwear");
    expect(resolveItemShapeForSubmit("inner", null, "")).toBe("roomwear");
    expect(resolveItemShapeForSubmit("tops", "hoodie", "")).toBe("hoodie");
    expect(resolveItemShapeForSubmit("tops", "other", "")).toBe("");
    expect(resolveItemShapeForSubmit("kimono", "other", "")).toBe("kimono");
  });

  it("shape が複数候補に分かれる種類では明示入力を要求する", () => {
    expect(resolveItemShapeForSubmit("pants", "denim", "")).toBe("");
    expect(resolveItemShapeForSubmit("skirts", "skirt", "")).toBe("");
    expect(resolveItemShapeForSubmit("outerwear", "coat", "")).toBe("");
    expect(resolveItemShapeForSubmit("tops", "shirt_blouse", "")).toBe("");
  });

  it("submit 用 shape は分類軸の正本として組み立てる", () => {
    expect(buildItemShapeForSubmit("tops", "hoodie", "")).toBe("hoodie");
    expect(buildItemShapeForSubmit("tops", "other", "")).toBe("");
    expect(buildItemShapeForSubmit("outerwear", "blouson", "")).toBe("blouson");
  });

  it("tops spec は解決済み shape からだけ互換値を生成する", () => {
    expect(
      buildItemSpecForSubmit({
        category: "tops",
        resolvedShape: "hoodie",
        tops: {
          sleeve: "long",
          length: "regular",
          neck: "crew",
          design: null,
          fit: "standard",
        },
      }),
    ).toEqual({
      tops: {
        shape: "hoodie",
        sleeve: "long",
        length: "regular",
        neck: "crew",
        design: null,
        fit: "standard",
      },
    });

    expect(
      buildItemSpecForSubmit({
        category: "tops",
        resolvedShape: "",
        tops: {
          sleeve: "long",
          length: "regular",
          neck: "crew",
          design: null,
          fit: "standard",
        },
      }),
    ).toBeNull();
  });

  it("tops 以外の spec は既存の送信条件を維持する", () => {
    expect(
      buildItemSpecForSubmit({
        category: "pants",
        resolvedShape: "",
        bottoms: {
          length_type: "full",
          rise_type: "high",
        },
      }),
    ).toEqual({
      bottoms: {
        length_type: "full",
        rise_type: "high",
      },
    });

    expect(
      buildItemSpecForSubmit({
        category: "legwear",
        resolvedShape: "",
        legwear: {
          coverage_type: "ankle",
        },
      }),
    ).toEqual({
      legwear: {
        coverage_type: "ankle",
      },
    });
  });
});
