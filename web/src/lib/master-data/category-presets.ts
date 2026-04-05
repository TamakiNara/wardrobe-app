import type { CategoryGroupRecord } from "@/types/categories";

export const CATEGORY_PRESET_OPTIONS = [
  {
    value: "male",
    label: "メンズ",
    description: "一部のカテゴリをOFFにした状態で始めます。",
  },
  {
    value: "female",
    label: "レディース",
    description: "すべてのカテゴリをONで始めます。",
  },
  {
    value: "custom",
    label: "カスタム",
    description: "使用するカテゴリを自分で選んで始めます。",
  },
] as const;

export type CategoryPresetValue =
  (typeof CATEGORY_PRESET_OPTIONS)[number]["value"];

const MALE_HIDDEN_GROUP_IDS = new Set(["skirts", "onepiece_dress", "allinone"]);
const MALE_HIDDEN_CATEGORY_IDS = new Set(["shoes_pumps"]);

export function collectAllCategoryIds(groups: CategoryGroupRecord[]): string[] {
  return groups
    .flatMap((group) => group.categories.map((category) => category.id))
    .sort();
}

export function buildVisibleCategoryIdsForPreset(
  groups: CategoryGroupRecord[],
  preset: Exclude<CategoryPresetValue, "custom">,
): string[] {
  const allCategoryIds = collectAllCategoryIds(groups);

  if (preset === "male") {
    const hiddenCategoryIds = new Set([
      ...groups
        .filter((group) => MALE_HIDDEN_GROUP_IDS.has(group.id))
        .flatMap((group) => group.categories.map((category) => category.id)),
      ...MALE_HIDDEN_CATEGORY_IDS,
    ]);

    return allCategoryIds.filter(
      (categoryId) => !hiddenCategoryIds.has(categoryId),
    );
  }

  return allCategoryIds;
}
