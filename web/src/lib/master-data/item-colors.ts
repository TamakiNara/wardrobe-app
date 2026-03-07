export const ITEM_COLORS = [
  { value: "black", label: "ブラック", hex: "#111111" },
  { value: "white", label: "ホワイト", hex: "#F5F5F5" },
  { value: "navy", label: "ネイビー", hex: "#1F3A5F" },
  { value: "gray", label: "グレー", hex: "#9CA3AF" },
  { value: "beige", label: "ベージュ", hex: "#D6C1A3" },
  { value: "brown", label: "ブラウン", hex: "#7C4A2D" },
  { value: "khaki", label: "カーキ", hex: "#6B7A3A" },
  { value: "blue", label: "ブルー", hex: "#3B82F6" },
  { value: "green", label: "グリーン", hex: "#22C55E" },
  { value: "red", label: "レッド", hex: "#EF4444" },
  { value: "pink", label: "ピンク", hex: "#EC4899" },
  { value: "purple", label: "パープル", hex: "#8B5CF6" },
] as const;

export type ItemColorValue = (typeof ITEM_COLORS)[number]["value"];
