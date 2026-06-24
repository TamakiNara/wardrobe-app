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

function normalizeStringList(values: string[] | null | undefined) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter(
    (value): value is string => typeof value === "string" && value !== "",
  );
}

function matchesSeasonFilter(
  seasons: string[] | null | undefined,
  filterSeason: string,
) {
  const normalizedSeasons = normalizeStringList(seasons);

  if (filterSeason === "") {
    return true;
  }

  if (normalizedSeasons.length === 0) {
    return true;
  }

  return (
    normalizedSeasons.includes(filterSeason) ||
    normalizedSeasons.includes("オール")
  );
}

function normalizeText(value?: string | null) {
  return value?.trim().toLocaleLowerCase("ja-JP") ?? "";
}

export function resolveOutfitItemCategory(item: ItemRecord) {
  return (
    resolveCurrentItemCategoryValue(item.category, item.shape) ?? item.category
  );
}

export function resolveOutfitItemSubcategory(item: ItemRecord) {
  const currentCategory = resolveOutfitItemCategory(item);

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
    items.map((item) => resolveOutfitItemCategory(item)),
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

export function buildOutfitItemTpoOptions(items: ItemRecord[]) {
  return Array.from(
    new Set(items.flatMap((item) => normalizeStringList(item.tpos))),
  ).sort((left, right) => left.localeCompare(right, "ja-JP"));
}

function sortSubcategoryOptions<T extends { value: string }>(options: T[]) {
  return [...options].sort((left, right) => {
    if (left.value === "other") {
      return 1;
    }

    if (right.value === "other") {
      return -1;
    }

    return 0;
  });
}

export function buildOutfitItemSubcategoryOptions(category: string) {
  return sortSubcategoryOptions([...getItemSubcategoryOptions(category)]);
}

export function buildAvailableOutfitItemSubcategoryOptions(
  items: ItemRecord[],
  category: string,
) {
  if (!category) {
    return [];
  }

  const availableValues = new Set(
    items
      .filter((item) => resolveOutfitItemCategory(item) === category)
      .map((item) => resolveOutfitItemSubcategory(item))
      .filter((value): value is string => value !== ""),
  );

  return sortSubcategoryOptions(
    getItemSubcategoryOptions(category).filter((option) =>
      availableValues.has(option.value),
    ),
  );
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
    const currentCategory = resolveOutfitItemCategory(item);
    const currentSubcategory = resolveOutfitItemSubcategory(item);
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
    const matchesSeason = matchesSeasonFilter(item.seasons, filters.season);
    const matchesTpo =
      filters.tpo === "" ||
      normalizeStringList(item.tpos).includes(filters.tpo);

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
