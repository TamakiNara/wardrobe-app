const PANTS_LIKE_SHAPES = new Set(["tapered", "wide", "straight"]);
const SKIRT_LIKE_SHAPES = new Set([
  "mini-skirt",
  "tight-skirt",
  "a-line-skirt",
  "flare-skirt",
]);

// frontend では backend 正本の読み替えとして current / legacy の吸収だけを共有する
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
      shape === "backpack" ||
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
