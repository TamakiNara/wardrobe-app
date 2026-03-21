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

const ITEM_CATEGORY_ID_BY_SHAPE: Record<string, Record<string, string>> = {
  tops: {
    tshirt: "tops_tshirt",
    shirt: "tops_shirt",
    blouse: "tops_shirt",
    knit: "tops_knit",
    cardigan: "tops_cardigan",
    camisole: "tops_vest",
    tanktop: "tops_vest",
    jacket: "tops_vest",
  },
  bottoms: {
    tapered: "bottoms_pants",
    wide: "bottoms_pants",
    straight: "bottoms_pants",
    "tight-skirt": "bottoms_skirt",
    "a-line-skirt": "bottoms_skirt",
  },
  outer: {
    tailored: "outer_jacket",
    trench: "outer_coat",
    chester: "outer_coat",
    down: "outer_down",
    "outer-cardigan": "outer_other",
  },
  dress: {
    onepiece: "dress_onepiece",
    allinone: "dress_allinone",
  },
  inner: {
    roomwear: "inner_roomwear",
    underwear: "inner_underwear",
    pajamas: "inner_pajamas",
  },
  shoes: {
    sneakers: "shoes_sneakers",
    pumps: "shoes_pumps",
    "short-boots": "shoes_boots",
    sandals: "shoes_sandals",
  },
  accessories: {
    tote: "bags_tote",
    shoulder: "bags_shoulder",
    backpack: "bags_backpack",
    hat: "accessories_hat",
    accessory: "accessories_jewelry",
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
      if (!SUPPORTED_CATEGORY_VALUES.has(group.id)) {
        return false;
      }

      if (!visibleCategoryIdSet) {
        return true;
      }

      return group.categories.some((category) =>
        visibleCategoryIdSet.has(category.id),
      );
    })
    .map((group: CategoryGroupRecord) => ({
      value: group.id,
      label: group.name,
    }));
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

  const resolvedCategoryId = findVisibleCategoryIdForItem(item.category, item.shape);
  if (!resolvedCategoryId) {
    return true;
  }

  return visibleCategoryIds.includes(resolvedCategoryId);
}
