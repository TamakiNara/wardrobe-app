import {
  getItemSubcategoryOptions,
  normalizeItemSubcategory,
  resolveCurrentItemSubcategoryValue,
} from "@/lib/master-data/item-subcategories";
import {
  ITEM_CATEGORIES,
  resolveCurrentItemCategoryValue,
} from "@/lib/master-data/item-shapes";
import type { ItemRecord } from "@/types/items";
import type { UserBrandRecord } from "@/types/settings";

export type OutfitItemSelectionFilters = {
  keyword: string;
  brand: string;
  category: string;
  subcategory: string;
  season: string;
  tpo: string;
};

function normalizeText(value?: string | null) {
  return value?.trim().toLocaleLowerCase("ja-JP") ?? "";
}

function resolveCategory(item: ItemRecord) {
  return (
    resolveCurrentItemCategoryValue(item.category, item.shape) ?? item.category
  );
}

function resolveSubcategory(item: ItemRecord) {
  const currentCategory = resolveCategory(item);

  return (
    resolveCurrentItemSubcategoryValue(
      currentCategory,
      item.shape,
      item.subcategory,
    ) ?? ""
  );
}

export function buildOutfitItemCategoryOptions(items: ItemRecord[]) {
  const availableCategoryValues = new Set(
    items.map((item) => resolveCategory(item)),
  );

  return ITEM_CATEGORIES.filter((category) =>
    availableCategoryValues.has(category.value),
  );
}

export function buildOutfitItemBrandOptions(
  items: ItemRecord[],
): UserBrandRecord[] {
  const mergedByName = new Map<string, UserBrandRecord>();

  items.forEach((item, index) => {
    const normalizedName = item.brand_name?.trim();

    if (!normalizedName) {
      return;
    }

    mergedByName.set(normalizedName, {
      id: -(index + 1),
      name: normalizedName,
      kana: null,
      is_active: true,
      updated_at: "",
    });
  });

  return Array.from(mergedByName.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "ja-JP"),
  );
}

export function buildOutfitItemSeasonOptions(items: ItemRecord[]) {
  return Array.from(
    new Set(
      items.flatMap((item) => item.seasons.filter((season) => season !== "")),
    ),
  ).sort((left, right) => left.localeCompare(right, "ja-JP"));
}

export function buildOutfitItemTpoOptions(items: ItemRecord[]) {
  return Array.from(
    new Set(items.flatMap((item) => item.tpos.filter((tpo) => tpo !== ""))),
  ).sort((left, right) => left.localeCompare(right, "ja-JP"));
}

export function buildOutfitItemSubcategoryOptions(category: string) {
  return [...getItemSubcategoryOptions(category)].sort((left, right) => {
    if (left.value === "other") {
      return 1;
    }

    if (right.value === "other") {
      return -1;
    }

    return 0;
  });
}

export function filterOutfitCandidateItems(
  items: ItemRecord[],
  filters: OutfitItemSelectionFilters,
) {
  const normalizedKeyword = normalizeText(filters.keyword);
  const normalizedBrand = normalizeText(filters.brand);
  const normalizedSubcategory =
    normalizeItemSubcategory(filters.category, filters.subcategory) ?? "";

  return items.filter((item) => {
    const currentCategory = resolveCategory(item);
    const currentSubcategory = resolveSubcategory(item);
    const matchesKeyword =
      normalizedKeyword === "" ||
      normalizeText(item.name).includes(normalizedKeyword) ||
      normalizeText(item.memo).includes(normalizedKeyword) ||
      normalizeText(item.brand_name).includes(normalizedKeyword);
    const matchesBrand =
      normalizedBrand === "" ||
      normalizeText(item.brand_name).includes(normalizedBrand);
    const matchesCategory =
      filters.category === "" || currentCategory === filters.category;
    const matchesSubcategory =
      normalizedSubcategory === "" ||
      currentSubcategory === normalizedSubcategory;
    const matchesSeason =
      filters.season === "" || item.seasons.includes(filters.season);
    const matchesTpo = filters.tpo === "" || item.tpos.includes(filters.tpo);

    return (
      matchesKeyword &&
      matchesBrand &&
      matchesCategory &&
      matchesSubcategory &&
      matchesSeason &&
      matchesTpo
    );
  });
}
