import { describe, expect, it } from "vitest";
import { buildSupportedCategoryOptions } from "@/lib/api/categories";
import type { CategoryGroupRecord } from "@/types/categories";

const groups: CategoryGroupRecord[] = [
  {
    id: "tops",
    name: "トップス",
    categories: [
      { id: "tops_tshirt", groupId: "tops", name: "Tシャツ" },
      { id: "tops_shirt", groupId: "tops", name: "シャツ / ブラウス" },
    ],
  },
  {
    id: "outer",
    name: "アウター",
    categories: [
      { id: "outer_jacket", groupId: "outer", name: "ジャケット" },
    ],
  },
  {
    id: "bags",
    name: "バッグ",
    categories: [
      { id: "bags_tote", groupId: "bags", name: "トートバッグ" },
    ],
  },
];

describe("buildSupportedCategoryOptions", () => {
  it("supported category group only returns when visibility is not specified", () => {
    expect(buildSupportedCategoryOptions(groups)).toEqual([
      { value: "tops", label: "トップス" },
      { value: "outer", label: "アウター" },
    ]);
  });

  it("filters out supported groups that have no visible categories", () => {
    expect(buildSupportedCategoryOptions(groups, ["tops_tshirt"])).toEqual([
      { value: "tops", label: "トップス" },
    ]);
  });

  it("does not include unsupported groups even if a visible category exists", () => {
    expect(buildSupportedCategoryOptions(groups, ["bags_tote"])).toEqual([]);
  });
});