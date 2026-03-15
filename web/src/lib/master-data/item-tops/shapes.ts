export const TOPS_SHAPES = [
  { value: "tshirt", label: "Tシャツ/カットソー" },
  { value: "shirt", label: "シャツ" },
  { value: "blouse", label: "ブラウス" },
  { value: "knit", label: "ニット/セーター" },
  { value: "cardigan", label: "カーディガン" },
  { value: "camisole", label: "キャミソール" },
  { value: "tanktop", label: "タンクトップ" },
] as const;

export type TopsShapeValue = (typeof TOPS_SHAPES)[number]["value"];
