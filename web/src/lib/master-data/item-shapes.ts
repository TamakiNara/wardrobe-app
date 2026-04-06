export const ITEM_SHAPES = {
  tops: [
    { value: "tshirt", label: "Tシャツ/カットソー" },
    { value: "shirt", label: "シャツ" },
    { value: "blouse", label: "ブラウス" },
    { value: "knit", label: "ニット/セーター" },
    { value: "cardigan", label: "カーディガン" },
    { value: "camisole", label: "キャミソール" },
    { value: "tanktop", label: "タンクトップ" },
    { value: "jacket", label: "ジャケット" },
  ],
  pants: [
    { value: "pants", label: "パンツ" },
    { value: "straight", label: "ストレート" },
    { value: "tapered", label: "テーパード" },
    { value: "wide", label: "ワイド" },
    { value: "culottes", label: "キュロット" },
  ],
  skirts: [
    { value: "skirt", label: "スカート" },
    { value: "tight", label: "タイト" },
    { value: "flare", label: "フレア" },
    { value: "a_line", label: "Aライン" },
    { value: "pleated", label: "プリーツ" },
  ],
  bottoms: [
    { value: "tapered", label: "テーパード" },
    { value: "wide", label: "ワイドパンツ" },
    { value: "straight", label: "ストレート" },
    { value: "mini-skirt", label: "ミニスカート" },
    { value: "tight-skirt", label: "タイトスカート" },
    { value: "a-line-skirt", label: "Aラインスカート" },
    { value: "flare-skirt", label: "フレアスカート" },
  ],
  outerwear: [
    { value: "jacket", label: "ジャケット" },
    { value: "tailored", label: "テーラードジャケット" },
    { value: "no_collar", label: "ノーカラージャケット" },
    { value: "blouson", label: "ブルゾン" },
    { value: "down-padded", label: "ダウンジャケット・中綿ジャケット" },
    { value: "coat", label: "コート" },
    { value: "trench", label: "トレンチコート" },
    { value: "chester", label: "チェスターコート" },
    { value: "stainless", label: "ステンカラーコート" },
    { value: "mountain-parka", label: "マウンテンパーカー" },
    { value: "other", label: "その他アウター" },
  ],
  outer: [
    { value: "tailored", label: "テーラードジャケット" },
    { value: "outer-cardigan", label: "カーディガン（羽織）" },
    { value: "trench", label: "トレンチコート" },
    { value: "chester", label: "チェスターコート" },
    { value: "down", label: "ダウン" },
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
  onepiece_allinone: [
    { value: "onepiece", label: "ワンピース" },
    { value: "allinone", label: "オールインワン / サロペット" },
  ],
  inner: [
    { value: "roomwear", label: "ルームウェア" },
    { value: "underwear", label: "インナー" },
    { value: "pajamas", label: "パジャマ" },
  ],
  legwear: [
    { value: "socks", label: "ソックス" },
    { value: "stockings", label: "ストッキング" },
    { value: "tights", label: "タイツ" },
    { value: "leggings", label: "レギンス" },
  ],
  shoes: [
    { value: "pumps", label: "パンプス" },
    { value: "sneakers", label: "スニーカー" },
    { value: "short-boots", label: "ショートブーツ" },
    { value: "sandals", label: "サンダル" },
  ],
  bags: [
    { value: "bag", label: "バッグ" },
    { value: "tote", label: "トートバッグ" },
    { value: "shoulder", label: "ショルダーバッグ" },
    { value: "backpack", label: "リュック" },
    { value: "hand", label: "ハンドバッグ" },
    { value: "clutch", label: "クラッチバッグ" },
    { value: "body", label: "ボディバッグ" },
  ],
  fashion_accessories: [
    { value: "hat", label: "帽子" },
    { value: "belt", label: "ベルト" },
    { value: "scarf-stole", label: "マフラー・ストール" },
    { value: "gloves", label: "手袋" },
    { value: "jewelry", label: "アクセサリー" },
    { value: "wallet-case", label: "財布・カードケース" },
    { value: "hair-accessory", label: "ヘアアクセサリー" },
    { value: "eyewear", label: "眼鏡・サングラス" },
    { value: "watch", label: "腕時計" },
    { value: "other", label: "その他ファッション小物" },
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
  accessories: [
    { value: "tote", label: "トートバッグ" },
    { value: "shoulder", label: "ショルダーバッグ" },
    { value: "backpack", label: "リュック" },
    { value: "hat", label: "帽子" },
    { value: "accessory", label: "アクセサリー" },
  ],
} as const;

export const ITEM_CATEGORIES = [
  { value: "tops", label: "トップス" },
  { value: "outerwear", label: "ジャケット・アウター" },
  { value: "pants", label: "パンツ" },
  { value: "skirts", label: "スカート" },
  { value: "onepiece_dress", label: "ワンピース・ドレス" },
  { value: "allinone", label: "オールインワン" },
  { value: "inner", label: "ルームウェア・インナー" },
  { value: "legwear", label: "レッグウェア" },
  { value: "shoes", label: "シューズ" },
  { value: "bags", label: "バッグ" },
  { value: "fashion_accessories", label: "ファッション小物" },
  { value: "swimwear", label: "水着" },
  { value: "kimono", label: "着物" },
] as const;

export type ItemCategory = keyof typeof ITEM_SHAPES;

const SHAPE_VALUES_BY_SUBCATEGORY: Partial<
  Record<ItemCategory, Record<string, string[]>>
> = {
  pants: {
    pants: ["straight", "tapered", "wide", "culottes"],
    denim: ["straight", "tapered", "wide", "culottes"],
    slacks: ["straight", "tapered", "wide", "culottes"],
    cargo: ["straight", "tapered", "wide", "culottes"],
    chino: ["straight", "tapered", "wide", "culottes"],
    sweat_jersey: ["straight", "tapered", "wide", "culottes"],
    other: ["pants", "straight", "tapered", "wide", "culottes"],
  },
  skirts: {
    skirt: ["tight", "flare", "a_line", "pleated"],
    other: ["skirt", "tight", "flare", "a_line", "pleated"],
  },
  outerwear: {
    jacket: ["jacket", "tailored", "no_collar"],
    coat: ["coat", "trench", "chester", "stainless"],
    blouson: ["blouson"],
    down_padded: ["down-padded"],
    mountain_parka: ["mountain-parka"],
    other: [
      "jacket",
      "tailored",
      "no_collar",
      "blouson",
      "down-padded",
      "coat",
      "trench",
      "chester",
      "stainless",
      "mountain-parka",
      "other",
    ],
  },
  onepiece_dress: {
    onepiece: ["onepiece"],
    dress: ["dress"],
    other: ["other"],
  },
  allinone: {
    allinone: ["allinone"],
    salopette: ["salopette"],
    other: ["other"],
  },
  bags: {
    bag: ["tote", "shoulder", "backpack", "hand", "clutch", "body"],
    other: ["bag", "tote", "shoulder", "backpack", "hand", "clutch", "body"],
  },
};

export function getItemShapeOptions(
  category?: string | null,
  subcategory?: string | null,
) {
  if (!category) {
    return [];
  }

  const shapes = ITEM_SHAPES[category as ItemCategory] ?? [];

  if (!subcategory) {
    return shapes;
  }

  const allowedValues =
    SHAPE_VALUES_BY_SUBCATEGORY[category as ItemCategory]?.[subcategory];

  if (!allowedValues?.length) {
    return shapes;
  }

  return shapes.filter((item) => allowedValues.includes(item.value));
}

export function findItemCategoryLabel(category?: string | null) {
  if (!category) return "";
  if (category === "accessories") return "小物";
  if (category === "bottoms") return "ボトムス";
  if (category === "outer") return "アウター";
  if (category === "onepiece_allinone") return "ワンピース / オールインワン";
  return (
    ITEM_CATEGORIES.find((item) => item.value === category)?.label ?? category
  );
}

export function findItemShapeLabel(
  category?: string | null,
  shape?: string | null,
) {
  if (!shape) return "";
  if (!category) return shape;

  const normalizedCategory = resolveCurrentItemCategoryValue(category, shape);
  const normalizedShape = resolveCurrentItemShapeValue(category, shape);

  const shapes = ITEM_SHAPES[(normalizedCategory ?? category) as ItemCategory];
  const normalizedLabel = shapes?.find(
    (item) => item.value === normalizedShape,
  )?.label;
  const currentShapes = ITEM_SHAPES[category as ItemCategory];
  const legacyLabel = currentShapes?.find(
    (item) => item.value === shape,
  )?.label;

  if (
    legacyLabel &&
    (normalizedCategory !== category || normalizedShape !== shape)
  ) {
    return legacyLabel;
  }

  if (normalizedLabel) {
    return normalizedLabel;
  }

  return legacyLabel ?? shape;
}

export function resolveCurrentItemCategoryValue(
  category?: string | null,
  shape?: string | null,
) {
  if (!category) {
    return null;
  }

  if (category === "outer" || category === "outerwear") {
    return "outerwear";
  }

  if (category === "onepiece_allinone") {
    if (shape === "onepiece") {
      return "onepiece_dress";
    }

    if (shape === "allinone") {
      return "allinone";
    }
  }

  if (category === "bottoms") {
    if (shape === "mini-skirt" || shape === "tight-skirt") {
      return "skirts";
    }

    if (shape === "a-line-skirt" || shape === "flare-skirt") {
      return "skirts";
    }

    return "pants";
  }

  if (category === "accessories") {
    if (
      shape === "tote" ||
      shape === "shoulder" ||
      shape === "backpack" ||
      shape === "clutch"
    ) {
      return "bags";
    }

    return "fashion_accessories";
  }

  return category;
}

export function resolveCurrentItemShapeValue(
  category?: string | null,
  shape?: string | null,
) {
  if (!shape) {
    return null;
  }

  const currentCategory = resolveCurrentItemCategoryValue(category, shape);

  if (category === "bottoms") {
    return (
      {
        tapered: "tapered",
        wide: "wide",
        straight: "straight",
        "mini-skirt": "skirt",
        "tight-skirt": "tight",
        "a-line-skirt": "a_line",
        "flare-skirt": "flare",
      }[shape] ?? shape
    );
  }

  if (currentCategory === "pants") {
    return (
      {
        pants: "pants",
        denim: "pants",
        slacks: "pants",
        "short-pants": "pants",
        other: "pants",
        tapered: "tapered",
        wide: "wide",
        straight: "straight",
        culottes: "culottes",
      }[shape] ?? shape
    );
  }

  if (currentCategory === "skirts") {
    return (
      {
        skirt: "skirt",
        other: "skirt",
        tight: "tight",
        flare: "flare",
        a_line: "a_line",
        pleated: "pleated",
      }[shape] ?? shape
    );
  }

  if (category === "outer") {
    return (
      {
        tailored: "tailored",
        trench: "trench",
        chester: "chester",
        down: "down-padded",
        "outer-cardigan": "blouson",
      }[shape] ?? shape
    );
  }

  return shape;
}
