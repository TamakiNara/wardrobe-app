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
      {
        id: "tops_tshirt_cutsew",
        groupId: "tops",
        name: "Tシャツ・カットソー",
      },
      {
        id: "tops_shirt_blouse",
        groupId: "tops",
        name: "シャツ・ブラウス",
      },
    ],
  },
  {
    id: "outerwear",
    name: "ジャケット・アウター",
    categories: [
      { id: "outerwear_jacket", groupId: "outerwear", name: "ジャケット" },
    ],
  },
  {
    id: "onepiece_dress",
    name: "ワンピース・ドレス",
    categories: [
      {
        id: "onepiece_dress_onepiece",
        groupId: "onepiece_dress",
        name: "ワンピース",
      },
    ],
  },
  {
    id: "allinone",
    name: "オールインワン",
    categories: [
      {
        id: "allinone_allinone",
        groupId: "allinone",
        name: "オールインワン",
      },
    ],
  },
  {
    id: "roomwear_inner",
    name: "ルームウェア・インナー",
    categories: [
      {
        id: "roomwear_inner_roomwear",
        groupId: "roomwear_inner",
        name: "ルームウェア",
      },
      {
        id: "roomwear_inner_underwear",
        groupId: "roomwear_inner",
        name: "インナー",
      },
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
    categories: [{ id: "bags_bag", groupId: "bags", name: "バッグ" }],
  },
  {
    id: "fashion_accessories",
    name: "ファッション小物",
    categories: [
      {
        id: "fashion_accessories_hat",
        groupId: "fashion_accessories",
        name: "帽子",
      },
    ],
  },
  {
    id: "swimwear",
    name: "水着",
    categories: [
      {
        id: "swimwear_swimwear",
        groupId: "swimwear",
        name: "水着",
      },
    ],
  },
  {
    id: "kimono",
    name: "着物",
    categories: [
      {
        id: "kimono_kimono",
        groupId: "kimono",
        name: "着物",
      },
    ],
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
      { value: "bags", label: "バッグ" },
      { value: "fashion_accessories", label: "ファッション小物" },
      { value: "swimwear", label: "水着" },
      { value: "kimono", label: "着物" },
    ]);
  });

  it("表示対象の中分類がない大分類は候補から外す", () => {
    expect(
      buildSupportedCategoryOptions(groups, [
        "tops_tshirt_cutsew",
        "roomwear_inner_roomwear",
      ]),
    ).toEqual([
      { value: "tops", label: "トップス" },
      { value: "inner", label: "ルームウェア・インナー" },
    ]);

    expect(buildSupportedCategoryOptions(groups, ["legwear_socks"])).toEqual([
      { value: "legwear", label: "レッグウェア" },
    ]);
  });

  it("バッグとファッション小物は item 側でも別カテゴリとして扱う", () => {
    expect(
      buildSupportedCategoryOptions(groups, [
        "bags_bag",
        "fashion_accessories_hat",
      ]),
    ).toEqual([
      { value: "bags", label: "バッグ" },
      { value: "fashion_accessories", label: "ファッション小物" },
    ]);
  });
});

describe("findVisibleCategoryIdForItem", () => {
  it("item の category / shape から中分類 ID を解決する", () => {
    expect(findVisibleCategoryIdForItem("tops", "shirt")).toBe(
      "tops_shirt_blouse",
    );
    expect(findVisibleCategoryIdForItem("tops", "blouse")).toBe(
      "tops_shirt_blouse",
    );
    expect(findVisibleCategoryIdForItem("outer", "trench")).toBe(
      "outerwear_coat",
    );
    expect(findVisibleCategoryIdForItem("onepiece_allinone", "onepiece")).toBe(
      "onepiece_dress_onepiece",
    );
    expect(findVisibleCategoryIdForItem("inner", "roomwear")).toBe(
      "roomwear_inner_roomwear",
    );
    expect(findVisibleCategoryIdForItem("legwear", "tights")).toBe(
      "legwear_tights",
    );
    expect(findVisibleCategoryIdForItem("bags", "tote")).toBe("bags_bag");
    expect(findVisibleCategoryIdForItem("fashion_accessories", "belt")).toBe(
      "fashion_accessories_belt",
    );
    expect(findVisibleCategoryIdForItem("swimwear", "swimwear")).toBe(
      "swimwear_swimwear",
    );
    expect(findVisibleCategoryIdForItem("kimono", "kimono")).toBe(
      "kimono_kimono",
    );
    expect(findVisibleCategoryIdForItem("accessories", "tote")).toBe(
      "bags_bag",
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
        "tops_tshirt_cutsew",
        "outerwear_jacket",
      ]),
    ).toBe(false);

    expect(
      isItemVisibleByCategorySettings({ category: "tops", shape: "shirt" }, [
        "tops_shirt_blouse",
      ]),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings(
        { category: "onepiece_allinone", shape: "onepiece" },
        ["onepiece_dress_onepiece"],
      ),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings(
        { category: "inner", shape: "roomwear" },
        ["roomwear_inner_roomwear"],
      ),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings(
        { category: "legwear", shape: "tights" },
        ["legwear_tights"],
      ),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings({ category: "bags", shape: "tote" }, [
        "bags_bag",
      ]),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings(
        { category: "fashion_accessories", shape: "belt" },
        ["fashion_accessories_belt"],
      ),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings(
        { category: "swimwear", shape: "swimwear" },
        ["swimwear_swimwear"],
      ),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings({ category: "kimono", shape: "kimono" }, [
        "kimono_kimono",
      ]),
    ).toBe(true);
  });

  it("不明な対応は既存データを隠さないよう表示のままにする", () => {
    expect(
      isItemVisibleByCategorySettings(
        { category: "tops", shape: "unknown-shape" },
        ["tops_tshirt_cutsew"],
      ),
    ).toBe(true);
  });
});
