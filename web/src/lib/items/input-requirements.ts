import { getItemShapeOptions } from "@/lib/master-data/item-shapes";
import { getTopsShapeOptions } from "@/lib/master-data/item-tops";
import { normalizeItemSubcategory } from "@/lib/master-data/item-subcategories";
import { resolveDefaultShapeForSubcategory } from "@/lib/items/current-item-read-model";

const ALWAYS_HIDDEN_SHAPE_FIELD_CATEGORIES = new Set([
  "allinone",
  "bags",
  "fashion_accessories",
  "shoes",
  "legwear",
  "swimwear",
  "kimono",
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
  swimwear: "swimwear",
  kimono: "kimono",
};

function getShapeCandidateValues(
  category?: string | null,
  subcategory?: string | null,
) {
  if (!category) {
    return [];
  }

  const normalizedSubcategory = normalizeItemSubcategory(category, subcategory);

  if (!normalizedSubcategory) {
    return [];
  }

  if (category === "tops" && normalizedSubcategory === "other") {
    return [];
  }

  if (category === "tops") {
    return getTopsShapeOptions(normalizedSubcategory).map((item) => item.value);
  }

  return getItemShapeOptions(category, normalizedSubcategory).map(
    (item) => item.value,
  );
}

function hasResolvedShapeCandidates(
  category?: string | null,
  subcategory?: string | null,
) {
  return getShapeCandidateValues(category, subcategory).length > 0;
}

function hasMultipleShapeCandidates(
  category?: string | null,
  subcategory?: string | null,
) {
  return getShapeCandidateValues(category, subcategory).length > 1;
}

export function isItemShapeRequired(
  category?: string | null,
  subcategory?: string | null,
) {
  if (!category) {
    return false;
  }

  if (!shouldShowItemShapeField(category, subcategory)) {
    return false;
  }

  return hasMultipleShapeCandidates(category, subcategory);
}

export function shouldShowItemShapeField(
  category?: string | null,
  subcategory?: string | null,
) {
  if (!category) {
    return false;
  }

  if (ALWAYS_HIDDEN_SHAPE_FIELD_CATEGORIES.has(category)) {
    return false;
  }

  if (!hasResolvedShapeCandidates(category, subcategory)) {
    return false;
  }

  return hasMultipleShapeCandidates(category, subcategory);
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
