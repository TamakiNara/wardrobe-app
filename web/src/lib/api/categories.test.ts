import { describe, expect, it } from "vitest";
import {
  buildSupportedCategoryOptions,
  findVisibleCategoryIdForItem,
  isItemVisibleByCategorySettings,
  resolveCurrentItemCategoryValue,
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
    id: "shoes",
    name: "シューズ",
    categories: [
      { id: "shoes_sneakers", groupId: "shoes", name: "スニーカー" },
      { id: "shoes_pumps", groupId: "shoes", name: "パンプス" },
      { id: "shoes_boots", groupId: "shoes", name: "ブーツ" },
      { id: "shoes_sandals", groupId: "shoes", name: "サンダル" },
      { id: "shoes_other", groupId: "shoes", name: "その他シューズ" },
    ],
  },
  {
    id: "bags",
    name: "バッグ",
    categories: [
      { id: "bags_tote", groupId: "bags", name: "トートバッグ" },
      { id: "bags_shoulder", groupId: "bags", name: "ショルダーバッグ" },
      { id: "bags_backpack", groupId: "bags", name: "リュック" },
      { id: "bags_hand", groupId: "bags", name: "ハンドバッグ" },
      { id: "bags_clutch", groupId: "bags", name: "クラッチバッグ" },
      { id: "bags_body", groupId: "bags", name: "ボディバッグ" },
      { id: "bags_other", groupId: "bags", name: "その他バッグ" },
    ],
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
      { value: "outerwear", label: "ジャケット・アウター" },
      { value: "onepiece_dress", label: "ワンピース・ドレス" },
      { value: "allinone", label: "オールインワン" },
      { value: "inner", label: "ルームウェア・インナー" },
      { value: "legwear", label: "レッグウェア" },
      { value: "shoes", label: "シューズ" },
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

    expect(buildSupportedCategoryOptions(groups, ["shoes_sneakers"])).toEqual([
      { value: "shoes", label: "シューズ" },
    ]);
  });

  it("バッグとファッション小物は item 側でも別カテゴリとして扱う", () => {
    expect(
      buildSupportedCategoryOptions(groups, [
        "bags_tote",
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
    expect(findVisibleCategoryIdForItem("pants", "slacks")).toBe(
      "pants_slacks",
    );
    expect(findVisibleCategoryIdForItem("skirts", "skirt")).toBe(
      "skirts_skirt",
    );
    expect(findVisibleCategoryIdForItem("outerwear", "coat")).toBe(
      "outerwear_coat",
    );
    expect(findVisibleCategoryIdForItem("outerwear", "trench")).toBe(
      "outerwear_coat",
    );
    expect(findVisibleCategoryIdForItem("outerwear", "stainless")).toBe(
      "outerwear_coat",
    );
    expect(findVisibleCategoryIdForItem("outerwear", "tailored")).toBe(
      "outerwear_jacket",
    );
    expect(findVisibleCategoryIdForItem("outerwear", "no_collar")).toBe(
      "outerwear_jacket",
    );
    expect(findVisibleCategoryIdForItem("outer", "trench")).toBe(
      "outerwear_coat",
    );
    expect(findVisibleCategoryIdForItem("onepiece_dress", "onepiece")).toBe(
      "onepiece_dress_onepiece",
    );
    expect(findVisibleCategoryIdForItem("allinone", "salopette")).toBe(
      "allinone_salopette",
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
    expect(findVisibleCategoryIdForItem("legwear", "socks", "other")).toBe(
      "legwear_other",
    );
    expect(findVisibleCategoryIdForItem("shoes", "sneakers")).toBe(
      "shoes_sneakers",
    );
    expect(findVisibleCategoryIdForItem("shoes", "other")).toBe("shoes_other");
    expect(findVisibleCategoryIdForItem("bags", "tote")).toBe("bags_tote");
    expect(findVisibleCategoryIdForItem("bags", "hand")).toBe("bags_hand");
    expect(findVisibleCategoryIdForItem("bags", "body")).toBe("bags_body");
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
      "bags_tote",
    );
    expect(findVisibleCategoryIdForItem("accessories", "belt")).toBe(
      "fashion_accessories_belt",
    );
  });

  it("対応がないときは null を返す", () => {
    expect(findVisibleCategoryIdForItem("tops", "unknown-shape")).toBeNull();
    expect(findVisibleCategoryIdForItem(null, "shirt")).toBeNull();
  });
});

describe("resolveCurrentItemCategoryValue", () => {
  it("旧カテゴリを current カテゴリ値へ寄せる", () => {
    expect(resolveCurrentItemCategoryValue("bottoms", "wide")).toBe("pants");
    expect(resolveCurrentItemCategoryValue("bottoms", "flare-skirt")).toBe(
      "skirts",
    );
    expect(resolveCurrentItemCategoryValue("outer", "trench")).toBe(
      "outerwear",
    );
    expect(
      resolveCurrentItemCategoryValue("onepiece_allinone", "onepiece"),
    ).toBe("onepiece_dress");
    expect(
      resolveCurrentItemCategoryValue("onepiece_allinone", "allinone"),
    ).toBe("allinone");
    expect(resolveCurrentItemCategoryValue("accessories", "tote")).toBe("bags");
    expect(resolveCurrentItemCategoryValue("accessories", "hat")).toBe(
      "fashion_accessories",
    );
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
        { category: "onepiece_dress", shape: "onepiece" },
        ["onepiece_dress_onepiece"],
      ),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings(
        { category: "allinone", shape: "salopette" },
        ["allinone_salopette"],
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
        { category: "legwear", shape: "tights", subcategory: "tights" },
        ["legwear_tights"],
      ),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings(
        { category: "legwear", shape: "socks", subcategory: "other" },
        ["legwear_other"],
      ),
    ).toBe(true);

    expect(
      isItemVisibleByCategorySettings({ category: "bags", shape: "tote" }, [
        "bags_tote",
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
