import {
  isBlankItemShape,
  normalizeItemShapeValue,
} from "@/lib/items/item-shape";

const PANTS_LIKE_SHAPES = new Set(["tapered", "wide", "straight"]);
const SKIRT_LIKE_SHAPES = new Set([
  "mini-skirt",
  "tight-skirt",
  "a-line-skirt",
  "flare-skirt",
]);

const LEGACY_INFERRED_SUBCATEGORY_BY_CATEGORY: Record<
  string,
  Record<string, string>
> = {
  tops: {
    tshirt: "tshirt_cutsew",
    shirt: "shirt_blouse",
    blouse: "shirt_blouse",
    polo: "polo_shirt",
    sweatshirt: "sweat_trainer",
    hoodie: "hoodie",
    knit: "knit_sweater",
    cardigan: "cardigan",
    vest: "vest_gilet",
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
    narrow: "skirt",
    mermaid: "skirt",
    other: "other",
  },
  outerwear: {
    jacket: "jacket",
    tailored: "jacket",
    blazer: "jacket",
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
  inner: {
    roomwear: "roomwear",
    underwear: "underwear",
    pajamas: "pajamas",
    other: "other",
  },
  bags: {
    tote: "tote",
    shoulder: "shoulder",
    boston: "boston",
    rucksack: "rucksack",
    hand: "hand",
    body: "body",
    "waist-pouch": "waist_pouch",
    messenger: "messenger",
    clutch: "clutch",
    sacoche: "sacoche",
    pochette: "pochette",
    drawstring: "drawstring",
    "basket-bag": "basket_bag",
    briefcase: "briefcase",
    "marche-bag": "marche_bag",
    other: "other",
  },
  fashion_accessories: {
    hat: "hat",
    belt: "belt",
    "scarf-stole": "scarf_stole",
    gloves: "gloves",
    jewelry: "jewelry",
    "wallet-case": "other",
    "scarf-bandana": "scarf_bandana",
    "hair-accessory": "hair_accessory",
    eyewear: "eyewear",
    watch: "watch",
    other: "other",
    accessory: "other",
  },
  shoes: {
    sneakers: "sneakers",
    pumps: "pumps",
    "short-boots": "boots",
    sandals: "sandals",
    "leather-shoes": "leather_shoes",
    "rain-shoes-boots": "rain_shoes_boots",
    other: "other",
  },
  legwear: {
    socks: "socks",
    stockings: "stockings",
    tights: "tights",
    leggings: "leggings",
    "leg-warmer": "leg_warmer",
    other: "other",
  },
  swimwear: {
    swimwear: "swimwear",
    rashguard: "rashguard",
    other: "other",
  },
  kimono: {
    kimono: "kimono",
    yukata: "yukata",
    "japanese-accessory": "japanese_accessory",
    other: "other",
  },
};

const DEFAULT_SHAPE_BY_SUBCATEGORY: Record<string, Record<string, string>> = {
  tops: {
    tshirt_cutsew: "tshirt",
    shirt_blouse: "shirt",
    knit_sweater: "knit",
    cardigan: "cardigan",
    polo_shirt: "polo",
    sweat_trainer: "sweatshirt",
    hoodie: "hoodie",
    vest_gilet: "vest",
    camisole: "camisole",
    tanktop: "tanktop",
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
  inner: {
    roomwear: "roomwear",
    underwear: "underwear",
    pajamas: "pajamas",
    other: "roomwear",
  },
  bags: {
    tote: "tote",
    shoulder: "shoulder",
    boston: "boston",
    rucksack: "rucksack",
    hand: "hand",
    body: "body",
    waist_pouch: "waist-pouch",
    messenger: "messenger",
    clutch: "clutch",
    sacoche: "sacoche",
    pochette: "pochette",
    drawstring: "drawstring",
    basket_bag: "basket-bag",
    briefcase: "briefcase",
    marche_bag: "marche-bag",
    other: "bag",
  },
  fashion_accessories: {
    hat: "hat",
    belt: "belt",
    scarf_stole: "scarf-stole",
    gloves: "gloves",
    jewelry: "jewelry",
    scarf_bandana: "scarf-bandana",
    hair_accessory: "hair-accessory",
    eyewear: "eyewear",
    watch: "watch",
    other: "other",
  },
  shoes: {
    sneakers: "sneakers",
    pumps: "pumps",
    boots: "short-boots",
    sandals: "sandals",
    leather_shoes: "leather-shoes",
    rain_shoes_boots: "rain-shoes-boots",
    other: "other",
  },
  legwear: {
    socks: "socks",
    stockings: "stockings",
    tights: "tights",
    leggings: "leggings",
    leg_warmer: "leg-warmer",
    other: "socks",
  },
  swimwear: {
    swimwear: "swimwear",
    rashguard: "rashguard",
    other: "other",
  },
  kimono: {
    kimono: "kimono",
    yukata: "yukata",
    japanese_accessory: "japanese-accessory",
    other: "kimono",
  },
};

const VISIBLE_CATEGORY_ID_BY_SUBCATEGORY: Record<
  string,
  Record<string, string>
> = {
  tops: {
    other: "tops_other",
  },
  pants: {
    other: "pants_other",
  },
  skirts: {
    other: "skirts_other",
  },
  outerwear: {
    other: "outerwear_other",
  },
  inner: {
    roomwear: "roomwear_inner_roomwear",
    underwear: "roomwear_inner_underwear",
    pajamas: "roomwear_inner_pajamas",
    other: "roomwear_inner_other",
  },
  bags: {
    tote: "bags_tote",
    shoulder: "bags_shoulder",
    boston: "bags_boston",
    rucksack: "bags_rucksack",
    hand: "bags_hand",
    body: "bags_body",
    waist_pouch: "bags_waist_pouch",
    messenger: "bags_messenger",
    clutch: "bags_clutch",
    sacoche: "bags_sacoche",
    pochette: "bags_pochette",
    drawstring: "bags_drawstring",
    basket_bag: "bags_basket_bag",
    briefcase: "bags_briefcase",
    marche_bag: "bags_marche_bag",
    other: "bags_other",
  },
  fashion_accessories: {
    hat: "fashion_accessories_hat",
    belt: "fashion_accessories_belt",
    scarf_stole: "fashion_accessories_scarf_stole",
    gloves: "fashion_accessories_gloves",
    jewelry: "fashion_accessories_jewelry",
    scarf_bandana: "fashion_accessories_scarf_bandana",
    hair_accessory: "fashion_accessories_hair",
    eyewear: "fashion_accessories_eyewear",
    watch: "fashion_accessories_watch",
    other: "fashion_accessories_other",
  },
  shoes: {
    sneakers: "shoes_sneakers",
    pumps: "shoes_pumps",
    boots: "shoes_boots",
    sandals: "shoes_sandals",
    leather_shoes: "shoes_leather_shoes",
    rain_shoes_boots: "shoes_rain_shoes_boots",
    other: "shoes_other",
  },
  legwear: {
    socks: "legwear_socks",
    stockings: "legwear_stockings",
    tights: "legwear_tights",
    leggings: "legwear_leggings",
    leg_warmer: "legwear_leg_warmer",
    other: "legwear_other",
  },
  swimwear: {
    swimwear: "swimwear_swimwear",
    rashguard: "swimwear_rashguard",
    other: "swimwear_other",
  },
  kimono: {
    kimono: "kimono_kimono",
    yukata: "kimono_yukata",
    japanese_accessory: "kimono_japanese_accessory",
    other: "kimono_other",
  },
};

const VISIBLE_CATEGORY_ID_BY_SHAPE: Record<string, Record<string, string>> = {
  tops: {
    tshirt: "tops_tshirt_cutsew",
    shirt: "tops_shirt_blouse",
    blouse: "tops_shirt_blouse",
    polo: "tops_polo_shirt",
    sweatshirt: "tops_sweat_trainer",
    hoodie: "tops_hoodie",
    knit: "tops_knit_sweater",
    cardigan: "tops_cardigan",
    vest: "tops_vest_gilet",
    camisole: "tops_camisole",
    tanktop: "tops_tanktop",
    jacket: "tops_other",
  },
  pants: {
    pants: "pants_pants",
    denim: "pants_denim",
    slacks: "pants_slacks",
    "short-pants": "pants_pants",
    other: "pants_other",
    straight: "pants_pants",
    tapered: "pants_pants",
    wide: "pants_pants",
    culottes: "pants_pants",
  },
  skirts: {
    skirt: "skirts_skirt",
    other: "skirts_other",
    tight: "skirts_skirt",
    flare: "skirts_skirt",
    a_line: "skirts_skirt",
    narrow: "skirts_skirt",
    mermaid: "skirts_skirt",
  },
  bottoms: {
    tapered: "pants_pants",
    wide: "pants_pants",
    straight: "pants_pants",
    "mini-skirt": "skirts_skirt",
    "tight-skirt": "skirts_skirt",
    "a-line-skirt": "skirts_skirt",
    "flare-skirt": "skirts_skirt",
  },
  outerwear: {
    jacket: "outerwear_jacket",
    tailored: "outerwear_jacket",
    no_collar: "outerwear_jacket",
    blazer: "outerwear_jacket",
    blouson: "outerwear_blouson",
    "down-padded": "outerwear_down_padded",
    coat: "outerwear_coat",
    trench: "outerwear_coat",
    chester: "outerwear_coat",
    stainless: "outerwear_coat",
    "mountain-parka": "outerwear_mountain_parka",
    other: "outerwear_other",
  },
  outer: {
    tailored: "outerwear_jacket",
    trench: "outerwear_coat",
    chester: "outerwear_coat",
    down: "outerwear_down_padded",
    "outer-cardigan": "outerwear_blouson",
  },
  onepiece_dress: {
    onepiece: "onepiece_dress_onepiece",
    dress: "onepiece_dress_dress",
    other: "onepiece_dress_other",
  },
  allinone: {
    allinone: "allinone_allinone",
    salopette: "allinone_salopette",
    other: "allinone_other",
  },
  onepiece_allinone: {
    onepiece: "onepiece_dress_onepiece",
    allinone: "allinone_allinone",
  },
  inner: {
    roomwear: "roomwear_inner_roomwear",
    underwear: "roomwear_inner_underwear",
    pajamas: "roomwear_inner_pajamas",
  },
  legwear: {
    socks: "legwear_socks",
    stockings: "legwear_stockings",
    tights: "legwear_tights",
    leggings: "legwear_leggings",
    "leg-warmer": "legwear_leg_warmer",
  },
  shoes: {
    sneakers: "shoes_sneakers",
    pumps: "shoes_pumps",
    "short-boots": "shoes_boots",
    sandals: "shoes_sandals",
    "leather-shoes": "shoes_leather_shoes",
    "rain-shoes-boots": "shoes_rain_shoes_boots",
    other: "shoes_other",
  },
  bags: {
    bag: "bags_other",
    tote: "bags_tote",
    shoulder: "bags_shoulder",
    boston: "bags_boston",
    rucksack: "bags_rucksack",
    hand: "bags_hand",
    body: "bags_body",
    "waist-pouch": "bags_waist_pouch",
    messenger: "bags_messenger",
    clutch: "bags_clutch",
    sacoche: "bags_sacoche",
    pochette: "bags_pochette",
    drawstring: "bags_drawstring",
    "basket-bag": "bags_basket_bag",
    briefcase: "bags_briefcase",
    "marche-bag": "bags_marche_bag",
    other: "bags_other",
  },
  fashion_accessories: {
    hat: "fashion_accessories_hat",
    belt: "fashion_accessories_belt",
    "scarf-stole": "fashion_accessories_scarf_stole",
    gloves: "fashion_accessories_gloves",
    jewelry: "fashion_accessories_jewelry",
    "wallet-case": "fashion_accessories_other",
    "scarf-bandana": "fashion_accessories_scarf_bandana",
    "hair-accessory": "fashion_accessories_hair",
    eyewear: "fashion_accessories_eyewear",
    watch: "fashion_accessories_watch",
    other: "fashion_accessories_other",
  },
  swimwear: {
    swimwear: "swimwear_swimwear",
    rashguard: "swimwear_rashguard",
    other: "swimwear_other",
  },
  kimono: {
    kimono: "kimono_kimono",
    other: "kimono_other",
  },
  accessories: {
    tote: "bags_tote",
    shoulder: "bags_shoulder",
    rucksack: "bags_rucksack",
    hand: "bags_hand",
    clutch: "bags_clutch",
    body: "bags_body",
    hat: "fashion_accessories_hat",
    belt: "fashion_accessories_belt",
    "scarf-stole": "fashion_accessories_scarf_stole",
    gloves: "fashion_accessories_gloves",
    jewelry: "fashion_accessories_jewelry",
    "wallet-case": "fashion_accessories_other",
    "scarf-bandana": "fashion_accessories_scarf_bandana",
    "hair-accessory": "fashion_accessories_hair",
    eyewear: "fashion_accessories_eyewear",
    watch: "fashion_accessories_watch",
    accessory: "fashion_accessories_other",
    other: "fashion_accessories_other",
  },
};

const KNOWN_SUBCATEGORY_VALUES_BY_CATEGORY: Record<string, Set<string>> = {
  ...Object.fromEntries(
    Object.entries(DEFAULT_SHAPE_BY_SUBCATEGORY).map(([category, values]) => [
      category,
      new Set(Object.keys(values)),
    ]),
  ),
  tops: new Set([
    ...Object.keys(DEFAULT_SHAPE_BY_SUBCATEGORY.tops ?? {}),
    "other",
  ]),
  skirts: new Set([
    ...Object.keys(DEFAULT_SHAPE_BY_SUBCATEGORY.skirts ?? {}),
    "other",
  ]),
  swimwear: new Set(["swimwear", "rashguard", "other"]),
  kimono: new Set(["kimono", "yukata", "japanese_accessory", "other"]),
};

// フロントエンドではバックエンド正本の読み替えとして、現行値 / 旧値の吸収だけを共有する
export function resolveCurrentItemCategoryValue(
  category?: string | null,
  shape?: string | null,
): string | null {
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
    if (shape && PANTS_LIKE_SHAPES.has(shape)) {
      return "pants";
    }

    if (shape && SKIRT_LIKE_SHAPES.has(shape)) {
      return "skirts";
    }
  }

  if (category === "accessories") {
    if (
      shape === "tote" ||
      shape === "shoulder" ||
      shape === "rucksack" ||
      shape === "hand" ||
      shape === "clutch" ||
      shape === "body"
    ) {
      return "bags";
    }

    return "fashion_accessories";
  }

  if (category === "pants" || category === "skirts") {
    return category;
  }

  if (
    category === "onepiece_dress" ||
    category === "allinone" ||
    category === "tops" ||
    category === "inner" ||
    category === "legwear" ||
    category === "shoes" ||
    category === "bags" ||
    category === "fashion_accessories" ||
    category === "swimwear" ||
    category === "kimono"
  ) {
    return category;
  }

  return category;
}

export function resolveCurrentItemShapeValue(
  category?: string | null,
  shape?: string | null,
) {
  const normalizedShape = normalizeItemShapeValue(shape);

  if (isBlankItemShape(normalizedShape)) {
    return null;
  }

  const currentCategory = resolveCurrentItemCategoryValue(
    category,
    normalizedShape,
  );

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
      }[normalizedShape] ?? normalizedShape
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
      }[normalizedShape] ?? normalizedShape
    );
  }

  if (currentCategory === "skirts") {
    if (normalizedShape === "other") {
      return null;
    }

    return (
      {
        skirt: "skirt",
        tight: "tight",
        flare: "flare",
        a_line: "a_line",
        narrow: "narrow",
        mermaid: "mermaid",
      }[normalizedShape] ?? normalizedShape
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
      }[normalizedShape] ?? normalizedShape
    );
  }

  return normalizedShape;
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

  const normalizedSubcategory =
    typeof subcategory === "string" ? subcategory.trim() : "";

  if (normalizedSubcategory) {
    const knownSubcategories =
      KNOWN_SUBCATEGORY_VALUES_BY_CATEGORY[currentCategory];
    if (knownSubcategories?.has(normalizedSubcategory)) {
      return normalizedSubcategory;
    }
  }

  const normalizedShape = normalizeItemShapeValue(shape);

  if (isBlankItemShape(normalizedShape)) {
    return null;
  }

  return (
    LEGACY_INFERRED_SUBCATEGORY_BY_CATEGORY[currentCategory]?.[
      normalizedShape
    ] ?? null
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

export function resolveVisibleCategoryIdForItem(
  category?: string | null,
  shape?: string | null,
  subcategory?: string | null,
) {
  const currentSubcategory = resolveCurrentItemSubcategoryValue(
    category,
    shape,
    subcategory,
  );
  const currentCategory = resolveCurrentItemCategoryValue(category, shape);
  const currentShape = resolveCurrentItemShapeValue(category, shape);

  if (currentCategory && currentSubcategory) {
    const visibleIdFromSubcategory =
      VISIBLE_CATEGORY_ID_BY_SUBCATEGORY[currentCategory]?.[currentSubcategory];
    if (visibleIdFromSubcategory) {
      return visibleIdFromSubcategory;
    }
  }

  if (!shape) {
    return null;
  }

  const visibleIdFromRawShape = category
    ? (VISIBLE_CATEGORY_ID_BY_SHAPE[category]?.[shape] ?? null)
    : null;
  if (visibleIdFromRawShape) {
    return visibleIdFromRawShape;
  }

  const fallbackCategory = currentCategory ?? category;
  const fallbackShape = currentShape ?? shape;

  return fallbackCategory
    ? (VISIBLE_CATEGORY_ID_BY_SHAPE[fallbackCategory]?.[fallbackShape] ?? null)
    : null;
}
