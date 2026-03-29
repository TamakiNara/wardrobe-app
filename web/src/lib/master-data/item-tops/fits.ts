export const TOPS_FITS = [
  { value: "normal", label: "標準" },
  { value: "oversized", label: "オーバーサイズ" },
] as const;

export type TopsFitValue = (typeof TOPS_FITS)[number]["value"];

export const DEFAULT_TOPS_FIT: TopsFitValue = "normal";
