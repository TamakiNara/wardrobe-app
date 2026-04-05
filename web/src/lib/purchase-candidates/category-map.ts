const PURCHASE_CANDIDATE_ITEM_CATEGORY_MAP = {
  tops_tshirt_cutsew: { category: "tops", shape: "tshirt" },
  tops_shirt_blouse: { category: "tops", shape: "shirt" },
  tops_knit_sweater: { category: "tops", shape: "knit" },
  tops_polo_shirt: { category: "tops", shape: "shirt" },
  tops_sweat_trainer: { category: "tops", shape: "jacket" },
  tops_hoodie: { category: "tops", shape: "jacket" },
  tops_cardigan: { category: "tops", shape: "cardigan" },
  tops_vest_gilet: { category: "tops", shape: "camisole" },
  tops_camisole: { category: "tops", shape: "camisole" },
  tops_tanktop: { category: "tops", shape: "tanktop" },
  tops_other: { category: "tops", shape: "jacket" },
  outerwear_jacket: { category: "outerwear", shape: "jacket" },
  outerwear_coat: { category: "outerwear", shape: "coat" },
  outerwear_blouson: { category: "outerwear", shape: "blouson" },
  outerwear_down_padded: { category: "outerwear", shape: "down-padded" },
  outerwear_mountain_parka: {
    category: "outerwear",
    shape: "mountain-parka",
  },
  outerwear_other: { category: "outerwear", shape: "other" },
  pants_pants: { category: "pants", shape: "pants" },
  pants_denim: { category: "pants", shape: "denim" },
  pants_slacks: { category: "pants", shape: "slacks" },
  pants_short: { category: "pants", shape: "short-pants" },
  pants_other: { category: "pants", shape: "other" },
  skirts_skirt: { category: "skirts", shape: "skirt" },
  skirts_other: { category: "skirts", shape: "other" },
  onepiece_dress_onepiece: {
    category: "onepiece_dress",
    shape: "onepiece",
  },
  onepiece_dress_dress: {
    category: "onepiece_dress",
    shape: "dress",
  },
  onepiece_dress_other: {
    category: "onepiece_dress",
    shape: "other",
  },
  allinone_allinone: {
    category: "allinone",
    shape: "allinone",
  },
  allinone_salopette: {
    category: "allinone",
    shape: "salopette",
  },
  allinone_other: {
    category: "allinone",
    shape: "other",
  },
  roomwear_inner_roomwear: { category: "inner", shape: "roomwear" },
  roomwear_inner_underwear: { category: "inner", shape: "underwear" },
  roomwear_inner_pajamas: { category: "inner", shape: "pajamas" },
  legwear_other: { category: "legwear", shape: "socks" },
  shoes_sneakers: { category: "shoes", shape: "sneakers" },
  shoes_loafers_leather: { category: "shoes", shape: "pumps" },
  shoes_pumps: { category: "shoes", shape: "pumps" },
  shoes_boots: { category: "shoes", shape: "short-boots" },
  shoes_sandals: { category: "shoes", shape: "sandals" },
  shoes_other: { category: "shoes", shape: "sneakers" },
  bags_bag: { category: "bags", shape: "bag" },
  bags_other: { category: "bags", shape: "bag" },
  fashion_accessories_hat: { category: "fashion_accessories", shape: "hat" },
  fashion_accessories_belt: { category: "fashion_accessories", shape: "belt" },
  fashion_accessories_scarf_stole: {
    category: "fashion_accessories",
    shape: "scarf-stole",
  },
  fashion_accessories_gloves: {
    category: "fashion_accessories",
    shape: "gloves",
  },
  fashion_accessories_jewelry: {
    category: "fashion_accessories",
    shape: "jewelry",
  },
  fashion_accessories_wallet_case: {
    category: "fashion_accessories",
    shape: "wallet-case",
  },
  fashion_accessories_hair: {
    category: "fashion_accessories",
    shape: "hair-accessory",
  },
  fashion_accessories_eyewear: {
    category: "fashion_accessories",
    shape: "eyewear",
  },
  fashion_accessories_watch: {
    category: "fashion_accessories",
    shape: "watch",
  },
  fashion_accessories_other: {
    category: "fashion_accessories",
    shape: "other",
  },
  swimwear_swimwear: { category: "swimwear", shape: "swimwear" },
  swimwear_rashguard: { category: "swimwear", shape: "rashguard" },
  swimwear_other: { category: "swimwear", shape: "other" },
  kimono_kimono: { category: "kimono", shape: "kimono" },
  kimono_other: { category: "kimono", shape: "other" },
  tops_tshirt: { category: "tops", shape: "tshirt" },
  tops_shirt: { category: "tops", shape: "shirt" },
  tops_knit: { category: "tops", shape: "knit" },
  tops_vest: { category: "tops", shape: "camisole" },
  outer_jacket: { category: "outerwear", shape: "jacket" },
  outer_coat: { category: "outerwear", shape: "coat" },
  outer_blouson: { category: "outerwear", shape: "blouson" },
  outer_down: { category: "outerwear", shape: "down-padded" },
  outer_other: { category: "outerwear", shape: "other" },
  bottoms_pants: { category: "pants", shape: "pants" },
  bottoms_skirt: { category: "skirts", shape: "skirt" },
  bottoms_shorts: { category: "pants", shape: "short-pants" },
  bottoms_other: { category: "pants", shape: "other" },
  onepiece: {
    category: "onepiece_dress",
    shape: "onepiece",
  },
  allinone: {
    category: "allinone",
    shape: "allinone",
  },
  inner_roomwear: { category: "inner", shape: "roomwear" },
  inner_underwear: { category: "inner", shape: "underwear" },
  inner_pajamas: { category: "inner", shape: "pajamas" },
  shoes_loafers: { category: "shoes", shape: "pumps" },
  bags_hand: { category: "bags", shape: "bag" },
  bags_shoulder: { category: "bags", shape: "shoulder" },
  bags_tote: { category: "bags", shape: "tote" },
  bags_backpack: { category: "bags", shape: "backpack" },
  bags_body: { category: "bags", shape: "shoulder" },
  bags_clutch: { category: "bags", shape: "clutch" },
  accessories_hat: { category: "fashion_accessories", shape: "hat" },
  accessories_belt: { category: "fashion_accessories", shape: "belt" },
  accessories_scarf: { category: "fashion_accessories", shape: "scarf-stole" },
  accessories_gloves: { category: "fashion_accessories", shape: "gloves" },
  accessories_jewelry: { category: "fashion_accessories", shape: "jewelry" },
  accessories_other: { category: "fashion_accessories", shape: "other" },
} as const;

export function resolvePurchaseCandidateItemCategory(
  categoryId?: string | null,
) {
  if (!categoryId) {
    return null;
  }

  return (
    PURCHASE_CANDIDATE_ITEM_CATEGORY_MAP[
      categoryId as keyof typeof PURCHASE_CANDIDATE_ITEM_CATEGORY_MAP
    ] ?? null
  );
}
