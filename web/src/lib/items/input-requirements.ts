import { resolveItemClassification } from "@/lib/items/classification";

export function isItemShapeRequired(
  category?: string | null,
  subcategory?: string | null,
) {
  return resolveItemClassification({
    category,
    subcategory,
  }).isShapeRequired;
}

export function shouldShowItemShapeField(
  category?: string | null,
  subcategory?: string | null,
) {
  return resolveItemClassification({
    category,
    subcategory,
  }).shouldShowShapeField;
}

export function resolveItemShapeForSubmit(
  category?: string | null,
  subcategory?: string | null,
  shape?: string | null,
) {
  return resolveItemClassification({
    category,
    subcategory,
    shape,
  }).shape;
}
