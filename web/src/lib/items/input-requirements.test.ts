import { describe, expect, it } from "vitest";
import {
  isItemShapeRequired,
  resolveItemShapeForSubmit,
  shouldShowItemShapeField,
} from "@/lib/items/input-requirements";

describe("item input requirements", () => {
  it("候補が複数ある種類では形を必須にする", () => {
    expect(isItemShapeRequired("outerwear", "coat")).toBe(true);
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
    expect(isItemShapeRequired("tops", "other")).toBe(false);
    expect(isItemShapeRequired("kimono", "other")).toBe(false);
  });
  it("other 系の一部カテゴリでは shape UI を出さない", () => {
    expect(shouldShowItemShapeField("tops", "other")).toBe(false);
    expect(shouldShowItemShapeField("pants", "other")).toBe(false);
    expect(shouldShowItemShapeField("skirts", "other")).toBe(false);
    expect(shouldShowItemShapeField("outerwear", "other")).toBe(false);
    expect(shouldShowItemShapeField("bags", "other")).toBe(false);
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
    expect(resolveItemShapeForSubmit("tops", "other", "")).toBe("");
    expect(resolveItemShapeForSubmit("kimono", "other", "")).toBe("kimono");
  });
});
