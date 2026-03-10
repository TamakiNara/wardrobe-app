export const TOPS_SLEEVES = [
  { value: "short", label: "半袖" },
  { value: "five", label: "五分袖" },
  { value: "seven", label: "七分袖" },
  { value: "long", label: "長袖" },
  { value: "sleeveless", label: "ノースリーブ" },
  { value: "french", label: "フレンチスリーブ" },
  { value: "camisole", label: "キャミソール" },
] as const;

export type TopsSleeveValue =
  (typeof TOPS_SLEEVES)[number]["value"];
