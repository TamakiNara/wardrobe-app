import { apiFetch } from "@/lib/api/client";
import { ITEM_CATEGORIES } from "@/lib/master-data/item-shapes";
import type {
  CategoriesResponse,
  CategoryGroupRecord,
  CategoryOption,
} from "@/types/categories";

const SUPPORTED_CATEGORY_VALUES = new Set<string>(
  ITEM_CATEGORIES.map((item) => item.value),
);

const MASTER_GROUP_TO_ITEM_CATEGORY: Record<string, string> = {
  tops: "tops",
  outerwear: "outerwear",
  pants: "pants",
  skirts: "skirts",
  onepiece_dress: "onepiece_dress",
  allinone: "allinone",
  roomwear_inner: "inner",
  legwear: "legwear",
  shoes: "shoes",
  bags: "bags",
  fashion_accessories: "fashion_accessories",
  swimwear: "swimwear",
  kimono: "kimono",
};

const ITEM_CATEGORY_ID_BY_SHAPE: Record<string, Record<string, string>> = {
  tops: {
    tshirt: "tops_tshirt_cutsew",
    shirt: "tops_shirt_blouse",
    blouse: "tops_shirt_blouse",
    knit: "tops_knit_sweater",
    cardigan: "tops_cardigan",
    camisole: "tops_camisole",
    tanktop: "tops_tanktop",
    jacket: "tops_other",
  },
  pants: {
    pants: "pants_pants",
    denim: "pants_denim",
    slacks: "pants_slacks",
    "short-pants": "pants_pants",
    other: "pants_other",
    straight: "pants_pants",
    tapered: "pants_pants",
    wide: "pants_pants",
    culottes: "pants_pants",
  },
  skirts: {
    skirt: "skirts_skirt",
    other: "skirts_other",
    tight: "skirts_skirt",
    flare: "skirts_skirt",
    a_line: "skirts_skirt",
    pleated: "skirts_skirt",
  },
  bottoms: {
    tapered: "pants_pants",
    wide: "pants_pants",
    straight: "pants_pants",
    "mini-skirt": "skirts_skirt",
    "tight-skirt": "skirts_skirt",
    "a-line-skirt": "skirts_skirt",
    "flare-skirt": "skirts_skirt",
  },
  outerwear: {
    jacket: "outerwear_jacket",
    tailored: "outerwear_jacket",
    no_collar: "outerwear_jacket",
    blouson: "outerwear_blouson",
    "down-padded": "outerwear_down_padded",
    coat: "outerwear_coat",
    trench: "outerwear_coat",
    chester: "outerwear_coat",
    stainless: "outerwear_coat",
    "mountain-parka": "outerwear_mountain_parka",
    other: "outerwear_other",
  },
  outer: {
    tailored: "outerwear_jacket",
    trench: "outerwear_coat",
    chester: "outerwear_coat",
    down: "outerwear_down_padded",
    "outer-cardigan": "outerwear_blouson",
  },
  onepiece_dress: {
    onepiece: "onepiece_dress_onepiece",
    dress: "onepiece_dress_dress",
    other: "onepiece_dress_other",
  },
  allinone: {
    allinone: "allinone_allinone",
    salopette: "allinone_salopette",
    other: "allinone_other",
  },
  onepiece_allinone: {
    onepiece: "onepiece_dress_onepiece",
    allinone: "allinone_allinone",
  },
  inner: {
    roomwear: "roomwear_inner_roomwear",
    underwear: "roomwear_inner_underwear",
    pajamas: "roomwear_inner_pajamas",
  },
  legwear: {
    socks: "legwear_socks",
    stockings: "legwear_stockings",
    tights: "legwear_tights",
    leggings: "legwear_leggings",
  },
  shoes: {
    sneakers: "shoes_sneakers",
    pumps: "shoes_pumps",
    "short-boots": "shoes_boots",
    sandals: "shoes_sandals",
    other: "shoes_other",
  },
  bags: {
    bag: "bags_other",
    tote: "bags_tote",
    shoulder: "bags_shoulder",
    backpack: "bags_backpack",
    hand: "bags_hand",
    clutch: "bags_clutch",
    body: "bags_body",
    other: "bags_other",
  },
  fashion_accessories: {
    hat: "fashion_accessories_hat",
    belt: "fashion_accessories_belt",
    "scarf-stole": "fashion_accessories_scarf_stole",
    gloves: "fashion_accessories_gloves",
    jewelry: "fashion_accessories_jewelry",
    "wallet-case": "fashion_accessories_wallet_case",
    "hair-accessory": "fashion_accessories_hair",
    eyewear: "fashion_accessories_eyewear",
    watch: "fashion_accessories_watch",
    other: "fashion_accessories_other",
  },
  swimwear: {
    swimwear: "swimwear_swimwear",
    rashguard: "swimwear_rashguard",
    other: "swimwear_other",
  },
  kimono: {
    kimono: "kimono_kimono",
    other: "kimono_other",
  },
  accessories: {
    tote: "bags_tote",
    shoulder: "bags_shoulder",
    backpack: "bags_backpack",
    hand: "bags_hand",
    clutch: "bags_clutch",
    body: "bags_body",
    hat: "fashion_accessories_hat",
    belt: "fashion_accessories_belt",
    "scarf-stole": "fashion_accessories_scarf_stole",
    gloves: "fashion_accessories_gloves",
    jewelry: "fashion_accessories_jewelry",
    "wallet-case": "fashion_accessories_wallet_case",
    "hair-accessory": "fashion_accessories_hair",
    eyewear: "fashion_accessories_eyewear",
    watch: "fashion_accessories_watch",
    accessory: "fashion_accessories_other",
    other: "fashion_accessories_other",
  },
};

const PANTS_LIKE_SHAPES = new Set(["tapered", "wide", "straight"]);
const SKIRT_LIKE_SHAPES = new Set([
  "mini-skirt",
  "tight-skirt",
  "a-line-skirt",
  "flare-skirt",
]);

export function resolveCurrentItemCategoryValue(
  category?: string | null,
  shape?: string | null,
): string | null {
  if (!category) {
    return null;
  }

  if (category === "outer" || category === "outerwear") {
    return "outerwear";
  }

  if (category === "onepiece_allinone") {
    if (shape === "onepiece") {
      return "onepiece_dress";
    }

    if (shape === "allinone") {
      return "allinone";
    }
  }

  if (category === "bottoms") {
    if (shape && PANTS_LIKE_SHAPES.has(shape)) {
      return "pants";
    }

    if (shape && SKIRT_LIKE_SHAPES.has(shape)) {
      return "skirts";
    }
  }

  if (category === "accessories") {
    if (
      shape === "tote" ||
      shape === "shoulder" ||
      shape === "backpack" ||
      shape === "hand" ||
      shape === "clutch" ||
      shape === "body"
    ) {
      return "bags";
    }

    return "fashion_accessories";
  }

  if (category === "pants" || category === "skirts") {
    return category;
  }

  if (
    category === "onepiece_dress" ||
    category === "allinone" ||
    category === "tops" ||
    category === "inner" ||
    category === "legwear" ||
    category === "shoes" ||
    category === "bags" ||
    category === "fashion_accessories" ||
    category === "swimwear" ||
    category === "kimono"
  ) {
    return category;
  }

  return category;
}

export function resolveCurrentItemShapeValue(
  category?: string | null,
  shape?: string | null,
) {
  if (!shape) {
    return null;
  }

  const currentCategory = resolveCurrentItemCategoryValue(category, shape);

  if (category === "bottoms") {
    return (
      {
        tapered: "tapered",
        wide: "wide",
        straight: "straight",
        "mini-skirt": "skirt",
        "tight-skirt": "tight",
        "a-line-skirt": "a_line",
        "flare-skirt": "flare",
      }[shape] ?? shape
    );
  }

  if (currentCategory === "pants") {
    return (
      {
        pants: "pants",
        denim: "pants",
        slacks: "pants",
        "short-pants": "pants",
        other: "pants",
        tapered: "tapered",
        wide: "wide",
        straight: "straight",
        culottes: "culottes",
      }[shape] ?? shape
    );
  }

  if (currentCategory === "skirts") {
    return (
      {
        skirt: "skirt",
        other: "skirt",
        tight: "tight",
        flare: "flare",
        a_line: "a_line",
        pleated: "pleated",
      }[shape] ?? shape
    );
  }

  return shape;
}

export async function fetchCategoryGroups(): Promise<CategoryGroupRecord[]> {
  const data = await apiFetch<CategoriesResponse>("/api/categories");
  return data.groups ?? [];
}

export function buildSupportedCategoryOptions(
  groups: CategoryGroupRecord[],
  visibleCategoryIds?: string[],
): CategoryOption[] {
  const visibleCategoryIdSet = visibleCategoryIds
    ? new Set(visibleCategoryIds)
    : null;

  return groups
    .filter((group: CategoryGroupRecord) => {
      const itemCategoryValue = MASTER_GROUP_TO_ITEM_CATEGORY[group.id];
      if (
        !itemCategoryValue ||
        !SUPPORTED_CATEGORY_VALUES.has(itemCategoryValue)
      ) {
        return false;
      }

      if (!visibleCategoryIdSet) {
        return true;
      }

      return group.categories.some((category) =>
        visibleCategoryIdSet.has(category.id),
      );
    })
    .map(
      (group: CategoryGroupRecord) => MASTER_GROUP_TO_ITEM_CATEGORY[group.id],
    )
    .filter((value, index, values) => values.indexOf(value) === index)
    .map(
      (value) =>
        ITEM_CATEGORIES.find((item) => item.value === value) ?? {
          value,
          label: value,
        },
    );
}

export function findVisibleCategoryIdForItem(
  category?: string | null,
  shape?: string | null,
): string | null {
  if (!category || !shape) return null;

  return ITEM_CATEGORY_ID_BY_SHAPE[category]?.[shape] ?? null;
}

export function isItemVisibleByCategorySettings(
  item: { category?: string | null; shape?: string | null },
  visibleCategoryIds?: string[],
): boolean {
  if (!visibleCategoryIds) {
    return true;
  }

  const resolvedCategoryId = findVisibleCategoryIdForItem(
    item.category,
    item.shape,
  );
  if (!resolvedCategoryId) {
    return true;
  }

  return visibleCategoryIds.includes(resolvedCategoryId);
}
