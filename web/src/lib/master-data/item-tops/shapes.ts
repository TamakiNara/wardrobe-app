export const TOPS_SHAPES = [
  { value: "tshirt", label: "Tシャツ/カットソー" },
  { value: "shirt", label: "シャツ" },
  { value: "blouse", label: "ブラウス" },
  { value: "polo", label: "ポロシャツ" },
  { value: "sweatshirt", label: "スウェット・トレーナー" },
  { value: "hoodie", label: "パーカー" },
  { value: "knit", label: "ニット/セーター" },
  { value: "cardigan", label: "カーディガン" },
  { value: "vest", label: "ベスト・ジレ" },
  { value: "camisole", label: "キャミソール" },
  { value: "tanktop", label: "タンクトップ" },
] as const;

export type TopsShapeValue = (typeof TOPS_SHAPES)[number]["value"];

const TOPS_SHAPE_VALUES_BY_SUBCATEGORY: Record<string, TopsShapeValue[]> = {
  tshirt_cutsew: ["tshirt"],
  shirt_blouse: ["shirt", "blouse"],
  knit_sweater: ["knit"],
  cardigan: ["cardigan"],
  polo_shirt: ["polo"],
  sweat_trainer: ["sweatshirt"],
  hoodie: ["hoodie"],
  vest_gilet: ["vest"],
  camisole: ["camisole"],
  tanktop: ["tanktop"],
  other: [],
};

export function getTopsShapeOptions(subcategory?: string | null) {
  if (!subcategory) {
    return TOPS_SHAPES;
  }

  const allowedValues = TOPS_SHAPE_VALUES_BY_SUBCATEGORY[subcategory];

  if (!allowedValues) {
    return TOPS_SHAPES;
  }

  if (allowedValues.length === 0) {
    return TOPS_SHAPES;
  }

  return TOPS_SHAPES.filter((item) => allowedValues.includes(item.value));
}
