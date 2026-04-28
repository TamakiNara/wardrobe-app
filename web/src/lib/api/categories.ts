import { apiFetch } from "@/lib/api/client";
import { ITEM_CATEGORIES } from "@/lib/master-data/item-shapes";
import {
  resolveCurrentItemCategoryValue,
  resolveCurrentItemShapeValue,
  resolveVisibleCategoryIdForItem as resolveVisibleCategoryIdForCurrentItem,
} from "@/lib/items/current-item-read-model";
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
  underwear: "underwear",
  legwear: "legwear",
  shoes: "shoes",
  bags: "bags",
  fashion_accessories: "fashion_accessories",
  swimwear: "swimwear",
  kimono: "kimono",
};
export { resolveCurrentItemCategoryValue, resolveCurrentItemShapeValue };

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
  subcategory?: string | null,
): string | null {
  return resolveVisibleCategoryIdForCurrentItem(category, shape, subcategory);
}

export function isItemVisibleByCategorySettings(
  item: {
    category?: string | null;
    shape?: string | null;
    subcategory?: string | null;
  },
  visibleCategoryIds?: string[],
): boolean {
  if (!visibleCategoryIds) {
    return true;
  }

  const resolvedCategoryId = findVisibleCategoryIdForItem(
    item.category,
    item.shape,
    item.subcategory,
  );
  if (!resolvedCategoryId) {
    return true;
  }

  return visibleCategoryIds.includes(resolvedCategoryId);
}
