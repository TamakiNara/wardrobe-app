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
  outerwear: "outer",
  pants: "bottoms",
  skirts: "bottoms",
  onepiece_dress: "onepiece_allinone",
  allinone: "onepiece_allinone",
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
  bottoms: {
    tapered: "pants_pants",
    wide: "pants_pants",
    straight: "pants_pants",
    "mini-skirt": "skirts_skirt",
    "tight-skirt": "skirts_skirt",
    "a-line-skirt": "skirts_skirt",
    "flare-skirt": "skirts_skirt",
  },
  outer: {
    tailored: "outerwear_jacket",
    trench: "outerwear_coat",
    chester: "outerwear_coat",
    down: "outerwear_down_padded",
    "outer-cardigan": "outerwear_blouson",
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
  },
  bags: {
    bag: "bags_bag",
    tote: "bags_bag",
    shoulder: "bags_bag",
    backpack: "bags_bag",
    clutch: "bags_bag",
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
    tote: "bags_bag",
    shoulder: "bags_bag",
    backpack: "bags_bag",
    hat: "fashion_accessories_hat",
    accessory: "fashion_accessories_other",
  },
};

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
