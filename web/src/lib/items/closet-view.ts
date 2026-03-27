import {
  findItemCategoryLabel,
  findItemShapeLabel,
  ITEM_SHAPES,
} from "@/lib/master-data/item-shapes";
import type { CategoryOption } from "@/types/categories";
import type { ItemRecord } from "@/types/items";

type ClosetItemColorKey =
  | {
      hasColor: false;
      achromatic: true;
      hue: number;
      lightness: number;
    }
  | {
      hasColor: true;
      achromatic: boolean;
      hue: number;
      lightness: number;
    };

export type ClosetViewGroup = {
  category: string;
  label: string;
  shapeGroups: Array<{
    shape: string;
    label: string;
    items: ItemRecord[];
  }>;
};

function parseHexColor(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return [red, green, blue];
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return { hue: hue * 60, saturation, lightness };
}

function buildColorKey(item: ItemRecord): ClosetItemColorKey {
  const mainColor = item.colors.find((color) => color.role === "main");

  if (!mainColor?.hex) {
    return {
      hasColor: false,
      achromatic: true,
      hue: Number.POSITIVE_INFINITY,
      lightness: Number.POSITIVE_INFINITY,
    };
  }

  const rgb = parseHexColor(mainColor.hex);

  if (!rgb) {
    return {
      hasColor: false,
      achromatic: true,
      hue: Number.POSITIVE_INFINITY,
      lightness: Number.POSITIVE_INFINITY,
    };
  }

  const { hue, saturation, lightness } = rgbToHsl(...rgb);

  return {
    hasColor: true,
    achromatic: saturation <= 0.1,
    hue,
    lightness,
  };
}

function compareClosetItems(left: ItemRecord, right: ItemRecord): number {
  const leftKey = buildColorKey(left);
  const rightKey = buildColorKey(right);

  if (leftKey.hasColor !== rightKey.hasColor) {
    return leftKey.hasColor ? -1 : 1;
  }

  if (leftKey.achromatic !== rightKey.achromatic) {
    return leftKey.achromatic ? -1 : 1;
  }

  if (leftKey.achromatic && rightKey.achromatic) {
    if (leftKey.lightness !== rightKey.lightness) {
      return leftKey.lightness - rightKey.lightness;
    }
  } else {
    if (leftKey.hue !== rightKey.hue) {
      return leftKey.hue - rightKey.hue;
    }

    if (leftKey.lightness !== rightKey.lightness) {
      return leftKey.lightness - rightKey.lightness;
    }
  }

  return left.id - right.id;
}

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
        items: [...shapeItems].sort(compareClosetItems),
      });
    });

    shapeMap.forEach((shapeItems, shape) => {
      if (!shapeItems.length || seenShapes.has(shape)) {
        return;
      }

      shapeGroups.push({
        shape,
        label: findItemShapeLabel(category, shape),
        items: [...shapeItems].sort(compareClosetItems),
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
