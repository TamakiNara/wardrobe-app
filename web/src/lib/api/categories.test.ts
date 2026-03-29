import { describe, expect, it } from "vitest";
import {
  buildSupportedCategoryOptions,
  findVisibleCategoryIdForItem,
  isItemVisibleByCategorySettings,
} from "@/lib/api/categories";
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
    categories: [{ id: "outer_jacket", groupId: "outer", name: "ジャケット" }],
  },
  {
    id: "onepiece_allinone",
    name: "ワンピース / オールインワン",
    categories: [
      {
        id: "onepiece",
        groupId: "onepiece_allinone",
        name: "ワンピース",
      },
      {
        id: "allinone",
        groupId: "onepiece_allinone",
        name: "オールインワン / サロペット",
      },
    ],
  },
  {
    id: "inner",
    name: "ルームウェア・インナー",
    categories: [
      { id: "inner_roomwear", groupId: "inner", name: "ルームウェア" },
      { id: "inner_underwear", groupId: "inner", name: "インナー" },
    ],
  },
  {
    id: "legwear",
    name: "レッグウェア",
    categories: [{ id: "legwear_socks", groupId: "legwear", name: "ソックス" }],
  },
  {
    id: "bags",
    name: "バッグ",
    categories: [{ id: "bags_tote", groupId: "bags", name: "トートバッグ" }],
  },
];

describe("buildSupportedCategoryOptions", () => {
  it("visibleCategoryIds が未指定のときは対応大分類を返す", () => {
    expect(buildSupportedCategoryOptions(groups)).toEqual([
      { value: "tops", label: "トップス" },
      { value: "outer", label: "アウター" },
      { value: "onepiece_allinone", label: "ワンピース / オールインワン" },
      { value: "inner", label: "ルームウェア・インナー" },
      { value: "legwear", label: "レッグウェア" },
    ]);
  });

  it("表示対象の中分類がない大分類は候補から外す", () => {
    expect(
      buildSupportedCategoryOptions(groups, ["tops_tshirt", "inner_roomwear"]),
    ).toEqual([
      { value: "tops", label: "トップス" },
      { value: "inner", label: "ルームウェア・インナー" },
    ]);

    expect(buildSupportedCategoryOptions(groups, ["legwear_socks"])).toEqual([
      { value: "legwear", label: "レッグウェア" },
    ]);
  });

  it("未対応の大分類は表示対象でも候補に含めない", () => {
    expect(buildSupportedCategoryOptions(groups, ["bags_tote"])).toEqual([]);
  });
});

describe("findVisibleCategoryIdForItem", () => {
  it("item の category / shape から中分類 ID を解決する", () => {
    expect(findVisibleCategoryIdForItem("tops", "shirt")).toBe("tops_shirt");
    expect(findVisibleCategoryIdForItem("tops", "blouse")).toBe("tops_shirt");
    expect(findVisibleCategoryIdForItem("outer", "trench")).toBe("outer_coat");
    expect(findVisibleCategoryIdForItem("onepiece_allinone", "onepiece")).toBe(
      "onepiece",
    );
    expect(findVisibleCategoryIdForItem("inner", "roomwear")).toBe(
      "inner_roomwear",
    );
    expect(findVisibleCategoryIdForItem("legwear", "tights")).toBe(
      "legwear_tights",
    );
    expect(findVisibleCategoryIdForItem("accessories", "tote")).toBe(
      "bags_tote",
    );
  });

  it("対応がないときは null を返す", () => {
    expect(findVisibleCategoryIdForItem("tops", "unknown-shape")).toBeNull();
    expect(findVisibleCategoryIdForItem(null, "shirt")).toBeNull();
  });
});

describe("isItemVisibleByCategorySettings", () => {
  it("visibleCategoryIds が未指定なら表示可能とみなす", () => {
    expect(
      isItemVisibleByCategorySettings({ category: "tops", shape: "shirt" }),
    ).toBe(true);
  });

  it("解決した中分類 ID が含まれるときだけ true を返す", () => {
    expect(
      isItemVisibleByCategorySettings({ category: "tops", shape: "shirt" }, [
        "tops_tshirt",
        "outer_jacket",
      ]),
    ).toBe(false);

    expect(
      isItemVisibleByCategorySettings({ category: "tops", shape: "shirt" }, [
        "tops_shirt",
      ]),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings(
        { category: "onepiece_allinone", shape: "onepiece" },
        ["onepiece"],
      ),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings(
        { category: "inner", shape: "roomwear" },
        ["inner_roomwear"],
      ),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings(
        { category: "legwear", shape: "tights" },
        ["legwear_tights"],
      ),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings(
        { category: "accessories", shape: "tote" },
        ["bags_tote"],
      ),
    ).toBe(true);
  });

  it("不明な対応は既存データを隠さないよう表示のままにする", () => {
    expect(
      isItemVisibleByCategorySettings(
        { category: "tops", shape: "unknown-shape" },
        ["tops_tshirt"],
      ),
    ).toBe(true);
  });
});
