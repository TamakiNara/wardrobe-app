import {
  findItemCategoryLabel,
  findItemShapeLabel,
  ITEM_SHAPES,
} from "@/lib/master-data/item-shapes";
import { compareByMainColorSort } from "@/lib/colors/main-color-order";
import type { CategoryOption } from "@/types/categories";
import type { ItemRecord } from "@/types/items";

export type ClosetViewGroup = {
  category: string;
  label: string;
  shapeGroups: Array<{
    shape: string;
    label: string;
    items: ItemRecord[];
  }>;
};

export function buildClosetViewGroups(
  items: ItemRecord[],
  categoryOptions: CategoryOption[],
): ClosetViewGroup[] {
  const activeItems = items.filter((item) => item.status === "active");
  const grouped = new Map<string, Map<string, ItemRecord[]>>();

  activeItems.forEach((item) => {
    const categoryMap = grouped.get(item.category) ?? new Map<string, ItemRecord[]>();
    const shapeKey = item.shape || "";
    const current = categoryMap.get(shapeKey) ?? [];
    current.push(item);
    categoryMap.set(shapeKey, current);
    grouped.set(item.category, categoryMap);
  });

  const seenCategories = new Set<string>();
  const groups: ClosetViewGroup[] = [];

  const buildShapeGroups = (category: string, shapeMap: Map<string, ItemRecord[]>) => {
    const knownShapes = ITEM_SHAPES[category as keyof typeof ITEM_SHAPES] ?? [];
    const seenShapes = new Set<string>();
    const shapeGroups: ClosetViewGroup["shapeGroups"] = [];

    knownShapes.forEach((shape) => {
      const shapeItems = shapeMap.get(shape.value);

      if (!shapeItems?.length) {
        return;
      }

      seenShapes.add(shape.value);
      shapeGroups.push({
        shape: shape.value,
        label: shape.label,
        items: [...shapeItems].sort(compareByMainColorSort),
      });
    });

    shapeMap.forEach((shapeItems, shape) => {
      if (!shapeItems.length || seenShapes.has(shape)) {
        return;
      }

      shapeGroups.push({
        shape,
        label: findItemShapeLabel(category, shape),
        items: [...shapeItems].sort(compareByMainColorSort),
      });
    });

    return shapeGroups;
  };

  categoryOptions.forEach((category) => {
    const shapeMap = grouped.get(category.value);

    if (!shapeMap?.size) {
      return;
    }

    seenCategories.add(category.value);
    groups.push({
      category: category.value,
      label: category.label,
      shapeGroups: buildShapeGroups(category.value, shapeMap),
    });
  });

  grouped.forEach((shapeMap, category) => {
    if (!shapeMap.size || seenCategories.has(category)) {
      return;
    }

    groups.push({
      category,
      label: findItemCategoryLabel(category),
      shapeGroups: buildShapeGroups(category, shapeMap),
    });
  });

  return groups;
}
