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