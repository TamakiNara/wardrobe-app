import {
  resolveCurrentItemCategoryValue,
  resolveCurrentItemShapeValue,
} from "@/lib/items/current-item-read-model";

export const ITEM_SHAPES = {
  tops: [
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
    { value: "jacket", label: "ジャケット" },
  ],
  pants: [
    { value: "pants", label: "パンツ" },
    { value: "straight", label: "ストレート" },
    { value: "tapered", label: "テーパード" },
    { value: "wide", label: "ワイド" },
    { value: "culottes", label: "キュロット" },
    { value: "jogger", label: "ジョガーパンツ" },
    { value: "skinny", label: "スキニー" },
    { value: "gaucho", label: "ガウチョ" },
  ],
  skirts: [
    { value: "skirt", label: "スカート" },
    { value: "tight", label: "タイト" },
    { value: "flare", label: "フレア" },
    { value: "a_line", label: "Aライン" },
    { value: "mermaid", label: "マーメイド" },
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
    { value: "leggings", label: "レギンス・スパッツ" },
    { value: "leg-warmer", label: "レッグウォーマー" },
  ],
  shoes: [
    { value: "other", label: "その他シューズ" },
    { value: "pumps", label: "パンプス" },
    { value: "sneakers", label: "スニーカー" },
    { value: "short-boots", label: "ショートブーツ" },
    { value: "sandals", label: "サンダル" },
    { value: "leather-shoes", label: "革靴" },
    { value: "rain-shoes-boots", label: "レインシューズ・レインブーツ" },
  ],
  bags: [
    { value: "bag", label: "バッグ" },
    { value: "tote", label: "トートバッグ" },
    { value: "shoulder", label: "ショルダーバッグ" },
    { value: "boston", label: "ボストンバッグ" },
    { value: "rucksack", label: "リュックサック・バックパック" },
    { value: "hand", label: "ハンドバッグ" },
    { value: "body", label: "ボディバッグ・クロスボディバッグ" },
    { value: "waist-pouch", label: "ウエストポーチ" },
    { value: "messenger", label: "メッセンジャーバッグ" },
    { value: "clutch", label: "クラッチバッグ" },
    { value: "sacoche", label: "サコッシュ" },
    { value: "pochette", label: "ポシェット" },
    { value: "drawstring", label: "ドローストリングバッグ" },
    { value: "basket-bag", label: "かごバッグ" },
    { value: "briefcase", label: "ブリーフケース" },
    { value: "marche-bag", label: "マルシェバッグ" },
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
    { value: "yukata", label: "浴衣" },
    { value: "japanese-accessory", label: "和装小物" },
    { value: "other", label: "その他着物" },
  ],
  accessories: [
    { value: "tote", label: "トートバッグ" },
    { value: "shoulder", label: "ショルダーバッグ" },
    { value: "rucksack", label: "リュックサック・バックパック" },
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
    pants: [
      "straight",
      "tapered",
      "wide",
      "culottes",
      "jogger",
      "skinny",
      "gaucho",
    ],
    denim: [
      "straight",
      "tapered",
      "wide",
      "culottes",
      "jogger",
      "skinny",
      "gaucho",
    ],
    slacks: [
      "straight",
      "tapered",
      "wide",
      "culottes",
      "jogger",
      "skinny",
      "gaucho",
    ],
    cargo: [
      "straight",
      "tapered",
      "wide",
      "culottes",
      "jogger",
      "skinny",
      "gaucho",
    ],
    chino: [
      "straight",
      "tapered",
      "wide",
      "culottes",
      "jogger",
      "skinny",
      "gaucho",
    ],
    sweat_jersey: [
      "straight",
      "tapered",
      "wide",
      "culottes",
      "jogger",
      "skinny",
      "gaucho",
    ],
    other: [],
  },
  skirts: {
    skirt: ["tight", "flare", "a_line", "mermaid"],
    other: [],
  },
  outerwear: {
    jacket: ["jacket", "tailored", "no_collar"],
    coat: ["coat", "trench", "chester", "stainless"],
    blouson: ["blouson"],
    down_padded: ["down-padded"],
    mountain_parka: ["mountain-parka"],
    other: [],
  },
  onepiece_dress: {
    onepiece: ["onepiece"],
    dress: ["dress"],
    other: [],
  },
  allinone: {
    allinone: ["allinone"],
    salopette: ["salopette"],
    other: [],
  },
  inner: {
    roomwear: ["roomwear"],
    underwear: ["underwear"],
    pajamas: ["pajamas"],
    other: [],
  },
  bags: {
    tote: ["tote"],
    shoulder: ["shoulder"],
    boston: ["boston"],
    rucksack: ["rucksack"],
    hand: ["hand"],
    body: ["body"],
    waist_pouch: ["waist-pouch"],
    messenger: ["messenger"],
    clutch: ["clutch"],
    sacoche: ["sacoche"],
    pochette: ["pochette"],
    drawstring: ["drawstring"],
    basket_bag: ["basket-bag"],
    briefcase: ["briefcase"],
    marche_bag: ["marche-bag"],
    other: [],
  },
  fashion_accessories: {
    hat: ["hat"],
    belt: ["belt"],
    scarf_stole: ["scarf-stole"],
    gloves: ["gloves"],
    jewelry: ["jewelry"],
    wallet_case: ["wallet-case"],
    hair_accessory: ["hair-accessory"],
    eyewear: ["eyewear"],
    watch: ["watch"],
    other: [],
  },
  shoes: {
    sneakers: ["sneakers"],
    pumps: ["pumps"],
    boots: ["short-boots"],
    sandals: ["sandals"],
    leather_shoes: ["leather-shoes"],
    rain_shoes_boots: ["rain-shoes-boots"],
    other: [],
  },
  legwear: {
    socks: ["socks"],
    stockings: ["stockings"],
    tights: ["tights"],
    leggings: ["leggings"],
    leg_warmer: ["leg-warmer"],
    other: [],
  },
  kimono: {
    kimono: ["kimono"],
    yukata: ["yukata"],
    japanese_accessory: ["japanese-accessory"],
    other: [],
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

  if (
    !subcategory &&
    (category === "bags" ||
      category === "fashion_accessories" ||
      category === "shoes" ||
      category === "legwear" ||
      category === "swimwear" ||
      category === "kimono" ||
      category === "inner")
  ) {
    return [];
  }

  if (!subcategory) {
    return shapes;
  }

  const allowedValues =
    SHAPE_VALUES_BY_SUBCATEGORY[category as ItemCategory]?.[subcategory];

  if (allowedValues === undefined) {
    return shapes;
  }

  if (allowedValues.length === 0) {
    return [];
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

export {
  resolveCurrentItemCategoryValue,
  resolveCurrentItemShapeValue,
} from "@/lib/items/current-item-read-model";
