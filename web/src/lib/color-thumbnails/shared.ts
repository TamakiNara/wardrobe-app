export type ColorThumbnailGroupKey = "tops" | "bottoms" | "others";

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
): ColorThumbnailGroupKey {
  if (category === "tops") {
    return "tops";
  }

  if (category === "bottoms") {
    return "bottoms";
  }

  return "others";
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

export function buildColorThumbnailLayout(
  sources: ColorThumbnailSource[],
  options?: {
    fallbackWhenEmpty?: boolean;
    emptyFallbackId?: number;
  },
): ColorThumbnailLayout {
  if (sources.length === 0 && options?.fallbackWhenEmpty) {
    return {
      tops: [],
      bottoms: [],
      others: [
        {
          id: options.emptyFallbackId ?? -1,
          mainColorHex: COLOR_THUMBNAIL_FALLBACK_COLOR,
          subColorHex: null,
        },
      ],
      hasOthersBar: false,
      usesFullHeightForOthers: true,
    };
  }

  const layout: ColorThumbnailLayout = {
    tops: [],
    bottoms: [],
    others: [],
    hasOthersBar: false,
    usesFullHeightForOthers: false,
  };

  sources.forEach((source) => {
    const group = resolveColorThumbnailGroup(source.category);
    layout[group].push(buildColorThumbnailSegment(source));
  });

  layout.hasOthersBar =
    layout.others.length > 0 && (layout.tops.length > 0 || layout.bottoms.length > 0);
  layout.usesFullHeightForOthers =
    layout.others.length > 0 && layout.tops.length === 0 && layout.bottoms.length === 0;

  return layout;
}
