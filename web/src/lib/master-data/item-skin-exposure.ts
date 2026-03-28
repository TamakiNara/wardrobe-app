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

export type BottomsLengthType = (typeof BOTTOMS_LENGTH_OPTIONS)[number]["value"];
export type LegwearCoverageType = (typeof LEGWEAR_COVERAGE_OPTIONS)[number]["value"];

export function isBottomsSpecCategory(category?: string | null) {
  return category === "bottoms";
}

export function isLegwearSpecCategory(category?: string | null) {
  // Phase 1 では current master data に legwear 専用 category がないため、
  // inner category をレッグウェア入力の入口として扱う。
  return category === "inner";
}

export function findBottomsLengthLabel(value?: string | null) {
  if (!value) return "";
  return BOTTOMS_LENGTH_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function findLegwearCoverageLabel(value?: string | null) {
  if (!value) return "";
  return LEGWEAR_COVERAGE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}
