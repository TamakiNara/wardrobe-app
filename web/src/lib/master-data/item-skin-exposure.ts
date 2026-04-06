export const BOTTOMS_LENGTH_OPTIONS = [
  { value: "mini", label: "ミニ丈" },
  { value: "short", label: "ショート丈" },
  { value: "half", label: "ハーフ丈" },
  { value: "cropped", label: "クロップド丈" },
  { value: "full", label: "フルレングス" },
] as const;

export const LEGWEAR_COVERAGE_OPTIONS = [
  { value: "ankle_socks", label: "アンクルソックス" },
  { value: "crew_socks", label: "クルーソックス" },
  { value: "knee_socks", label: "ひざ下ソックス" },
  { value: "over_knee", label: "オーバーニー" },
  { value: "stockings", label: "ストッキング" },
  { value: "tights", label: "タイツ" },
  { value: "leggings_cropped", label: "レギンス（クロップド）" },
  { value: "leggings_full", label: "レギンス（フル）" },
] as const;

export type BottomsLengthType =
  (typeof BOTTOMS_LENGTH_OPTIONS)[number]["value"];
export type LegwearCoverageType =
  (typeof LEGWEAR_COVERAGE_OPTIONS)[number]["value"];
export type LegwearPreviewCoverageType =
  | LegwearCoverageType
  | "full_length_fallback";

const SOCKS_COVERAGE_TYPES = [
  "ankle_socks",
  "crew_socks",
  "knee_socks",
  "over_knee",
] as const;
const LEGGINGS_COVERAGE_TYPES = ["leggings_cropped", "leggings_full"] as const;
const BOTTOMS_LENGTH_TYPES = BOTTOMS_LENGTH_OPTIONS.map(
  (item) => item.value,
) as readonly BottomsLengthType[];

export function isBottomsSpecCategory(category?: string | null) {
  return (
    category === "bottoms" || category === "pants" || category === "skirts"
  );
}

export function isLegwearSpecCategory(category?: string | null) {
  return category === "legwear";
}

export function isBottomsLengthTypeRequired(category?: string | null) {
  return isBottomsSpecCategory(category);
}

export function isLegwearCoverageTypeRequired(
  category?: string | null,
  shape?: string | null,
  subcategory?: string | null,
) {
  if (!isLegwearSpecCategory(category)) return false;
  const resolvedShape = resolveLegwearShapeKind(shape, subcategory);
  return resolvedShape === "socks" || resolvedShape === "leggings";
}

export function shouldShowLegwearCoverageSelect(
  category?: string | null,
  shape?: string | null,
  subcategory?: string | null,
) {
  if (!isLegwearSpecCategory(category)) return false;
  const resolvedShape = resolveLegwearShapeKind(shape, subcategory);
  return resolvedShape === "socks" || resolvedShape === "leggings";
}

export function getLegwearCoverageOptions(
  shape?: string | null,
  subcategory?: string | null,
) {
  const resolvedShape = resolveLegwearShapeKind(shape, subcategory);

  if (resolvedShape === "socks") {
    return LEGWEAR_COVERAGE_OPTIONS.filter((item) =>
      SOCKS_COVERAGE_TYPES.includes(
        item.value as (typeof SOCKS_COVERAGE_TYPES)[number],
      ),
    );
  }

  if (resolvedShape === "leggings") {
    return LEGWEAR_COVERAGE_OPTIONS.filter((item) =>
      LEGGINGS_COVERAGE_TYPES.includes(
        item.value as (typeof LEGGINGS_COVERAGE_TYPES)[number],
      ),
    );
  }

  return [];
}

export function resolveLegwearCoverageType(
  category?: string | null,
  shape?: string | null,
  value?: string | null,
  subcategory?: string | null,
) {
  if (!isLegwearSpecCategory(category)) return null;

  const resolvedShape = resolveLegwearShapeKind(shape, subcategory);

  if (resolvedShape === "stockings") return "stockings";
  if (resolvedShape === "tights") return "tights";

  if (resolvedShape === "socks") {
    return SOCKS_COVERAGE_TYPES.includes(
      value as (typeof SOCKS_COVERAGE_TYPES)[number],
    )
      ? value
      : null;
  }

  if (resolvedShape === "leggings") {
    return LEGGINGS_COVERAGE_TYPES.includes(
      value as (typeof LEGGINGS_COVERAGE_TYPES)[number],
    )
      ? value
      : null;
  }

  return null;
}

export function resolveLegwearCoverageTypeForPreview(
  category?: string | null,
  shape?: string | null,
  value?: string | null,
  subcategory?: string | null,
): LegwearPreviewCoverageType | null {
  if (!isLegwearSpecCategory(category)) return null;

  const resolved = resolveLegwearCoverageType(
    category,
    shape,
    value,
    subcategory,
  );
  return resolved
    ? (resolved as LegwearPreviewCoverageType)
    : "full_length_fallback";
}

function resolveLegwearShapeKind(
  shape?: string | null,
  subcategory?: string | null,
) {
  if (
    subcategory === "socks" ||
    subcategory === "stockings" ||
    subcategory === "tights" ||
    subcategory === "leggings"
  ) {
    return subcategory;
  }

  if (subcategory === "other") {
    return "other";
  }

  return shape;
}

export function resolveBottomsLengthType(value?: string | null) {
  if (BOTTOMS_LENGTH_TYPES.includes(value as BottomsLengthType)) {
    return value;
  }

  return (
    {
      knee: "half",
      midi: "cropped",
      ankle: "full",
    }[value ?? ""] ?? null
  );
}

export function resolveBottomsLengthTypeForItem(
  category?: string | null,
  shape?: string | null,
  value?: string | null,
) {
  const resolved = resolveBottomsLengthType(value);
  if (resolved) {
    return resolved;
  }

  if (category === "bottoms") {
    if (shape === "mini-skirt") {
      return "mini";
    }

    return null;
  }

  if (category === "pants" && shape === "short-pants") {
    return "short";
  }

  return null;
}

export function resolveBottomsLengthTypeForPreview(value?: string | null) {
  return resolveBottomsLengthType(value) ?? "full";
}

export function findBottomsLengthLabel(value?: string | null) {
  if (!value) return "";
  const resolved = resolveBottomsLengthType(value);
  return (
    BOTTOMS_LENGTH_OPTIONS.find((item) => item.value === resolved)?.label ??
    value
  );
}

export function findLegwearCoverageLabel(value?: string | null) {
  if (!value) return "";
  return (
    LEGWEAR_COVERAGE_OPTIONS.find((item) => item.value === value)?.label ??
    value
  );
}
