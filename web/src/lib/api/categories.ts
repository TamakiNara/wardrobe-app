import { apiFetch } from "@/lib/api/client";
import { ITEM_CATEGORIES } from "@/lib/master-data/item-shapes";
import type {
  CategoriesResponse,
  CategoryGroupRecord,
  CategoryOption,
} from "@/types/categories";

const SUPPORTED_CATEGORY_VALUES = new Set(ITEM_CATEGORIES.map((item) => item.value));

export async function fetchCategoryGroups(): Promise<CategoryGroupRecord[]> {
  const data = await apiFetch<CategoriesResponse>("/api/categories");
  return data.groups ?? [];
}

export function buildSupportedCategoryOptions(groups: CategoryGroupRecord[]): CategoryOption[] {
  return groups
    .filter((group) => SUPPORTED_CATEGORY_VALUES.has(group.id))
    .map((group) => ({
      value: group.id,
      label: group.name,
    }));
}