import { getItemShapeOptions } from "@/lib/master-data/item-shapes";
import { normalizeItemSubcategory } from "@/lib/master-data/item-subcategories";
import { resolveDefaultShapeForSubcategory } from "@/lib/items/current-item-read-model";

const OPTIONAL_SHAPE_WITH_EMPTY_SUBCATEGORY = new Set([
  "tops",
  "pants",
  "outerwear",
  "onepiece_dress",
  "allinone",
  "inner",
  "skirts",
  "bags",
  "fashion_accessories",
  "shoes",
  "legwear",
  "kimono",
]);
const OPTIONAL_SHAPE_WITH_OTHER_SUBCATEGORY = new Set([
  "tops",
  "pants",
  "outerwear",
  "onepiece_dress",
  "allinone",
  "inner",
  "skirts",
  "bags",
  "fashion_accessories",
  "shoes",
  "legwear",
  "kimono",
]);
const HIDDEN_SHAPE_FIELD_WITH_OTHER_SUBCATEGORY = new Set([
  "tops",
  "pants",
  "outerwear",
  "skirts",
]);
const FALLBACK_SHAPE_BY_CATEGORY: Record<string, string> = {
  tops: "tshirt",
  pants: "pants",
  skirts: "skirt",
  outerwear: "jacket",
  onepiece_dress: "onepiece",
  allinone: "allinone",
  inner: "roomwear",
  bags: "bag",
  fashion_accessories: "other",
  shoes: "other",
  legwear: "socks",
  kimono: "kimono",
};

export function isItemShapeRequired(
  category?: string | null,
  subcategory?: string | null,
) {
  if (!category) {
    return false;
  }

  const normalizedSubcategory = normalizeItemSubcategory(category, subcategory);

  if (!normalizedSubcategory) {
    return !OPTIONAL_SHAPE_WITH_EMPTY_SUBCATEGORY.has(category);
  }

  if (
    normalizedSubcategory === "other" &&
    OPTIONAL_SHAPE_WITH_OTHER_SUBCATEGORY.has(category)
  ) {
    return false;
  }

  return getItemShapeOptions(category, normalizedSubcategory).length > 1;
}

export function shouldShowItemShapeField(
  category?: string | null,
  subcategory?: string | null,
) {
  if (!category) {
    return true;
  }

  const normalizedSubcategory = normalizeItemSubcategory(category, subcategory);

  return !(
    normalizedSubcategory === "other" &&
    HIDDEN_SHAPE_FIELD_WITH_OTHER_SUBCATEGORY.has(category)
  );
}

export function resolveItemShapeForSubmit(
  category?: string | null,
  subcategory?: string | null,
  shape?: string | null,
) {
  const normalizedShape = typeof shape === "string" ? shape.trim() : "";

  if (normalizedShape) {
    return normalizedShape;
  }

  const normalizedSubcategory = normalizeItemSubcategory(category, subcategory);

  if (category === "tops" && normalizedSubcategory === "other") {
    return "";
  }

  if (isItemShapeRequired(category, normalizedSubcategory)) {
    return "";
  }

  return (
    resolveDefaultShapeForSubcategory(category, normalizedSubcategory) ??
    (category ? (FALLBACK_SHAPE_BY_CATEGORY[category] ?? "") : "")
  );
}
