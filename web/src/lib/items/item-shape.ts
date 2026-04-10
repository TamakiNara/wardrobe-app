export function normalizeItemShapeValue(shape?: string | null) {
  return typeof shape === "string" ? shape.trim() : "";
}

export function isBlankItemShape(shape?: string | null) {
  return normalizeItemShapeValue(shape) === "";
}
