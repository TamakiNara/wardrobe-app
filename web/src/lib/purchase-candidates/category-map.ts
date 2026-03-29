const PURCHASE_CANDIDATE_ITEM_CATEGORY_MAP = {
  tops_tshirt: { category: "tops", shape: "tshirt" },
  tops_shirt: { category: "tops", shape: "shirt" },
  tops_knit: { category: "tops", shape: "knit" },
  tops_hoodie: { category: "tops", shape: "jacket" },
  tops_cardigan: { category: "tops", shape: "cardigan" },
  tops_vest: { category: "tops", shape: "camisole" },
  outer_jacket: { category: "outer", shape: "tailored" },
  outer_coat: { category: "outer", shape: "trench" },
  outer_blouson: { category: "outer", shape: "outer-cardigan" },
  outer_down: { category: "outer", shape: "down" },
  outer_other: { category: "outer", shape: "outer-cardigan" },
  bottoms_pants: { category: "bottoms", shape: "straight" },
  bottoms_skirt: { category: "bottoms", shape: "a-line-skirt" },
  bottoms_shorts: { category: "bottoms", shape: "wide" },
  bottoms_other: { category: "bottoms", shape: "straight" },
  dress_onepiece: { category: "dress", shape: "onepiece" },
  dress_allinone: { category: "dress", shape: "allinone" },
  inner_roomwear: { category: "inner", shape: "roomwear" },
  inner_underwear: { category: "inner", shape: "underwear" },
  inner_pajamas: { category: "inner", shape: "pajamas" },
  shoes_sneakers: { category: "shoes", shape: "sneakers" },
  shoes_loafers: { category: "shoes", shape: "pumps" },
  shoes_pumps: { category: "shoes", shape: "pumps" },
  shoes_boots: { category: "shoes", shape: "short-boots" },
  shoes_sandals: { category: "shoes", shape: "sandals" },
  shoes_other: { category: "shoes", shape: "sneakers" },
  bags_hand: { category: "accessories", shape: "tote" },
  bags_shoulder: { category: "accessories", shape: "shoulder" },
  bags_tote: { category: "accessories", shape: "tote" },
  bags_backpack: { category: "accessories", shape: "backpack" },
  bags_body: { category: "accessories", shape: "shoulder" },
  bags_clutch: { category: "accessories", shape: "accessory" },
  bags_other: { category: "accessories", shape: "accessory" },
  accessories_hat: { category: "accessories", shape: "hat" },
  accessories_belt: { category: "accessories", shape: "accessory" },
  accessories_scarf: { category: "accessories", shape: "accessory" },
  accessories_gloves: { category: "accessories", shape: "accessory" },
  accessories_jewelry: { category: "accessories", shape: "accessory" },
  accessories_other: { category: "accessories", shape: "accessory" },
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
