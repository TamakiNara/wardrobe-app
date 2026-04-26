import { getItemShapeOptions } from "@/lib/master-data/item-shapes";
import { getTopsShapeOptions } from "@/lib/master-data/item-tops";
import { normalizeItemSubcategory } from "@/lib/master-data/item-subcategories";
import { resolveDefaultShapeForSubcategory } from "@/lib/items/current-item-read-model";
import { PURCHASE_CANDIDATE_ITEM_CATEGORY_MAP } from "@/lib/purchase-candidates/category-map";

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

type ItemClassificationInput = {
  category?: string | null;
  subcategory?: string | null;
  shape?: string | null;
};

export type ItemClassificationModel = {
  category: string | null;
  subcategory: string | null;
  shape: string;
  inputShape: string;
  defaultShape: string;
  shapeCandidates: string[];
  hasResolvedShapeCandidates: boolean;
  hasMultipleShapeCandidates: boolean;
  shouldShowShapeField: boolean;
  isShapeRequired: boolean;
  isShapeResolved: boolean;
};

function normalizeShapeValue(shape?: string | null) {
  return typeof shape === "string" ? shape.trim() : "";
}

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

function resolveDefaultShape(
  category?: string | null,
  subcategory?: string | null,
) {
  return (
    resolveDefaultShapeForSubcategory(category, subcategory) ??
    (category ? (FALLBACK_SHAPE_BY_CATEGORY[category] ?? "") : "")
  );
}

export function resolveItemClassification(
  input: ItemClassificationInput,
): ItemClassificationModel {
  const category = input.category ?? null;
  const subcategory = normalizeItemSubcategory(category, input.subcategory);
  const inputShape = normalizeShapeValue(input.shape);
  const shapeCandidates = getShapeCandidateValues(category, subcategory);
  const hasResolvedShapeCandidates = shapeCandidates.length > 0;
  const hasMultipleShapeCandidates = shapeCandidates.length > 1;
  const shouldShowShapeField = Boolean(
    category &&
    !ALWAYS_HIDDEN_SHAPE_FIELD_CATEGORIES.has(category) &&
    hasResolvedShapeCandidates &&
    hasMultipleShapeCandidates,
  );
  const isShapeRequired = shouldShowShapeField;
  const defaultShape = resolveDefaultShape(category, subcategory);
  const shape = (() => {
    if (inputShape) {
      return inputShape;
    }

    if (
      (category === "tops" && subcategory === "other") ||
      (category === "skirts" && subcategory === "other")
    ) {
      return "";
    }

    if (isShapeRequired) {
      return "";
    }

    return defaultShape;
  })();

  return {
    category,
    subcategory,
    shape,
    inputShape,
    defaultShape,
    shapeCandidates,
    hasResolvedShapeCandidates,
    hasMultipleShapeCandidates,
    shouldShowShapeField,
    isShapeRequired,
    isShapeResolved: shape !== "",
  };
}

export function resolvePurchaseCandidateItemClassification(
  categoryId?: string | null,
) {
  if (!categoryId) {
    return null;
  }

  const resolvedCategory =
    PURCHASE_CANDIDATE_ITEM_CATEGORY_MAP[
      categoryId as keyof typeof PURCHASE_CANDIDATE_ITEM_CATEGORY_MAP
    ] ?? null;

  if (!resolvedCategory) {
    return null;
  }

  return resolveItemClassification(resolvedCategory);
}
