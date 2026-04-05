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
    { value: "denim", label: "ジーンズ・デニムパンツ" },
    { value: "slacks", label: "スラックス・ドレスパンツ" },
    { value: "short-pants", label: "ショートパンツ" },
    { value: "other", label: "その他パンツ" },
  ],
  skirts: [
    { value: "skirt", label: "スカート" },
    { value: "other", label: "その他スカート" },
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
    { value: "blouson", label: "ブルゾン" },
    { value: "down-padded", label: "ダウンジャケット・中綿ジャケット" },
    { value: "coat", label: "コート" },
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
    { value: "clutch", label: "クラッチバッグ" },
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

  const shapes = ITEM_SHAPES[category as ItemCategory];
  return shapes?.find((item) => item.value === shape)?.label ?? shape;
}
