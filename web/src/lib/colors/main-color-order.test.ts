import { describe, expect, it } from "vitest";
import { compareByMainColorSort } from "./main-color-order";

function buildRecord(id: number, hex?: string) {
  return {
    id,
    colors: hex ? [{ role: "main" as const, hex }] : [],
  };
}

describe("compareByMainColorSort", () => {
  it("無彩色を彩色より先に、無効色は末尾に並べる", () => {
    const records = [
      buildRecord(4),
      buildRecord(3, "#2255CC"),
      buildRecord(2, "#111111"),
      buildRecord(1, "#F5F5F5"),
    ];

    const sorted = [...records].sort(compareByMainColorSort);

    expect(sorted.map((record) => record.id)).toEqual([2, 1, 3, 4]);
  });

  it("彩色は hue asc -> lightness asc の順で並ぶ", () => {
    const records = [
      buildRecord(3, "#E53E3E"),
      buildRecord(2, "#7C3AED"),
      buildRecord(1, "#2563EB"),
      buildRecord(4, "#93C5FD"),
    ];

    const sorted = [...records].sort(compareByMainColorSort);

    expect(sorted.map((record) => record.id)).toEqual([3, 4, 1, 2]);
  });

  it("同一色順キーでは id asc を tie-breaker に使う", () => {
    const records = [
      buildRecord(9, "#FFFFFF"),
      buildRecord(3, "#FFFFFF"),
      buildRecord(5, "not-a-hex"),
      buildRecord(4, "not-a-hex"),
    ];

    const sorted = [...records].sort(compareByMainColorSort);

    expect(sorted.map((record) => record.id)).toEqual([3, 9, 4, 5]);
  });
});
