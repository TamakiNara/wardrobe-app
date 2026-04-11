export const BOTTOMS_LENGTH_OPTIONS = [
  { value: "mini", label: "ミニ丈" },
  { value: "short", label: "ショート丈" },
  { value: "half", label: "ハーフ丈" },
  { value: "cropped", label: "クロップド丈" },
  { value: "ankle", label: "アンクル丈" },
  { value: "full", label: "フルレングス" },
] as const;

export const BOTTOMS_RISE_OPTIONS = [
  { value: "high_waist", label: "ハイウエスト" },
  { value: "low_rise", label: "ローライズ" },
] as const;

export const LEGWEAR_COVERAGE_OPTIONS = [
  { value: "foot_cover", label: "フットカバー" },
  { value: "ankle_sneaker", label: "アンクル・スニーカーソックス" },
  { value: "crew", label: "クルーソックス" },
  { value: "three_quarter", label: "スリークォーターソックス" },
  { value: "high_socks", label: "ハイソックス" },
  { value: "stockings", label: "ストッキング" },
  { value: "tights", label: "タイツ" },
  { value: "one_tenth", label: "1分丈" },
  { value: "three_tenths", label: "3分丈" },
  { value: "five_tenths", label: "5分丈" },
  { value: "seven_tenths", label: "7分丈（カプリ丈）" },
  { value: "seven_eighths", label: "7/8丈（エイス丈）" },
  { value: "ten_tenths", label: "10分丈（アンクル丈）" },
  { value: "twelve_tenths", label: "12分丈" },
] as const;

export type BottomsLengthType =
  (typeof BOTTOMS_LENGTH_OPTIONS)[number]["value"];
export type BottomsRiseType = (typeof BOTTOMS_RISE_OPTIONS)[number]["value"];
export type LegwearCoverageType =
  (typeof LEGWEAR_COVERAGE_OPTIONS)[number]["value"];
export type LegwearPreviewCoverageType =
  | LegwearCoverageType
  | "full_length_fallback";

const SOCKS_COVERAGE_TYPES = [
  "foot_cover",
  "ankle_sneaker",
  "crew",
  "three_quarter",
  "high_socks",
] as const;
const LEGGINGS_COVERAGE_TYPES = [
  "one_tenth",
  "three_tenths",
  "five_tenths",
  "seven_tenths",
  "seven_eighths",
  "ten_tenths",
  "twelve_tenths",
] as const;
const BOTTOMS_LENGTH_TYPES = BOTTOMS_LENGTH_OPTIONS.map(
  (item) => item.value,
) as readonly BottomsLengthType[];
const BOTTOMS_RISE_TYPES = BOTTOMS_RISE_OPTIONS.map(
  (item) => item.value,
) as readonly BottomsRiseType[];

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

export function isBottomsRiseTypeSupported(category?: string | null) {
  return category === "pants";
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
    if (
      SOCKS_COVERAGE_TYPES.includes(
        value as (typeof SOCKS_COVERAGE_TYPES)[number],
      )
    ) {
      return value;
    }

    return (
      {
        ankle_socks: "ankle_sneaker",
        crew_socks: "crew",
        knee_socks: "high_socks",
        over_knee: "high_socks",
      }[value ?? ""] ?? null
    );
  }

  if (resolvedShape === "leggings") {
    if (
      LEGGINGS_COVERAGE_TYPES.includes(
        value as (typeof LEGGINGS_COVERAGE_TYPES)[number],
      )
    ) {
      return value;
    }

    return (
      {
        leggings_cropped: "seven_tenths",
        leggings_full: "ten_tenths",
      }[value ?? ""] ?? null
    );
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

export function getLegwearCoverageFieldLabel(
  shape?: string | null,
  subcategory?: string | null,
) {
  const resolvedShape = resolveLegwearShapeKind(shape, subcategory);

  if (resolvedShape === "leggings") {
    return "レギンス・スパッツの長さ";
  }

  if (resolvedShape === "socks") {
    return "ソックスの長さ";
  }

  return "長さ";
}

export function getLegwearCoveragePlaceholder(
  _shape?: string | null,
  _subcategory?: string | null,
) {
  void _shape;
  void _subcategory;
  return "選択してください";
}

function resolveLegwearShapeKind(
  shape?: string | null,
  subcategory?: string | null,
) {
  if (
    subcategory === "socks" ||
    subcategory === "stockings" ||
    subcategory === "tights" ||
    subcategory === "leggings" ||
    subcategory === "leg_warmer"
  ) {
    return subcategory === "leg_warmer" ? "leg-warmer" : subcategory;
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
    }[value ?? ""] ?? null
  );
}

export function resolveBottomsRiseType(
  category?: string | null,
  value?: string | null,
) {
  if (!isBottomsRiseTypeSupported(category)) {
    return null;
  }

  return BOTTOMS_RISE_TYPES.includes(value as BottomsRiseType) ? value : null;
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
