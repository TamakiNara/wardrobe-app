import { describe, expect, it } from "vitest";
import {
  isItemShapeRequired,
  resolveItemShapeForSubmit,
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
    expect(isItemShapeRequired("kimono", "other")).toBe(false);
  });

  it("任意寄りのときは送信用の形を自動補完する", () => {
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
    expect(resolveItemShapeForSubmit("shoes", null, "")).toBe("sneakers");
    expect(resolveItemShapeForSubmit("kimono", "other", "")).toBe("kimono");
  });
});
