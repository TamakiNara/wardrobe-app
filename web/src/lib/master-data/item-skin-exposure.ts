export const BOTTOMS_LENGTH_OPTIONS = [
  { value: "mini", label: "ミニ丈" },
  { value: "knee", label: "ひざ丈" },
  { value: "midi", label: "ミディ丈" },
  { value: "ankle", label: "アンクル丈" },
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
) {
  if (!isLegwearSpecCategory(category)) return false;
  return shape === "socks" || shape === "leggings";
}

export function shouldShowLegwearCoverageSelect(
  category?: string | null,
  shape?: string | null,
) {
  if (!isLegwearSpecCategory(category)) return false;
  return shape === "socks" || shape === "leggings";
}

export function getLegwearCoverageOptions(shape?: string | null) {
  if (shape === "socks") {
    return LEGWEAR_COVERAGE_OPTIONS.filter((item) =>
      SOCKS_COVERAGE_TYPES.includes(
        item.value as (typeof SOCKS_COVERAGE_TYPES)[number],
      ),
    );
  }

  if (shape === "leggings") {
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
) {
  if (!isLegwearSpecCategory(category)) return null;

  if (shape === "stockings") return "stockings";
  if (shape === "tights") return "tights";

  if (shape === "socks") {
    return SOCKS_COVERAGE_TYPES.includes(
      value as (typeof SOCKS_COVERAGE_TYPES)[number],
    )
      ? value
      : null;
  }

  if (shape === "leggings") {
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
): LegwearPreviewCoverageType | null {
  if (!isLegwearSpecCategory(category)) return null;

  const resolved = resolveLegwearCoverageType(category, shape, value);
  return resolved
    ? (resolved as LegwearPreviewCoverageType)
    : "full_length_fallback";
}

export function resolveBottomsLengthType(value?: string | null) {
  return BOTTOMS_LENGTH_TYPES.includes(value as BottomsLengthType)
    ? value
    : null;
}

export function resolveBottomsLengthTypeForPreview(value?: string | null) {
  return resolveBottomsLengthType(value) ?? "full";
}

export function findBottomsLengthLabel(value?: string | null) {
  if (!value) return "";
  return (
    BOTTOMS_LENGTH_OPTIONS.find((item) => item.value === value)?.label ?? value
  );
}

export function findLegwearCoverageLabel(value?: string | null) {
  if (!value) return "";
  return (
    LEGWEAR_COVERAGE_OPTIONS.find((item) => item.value === value)?.label ??
    value
  );
}
