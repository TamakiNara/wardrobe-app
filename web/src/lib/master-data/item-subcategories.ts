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
  inner: [
    { value: "roomwear", label: "ルームウェア" },
    { value: "underwear", label: "インナー" },
    { value: "pajamas", label: "パジャマ" },
    { value: "other", label: "その他ルームウェア・インナー" },
  ],
  bags: [
    { value: "tote", label: "トートバッグ" },
    { value: "shoulder", label: "ショルダーバッグ" },
    { value: "boston", label: "ボストンバッグ" },
    { value: "hand", label: "ハンドバッグ" },
    { value: "rucksack", label: "リュックサック・バックパック" },
    { value: "body", label: "ボディバッグ・クロスボディバッグ" },
    { value: "waist_pouch", label: "ウエストポーチ" },
    { value: "messenger", label: "メッセンジャーバッグ" },
    { value: "clutch", label: "クラッチバッグ" },
    { value: "sacoche", label: "サコッシュ" },
    { value: "pochette", label: "ポシェット" },
    { value: "drawstring", label: "ドローストリングバッグ" },
    { value: "basket_bag", label: "かごバッグ" },
    { value: "briefcase", label: "ブリーフケース" },
    { value: "marche_bag", label: "マルシェバッグ" },
    { value: "other", label: "その他バッグ" },
  ],
  fashion_accessories: [
    { value: "hat", label: "帽子" },
    { value: "belt", label: "ベルト" },
    { value: "scarf_stole", label: "マフラー・ストール・スカーフ" },
    { value: "gloves", label: "手袋" },
    { value: "jewelry", label: "アクセサリー" },
    { value: "wallet_case", label: "財布・カードケース" },
    { value: "hair_accessory", label: "ヘアアクセサリー" },
    { value: "eyewear", label: "メガネ・サングラス" },
    { value: "watch", label: "腕時計" },
    { value: "other", label: "その他ファッション小物" },
  ],
  shoes: [
    { value: "sneakers", label: "スニーカー" },
    { value: "pumps", label: "パンプス" },
    { value: "boots", label: "ブーツ" },
    { value: "sandals", label: "サンダル" },
    { value: "leather_shoes", label: "革靴" },
    { value: "rain_shoes_boots", label: "レインシューズ・レインブーツ" },
    { value: "other", label: "その他シューズ" },
  ],
  legwear: [
    { value: "socks", label: "ソックス" },
    { value: "stockings", label: "ストッキング" },
    { value: "tights", label: "タイツ" },
    { value: "leggings", label: "レギンス・スパッツ" },
    { value: "leg_warmer", label: "レッグウォーマー" },
    { value: "other", label: "その他レッグウェア" },
  ],
  swimwear: [
    { value: "swimwear", label: "水着" },
    { value: "rashguard", label: "ラッシュガード" },
    { value: "other", label: "その他水着" },
  ],
  kimono: [
    { value: "kimono", label: "着物" },
    { value: "yukata", label: "浴衣" },
    { value: "japanese_accessory", label: "和装小物" },
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
  "inner",
  "bags",
  "fashion_accessories",
  "shoes",
  "legwear",
  "swimwear",
  "kimono",
]);

const RADIO_SUBCATEGORY_UI_CATEGORIES = new Set<string>([
  "skirts",
  "shoes",
  "swimwear",
  "kimono",
]);

const REPRESENTATIVE_SUBCATEGORY_BY_CATEGORY: Record<string, string> = {
  skirts: "skirt",
  shoes: "sneakers",
  swimwear: "swimwear",
  kimono: "kimono",
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

export {
  resolveCurrentItemSubcategoryValue,
  resolveDefaultShapeForSubcategory,
} from "@/lib/items/current-item-read-model";
