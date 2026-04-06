const PURCHASE_CANDIDATE_ITEM_CATEGORY_MAP = {
  tops_tshirt_cutsew: {
    category: "tops",
    subcategory: "tshirt_cutsew",
    shape: "tshirt",
  },
  tops_shirt_blouse: {
    category: "tops",
    subcategory: "shirt_blouse",
    shape: "shirt",
  },
  tops_knit_sweater: {
    category: "tops",
    subcategory: "knit_sweater",
    shape: "knit",
  },
  tops_polo_shirt: {
    category: "tops",
    subcategory: "polo_shirt",
    shape: "shirt",
  },
  tops_sweat_trainer: {
    category: "tops",
    subcategory: "sweat_trainer",
    shape: "tshirt",
  },
  tops_hoodie: {
    category: "tops",
    subcategory: "hoodie",
    shape: "tshirt",
  },
  tops_cardigan: {
    category: "tops",
    subcategory: "cardigan",
    shape: "cardigan",
  },
  tops_vest_gilet: {
    category: "tops",
    subcategory: "vest_gilet",
    shape: "camisole",
  },
  tops_camisole: {
    category: "tops",
    subcategory: "camisole",
    shape: "camisole",
  },
  tops_tanktop: {
    category: "tops",
    subcategory: "tanktop",
    shape: "tanktop",
  },
  tops_other: {
    category: "tops",
    subcategory: "other",
    shape: "tshirt",
  },
  outerwear_jacket: {
    category: "outerwear",
    subcategory: "jacket",
    shape: "jacket",
  },
  outerwear_coat: {
    category: "outerwear",
    subcategory: "coat",
    shape: "coat",
  },
  outerwear_blouson: {
    category: "outerwear",
    subcategory: "blouson",
    shape: "blouson",
  },
  outerwear_down_padded: {
    category: "outerwear",
    subcategory: "down_padded",
    shape: "down-padded",
  },
  outerwear_mountain_parka: {
    category: "outerwear",
    subcategory: "mountain_parka",
    shape: "mountain-parka",
  },
  outerwear_other: {
    category: "outerwear",
    subcategory: "other",
    shape: "other",
  },
  pants_pants: { category: "pants", subcategory: "pants", shape: "pants" },
  pants_denim: { category: "pants", subcategory: "denim", shape: "pants" },
  pants_slacks: { category: "pants", subcategory: "slacks", shape: "pants" },
  pants_cargo: { category: "pants", subcategory: "cargo", shape: "pants" },
  pants_chino: { category: "pants", subcategory: "chino", shape: "pants" },
  pants_sweat_jersey: {
    category: "pants",
    subcategory: "sweat_jersey",
    shape: "pants",
  },
  pants_other: { category: "pants", subcategory: "other", shape: "pants" },
  skirts_skirt: { category: "skirts", subcategory: "skirt", shape: "skirt" },
  skirts_other: { category: "skirts", subcategory: "other", shape: "other" },
  onepiece_dress_onepiece: {
    category: "onepiece_dress",
    subcategory: "onepiece",
    shape: "onepiece",
  },
  onepiece_dress_dress: {
    category: "onepiece_dress",
    subcategory: "dress",
    shape: "dress",
  },
  onepiece_dress_other: {
    category: "onepiece_dress",
    subcategory: "other",
    shape: "other",
  },
  allinone_allinone: {
    category: "allinone",
    subcategory: "allinone",
    shape: "allinone",
  },
  allinone_salopette: {
    category: "allinone",
    subcategory: "salopette",
    shape: "salopette",
  },
  allinone_other: {
    category: "allinone",
    subcategory: "other",
    shape: "other",
  },
  roomwear_inner_roomwear: {
    category: "inner",
    subcategory: null,
    shape: "roomwear",
  },
  roomwear_inner_underwear: {
    category: "inner",
    subcategory: null,
    shape: "underwear",
  },
  roomwear_inner_pajamas: {
    category: "inner",
    subcategory: null,
    shape: "pajamas",
  },
  legwear_other: { category: "legwear", subcategory: null, shape: "socks" },
  shoes_sneakers: {
    category: "shoes",
    subcategory: "shoes",
    shape: "sneakers",
  },
  shoes_loafers_leather: {
    category: "shoes",
    subcategory: "shoes",
    shape: "pumps",
  },
  shoes_pumps: { category: "shoes", subcategory: "shoes", shape: "pumps" },
  shoes_boots: {
    category: "shoes",
    subcategory: "shoes",
    shape: "short-boots",
  },
  shoes_sandals: {
    category: "shoes",
    subcategory: "shoes",
    shape: "sandals",
  },
  shoes_other: { category: "shoes", subcategory: "other", shape: "sneakers" },
  bags_tote: { category: "bags", subcategory: "tote", shape: "tote" },
  bags_shoulder: {
    category: "bags",
    subcategory: "shoulder",
    shape: "shoulder",
  },
  bags_backpack: {
    category: "bags",
    subcategory: "backpack",
    shape: "backpack",
  },
  bags_hand: { category: "bags", subcategory: "hand", shape: "hand" },
  bags_clutch: {
    category: "bags",
    subcategory: "clutch",
    shape: "clutch",
  },
  bags_body: { category: "bags", subcategory: "body", shape: "body" },
  bags_other: { category: "bags", subcategory: "other", shape: "bag" },
  fashion_accessories_hat: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "hat",
  },
  fashion_accessories_belt: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "belt",
  },
  fashion_accessories_scarf_stole: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "scarf-stole",
  },
  fashion_accessories_gloves: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "gloves",
  },
  fashion_accessories_jewelry: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "jewelry",
  },
  fashion_accessories_wallet_case: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "wallet-case",
  },
  fashion_accessories_hair: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "hair-accessory",
  },
  fashion_accessories_eyewear: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "eyewear",
  },
  fashion_accessories_watch: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "watch",
  },
  fashion_accessories_other: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "other",
  },
  swimwear_swimwear: {
    category: "swimwear",
    subcategory: "swimwear",
    shape: "swimwear",
  },
  swimwear_rashguard: {
    category: "swimwear",
    subcategory: "rashguard",
    shape: "rashguard",
  },
  swimwear_other: {
    category: "swimwear",
    subcategory: "other",
    shape: "other",
  },
  kimono_kimono: {
    category: "kimono",
    subcategory: "kimono",
    shape: "kimono",
  },
  kimono_other: { category: "kimono", subcategory: "other", shape: "other" },
  tops_tshirt: {
    category: "tops",
    subcategory: "tshirt_cutsew",
    shape: "tshirt",
  },
  tops_shirt: {
    category: "tops",
    subcategory: "shirt_blouse",
    shape: "shirt",
  },
  tops_knit: {
    category: "tops",
    subcategory: "knit_sweater",
    shape: "knit",
  },
  tops_vest: {
    category: "tops",
    subcategory: "vest_gilet",
    shape: "camisole",
  },
  outer_jacket: {
    category: "outerwear",
    subcategory: "jacket",
    shape: "jacket",
  },
  outer_coat: { category: "outerwear", subcategory: "coat", shape: "coat" },
  outer_blouson: {
    category: "outerwear",
    subcategory: "blouson",
    shape: "blouson",
  },
  outer_down: {
    category: "outerwear",
    subcategory: "down_padded",
    shape: "down-padded",
  },
  outer_other: {
    category: "outerwear",
    subcategory: "other",
    shape: "other",
  },
  bottoms_pants: {
    category: "pants",
    subcategory: "pants",
    shape: "pants",
  },
  bottoms_skirt: {
    category: "skirts",
    subcategory: "skirt",
    shape: "skirt",
  },
  bottoms_shorts: {
    category: "pants",
    subcategory: "pants",
    shape: "pants",
  },
  bottoms_other: {
    category: "pants",
    subcategory: "other",
    shape: "pants",
  },
  onepiece: {
    category: "onepiece_dress",
    subcategory: "onepiece",
    shape: "onepiece",
  },
  allinone: {
    category: "allinone",
    subcategory: "allinone",
    shape: "allinone",
  },
  inner_roomwear: { category: "inner", subcategory: null, shape: "roomwear" },
  inner_underwear: { category: "inner", subcategory: null, shape: "underwear" },
  inner_pajamas: { category: "inner", subcategory: null, shape: "pajamas" },
  shoes_loafers: { category: "shoes", subcategory: "shoes", shape: "pumps" },
  bags_bag: { category: "bags", subcategory: "other", shape: "bag" },
  accessories_hat: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "hat",
  },
  accessories_belt: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "belt",
  },
  accessories_scarf: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "scarf-stole",
  },
  accessories_gloves: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "gloves",
  },
  accessories_jewelry: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "jewelry",
  },
  accessories_other: {
    category: "fashion_accessories",
    subcategory: null,
    shape: "other",
  },
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
