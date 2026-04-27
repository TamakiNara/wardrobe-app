export type ColorThumbnailRoleKey =
  | "main_upper"
  | "main_lower"
  | "main_full"
  | "support"
  | "hidden";

type ColorThumbnailColor = {
  role: "main" | "sub";
  hex: string;
};

type ColorThumbnailSource = {
  id: number;
  category: string | null | undefined;
  colors: ColorThumbnailColor[];
};

export type ColorThumbnailSegment = {
  id: number;
  mainColorHex: string;
  subColorHex: string | null;
};

export type ColorThumbnailRoleLayout = {
  mainUpper: ColorThumbnailSegment[];
  mainLower: ColorThumbnailSegment[];
  mainFull: ColorThumbnailSegment[];
  support: ColorThumbnailSegment[];
  hidden: ColorThumbnailSegment[];
};

export type ColorThumbnailLayout = {
  tops: ColorThumbnailSegment[];
  bottoms: ColorThumbnailSegment[];
  others: ColorThumbnailSegment[];
  hasOthersBar: boolean;
  usesFullHeightForOthers: boolean;
};

export const COLOR_THUMBNAIL_FALLBACK_COLOR = "#E5E7EB";
export const COLOR_THUMBNAIL_OTHERS_BAR_CLASS =
  "h-[0.875rem] shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50";

export function resolveColorThumbnailGroup(
  category: string | null | undefined,
): ColorThumbnailRoleKey {
  if (category === "tops" || category === "outerwear" || category === "outer") {
    return "main_upper";
  }

  if (
    category === "bottoms" ||
    category === "pants" ||
    category === "skirts" ||
    category === "legwear"
  ) {
    return "main_lower";
  }

  if (
    category === "onepiece_allinone" ||
    category === "onepiece_dress" ||
    category === "allinone" ||
    category === "swimwear" ||
    category === "kimono"
  ) {
    return "main_full";
  }

  if (
    category === "bags" ||
    category === "bag" ||
    category === "shoes" ||
    category === "fashion_accessories" ||
    category === "accessories" ||
    category === "accessory"
  ) {
    return "support";
  }

  if (category === "inner" || category === "roomwear_inner") {
    return "hidden";
  }

  return "support";
}

export function buildColorThumbnailSegment(
  source: ColorThumbnailSource,
): ColorThumbnailSegment {
  const mainColor = source.colors.find((color) => color.role === "main");
  const subColor = source.colors.find((color) => color.role === "sub");

  return {
    id: source.id,
    mainColorHex: mainColor?.hex ?? COLOR_THUMBNAIL_FALLBACK_COLOR,
    subColorHex: subColor?.hex ?? null,
  };
}

export function buildColorThumbnailRoleLayout(
  sources: ColorThumbnailSource[],
  options?: {
    fallbackWhenEmpty?: boolean;
    emptyFallbackId?: number;
    excludedCategories?: string[];
  },
): ColorThumbnailRoleLayout {
  const excludedCategories = new Set(options?.excludedCategories ?? []);

  if (sources.length === 0 && options?.fallbackWhenEmpty) {
    return {
      mainUpper: [],
      mainLower: [],
      mainFull: [],
      support: [
        {
          id: options.emptyFallbackId ?? -1,
          mainColorHex: COLOR_THUMBNAIL_FALLBACK_COLOR,
          subColorHex: null,
        },
      ],
      hidden: [],
    };
  }

  const layout: ColorThumbnailRoleLayout = {
    mainUpper: [],
    mainLower: [],
    mainFull: [],
    support: [],
    hidden: [],
  };

  sources.forEach((source) => {
    if (
      source.category !== null &&
      source.category !== undefined &&
      excludedCategories.has(source.category)
    ) {
      return;
    }

    const group = resolveColorThumbnailGroup(source.category);
    switch (group) {
      case "main_upper":
        layout.mainUpper.push(buildColorThumbnailSegment(source));
        break;
      case "main_lower":
        layout.mainLower.push(buildColorThumbnailSegment(source));
        break;
      case "main_full":
        layout.mainFull.push(buildColorThumbnailSegment(source));
        break;
      case "support":
        layout.support.push(buildColorThumbnailSegment(source));
        break;
      case "hidden":
        layout.hidden.push(buildColorThumbnailSegment(source));
        break;
    }
  });

  return layout;
}

export function buildColorThumbnailLayout(
  sources: ColorThumbnailSource[],
  options?: {
    fallbackWhenEmpty?: boolean;
    emptyFallbackId?: number;
    excludedCategories?: string[];
  },
): ColorThumbnailLayout {
  const roleLayout = buildColorThumbnailRoleLayout(sources, options);
  const others = [...roleLayout.mainFull, ...roleLayout.support];

  const layout: ColorThumbnailLayout = {
    tops: roleLayout.mainUpper,
    bottoms: roleLayout.mainLower,
    others,
    hasOthersBar: false,
    usesFullHeightForOthers: false,
  };

  layout.hasOthersBar =
    layout.others.length > 0 &&
    (layout.tops.length > 0 || layout.bottoms.length > 0);
  layout.usesFullHeightForOthers =
    layout.others.length > 0 &&
    layout.tops.length === 0 &&
    layout.bottoms.length === 0;

  return layout;
}
