import { resolveCurrentItemCategoryValue } from "@/lib/api/categories";

export const ITEM_SUBCATEGORIES = {
  tops: [
    { value: "tshirt_cutsew", label: "Tシャツ・カットソー" },
    { value: "shirt_blouse", label: "シャツ・ブラウス" },
    { value: "knit_sweater", label: "ニット・セーター" },
    { value: "cardigan", label: "カーディガン" },
    { value: "polo_shirt", label: "ポロシャツ" },
    { value: "sweat_trainer", label: "スウェット・トレーナー" },
    { value: "hoodie", label: "パーカー・フーディー" },
    { value: "vest_gilet", label: "ベスト・ジレ" },
    { value: "camisole", label: "キャミソール" },
    { value: "tanktop", label: "タンクトップ・ノースリーブ" },
    { value: "other", label: "その他トップス" },
  ],
  pants: [
    { value: "pants", label: "パンツ" },
    { value: "denim", label: "ジーンズ・デニムパンツ" },
    { value: "slacks", label: "スラックス・ドレスパンツ" },
    { value: "cargo", label: "カーゴパンツ" },
    { value: "chino", label: "チノパンツ" },
    { value: "sweat_jersey", label: "ジャージ・スウェットパンツ" },
    { value: "other", label: "その他パンツ" },
  ],
  skirts: [
    { value: "skirt", label: "スカート" },
    { value: "other", label: "その他スカート" },
  ],
  outerwear: [
    { value: "jacket", label: "ジャケット" },
    { value: "coat", label: "コート" },
    { value: "blouson", label: "ブルゾン" },
    { value: "down_padded", label: "ダウンジャケット・中綿ジャケット" },
    { value: "mountain_parka", label: "マウンテンパーカー" },
    { value: "other", label: "その他アウター" },
  ],
  onepiece_dress: [
    { value: "onepiece", label: "ワンピース" },
    { value: "dress", label: "ドレス" },
    { value: "other", label: "その他ワンピース・ドレス" },
  ],
  allinone: [
    { value: "allinone", label: "オールインワン" },
    { value: "salopette", label: "サロペット" },
    { value: "other", label: "その他オールインワン" },
  ],
  bags: [
    { value: "tote", label: "トートバッグ" },
    { value: "shoulder", label: "ショルダーバッグ" },
    { value: "backpack", label: "リュック" },
    { value: "hand", label: "ハンドバッグ" },
    { value: "clutch", label: "クラッチバッグ" },
    { value: "body", label: "ボディバッグ" },
    { value: "other", label: "その他バッグ" },
  ],
  shoes: [
    { value: "shoes", label: "シューズ" },
    { value: "other", label: "その他シューズ" },
  ],
  swimwear: [
    { value: "swimwear", label: "水着" },
    { value: "rashguard", label: "ラッシュガード" },
    { value: "other", label: "その他水着" },
  ],
  kimono: [
    { value: "kimono", label: "着物" },
    { value: "other", label: "その他着物" },
  ],
} as const;

export type ItemSubcategoryCategory = keyof typeof ITEM_SUBCATEGORIES;

export const REQUIRED_SUBCATEGORY_CATEGORIES = new Set<string>([
  "tops",
  "pants",
  "outerwear",
  "onepiece_dress",
  "allinone",
  "bags",
]);

const RADIO_SUBCATEGORY_UI_CATEGORIES = new Set<string>([
  "skirts",
  "shoes",
  "kimono",
]);

const REPRESENTATIVE_SUBCATEGORY_BY_CATEGORY: Record<string, string> = {
  skirts: "skirt",
  shoes: "shoes",
  kimono: "kimono",
};

const LEGACY_INFERRED_SUBCATEGORY_BY_CATEGORY: Record<
  string,
  Record<string, string>
> = {
  tops: {
    tshirt: "tshirt_cutsew",
    shirt: "shirt_blouse",
    blouse: "shirt_blouse",
    knit: "knit_sweater",
    cardigan: "cardigan",
    camisole: "camisole",
    tanktop: "tanktop",
  },
  pants: {
    pants: "pants",
    denim: "denim",
    slacks: "slacks",
    "short-pants": "pants",
    straight: "pants",
    tapered: "pants",
    wide: "pants",
    culottes: "pants",
    other: "other",
  },
  skirts: {
    skirt: "skirt",
    tight: "skirt",
    flare: "skirt",
    a_line: "skirt",
    pleated: "skirt",
    other: "other",
  },
  outerwear: {
    jacket: "jacket",
    tailored: "jacket",
    coat: "coat",
    trench: "coat",
    chester: "coat",
    blouson: "blouson",
    "outer-cardigan": "blouson",
    "down-padded": "down_padded",
    down: "down_padded",
    "mountain-parka": "mountain_parka",
    other: "other",
  },
  onepiece_dress: {
    onepiece: "onepiece",
    dress: "dress",
    other: "other",
  },
  allinone: {
    allinone: "allinone",
    salopette: "salopette",
    other: "other",
  },
  bags: {
    tote: "tote",
    shoulder: "shoulder",
    backpack: "backpack",
    hand: "hand",
    clutch: "clutch",
    body: "body",
    other: "other",
  },
  shoes: {
    sneakers: "shoes",
    pumps: "shoes",
    "short-boots": "shoes",
    sandals: "shoes",
    other: "other",
  },
  swimwear: {
    swimwear: "swimwear",
    rashguard: "rashguard",
    other: "other",
  },
  kimono: {
    kimono: "kimono",
    other: "other",
  },
};

const DEFAULT_SHAPE_BY_SUBCATEGORY: Record<string, Record<string, string>> = {
  tops: {
    tshirt_cutsew: "tshirt",
    shirt_blouse: "shirt",
    knit_sweater: "knit",
    cardigan: "cardigan",
    polo_shirt: "shirt",
    sweat_trainer: "tshirt",
    hoodie: "tshirt",
    vest_gilet: "camisole",
    camisole: "camisole",
    tanktop: "tanktop",
    other: "tshirt",
  },
  pants: {
    pants: "pants",
    denim: "pants",
    slacks: "pants",
    cargo: "pants",
    chino: "pants",
    sweat_jersey: "pants",
    other: "pants",
  },
  skirts: {
    skirt: "skirt",
    other: "skirt",
  },
  outerwear: {
    jacket: "jacket",
    coat: "coat",
    blouson: "blouson",
    down_padded: "down-padded",
    mountain_parka: "mountain-parka",
    other: "jacket",
  },
  onepiece_dress: {
    onepiece: "onepiece",
    dress: "dress",
    other: "onepiece",
  },
  allinone: {
    allinone: "allinone",
    salopette: "salopette",
    other: "allinone",
  },
  bags: {
    tote: "tote",
    shoulder: "shoulder",
    backpack: "backpack",
    hand: "hand",
    clutch: "clutch",
    body: "body",
    other: "bag",
  },
  shoes: {
    shoes: "sneakers",
    other: "sneakers",
  },
  kimono: {
    kimono: "kimono",
    other: "kimono",
  },
};

export function getItemSubcategoryOptions(category?: string | null) {
  if (!category) {
    return [];
  }

  return ITEM_SUBCATEGORIES[category as ItemSubcategoryCategory] ?? [];
}

export function isItemSubcategoryRequired(category?: string | null) {
  return Boolean(category && REQUIRED_SUBCATEGORY_CATEGORIES.has(category));
}

export function shouldShowItemSubcategoryField(category?: string | null) {
  return Boolean(category && getItemSubcategoryOptions(category).length > 0);
}

export function shouldUseItemSubcategoryRadioField(category?: string | null) {
  return Boolean(category && RADIO_SUBCATEGORY_UI_CATEGORIES.has(category));
}

export function normalizeItemSubcategory(
  category?: string | null,
  subcategory?: string | null,
) {
  if (!category || !subcategory) {
    return null;
  }

  const normalized = subcategory.trim();

  if (!normalized) {
    return null;
  }

  const options = getItemSubcategoryOptions(category);

  if (!options.some((item) => item.value === normalized)) {
    return null;
  }

  return normalized;
}

export function inferLegacyItemSubcategory(
  category?: string | null,
  shape?: string | null,
) {
  const currentCategory = resolveCurrentItemCategoryValue(category, shape);

  if (!currentCategory || !shape) {
    return null;
  }

  return (
    LEGACY_INFERRED_SUBCATEGORY_BY_CATEGORY[currentCategory]?.[shape] ?? null
  );
}

export function resolveCurrentItemSubcategoryValue(
  category?: string | null,
  shape?: string | null,
  subcategory?: string | null,
) {
  const currentCategory = resolveCurrentItemCategoryValue(category, shape);

  if (!currentCategory) {
    return null;
  }

  return (
    normalizeItemSubcategory(currentCategory, subcategory) ??
    inferLegacyItemSubcategory(category, shape)
  );
}

export function resolveItemSubcategoryForForm(
  category?: string | null,
  subcategory?: string | null,
) {
  const normalized = normalizeItemSubcategory(category, subcategory);

  if (normalized) {
    return normalized;
  }

  if (!category) {
    return null;
  }

  return REPRESENTATIVE_SUBCATEGORY_BY_CATEGORY[category] ?? null;
}

export function findItemSubcategoryLabel(
  category?: string | null,
  subcategory?: string | null,
) {
  const normalized = normalizeItemSubcategory(category, subcategory);

  if (!category || !normalized) {
    return "";
  }

  return (
    getItemSubcategoryOptions(category).find(
      (item) => item.value === normalized,
    )?.label ?? normalized
  );
}

export function resolveDefaultShapeForSubcategory(
  category?: string | null,
  subcategory?: string | null,
) {
  if (!category || !subcategory) {
    return null;
  }

  return DEFAULT_SHAPE_BY_SUBCATEGORY[category]?.[subcategory] ?? null;
}
