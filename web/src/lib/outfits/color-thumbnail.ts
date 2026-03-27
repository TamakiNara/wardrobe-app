type OutfitItemColor = {
  role: "main" | "sub";
  hex: string;
  label: string;
};

type OutfitThumbnailItem = {
  id: number;
  category: string;
  colors: OutfitItemColor[];
};

export type OutfitThumbnailGroupKey = "tops" | "bottoms" | "others";

export type OutfitThumbnailSegment = {
  id: number;
  mainColorHex: string;
  subColorHex: string | null;
};

export type OutfitThumbnailLayout = {
  tops: OutfitThumbnailSegment[];
  bottoms: OutfitThumbnailSegment[];
  others: OutfitThumbnailSegment[];
  hasOthersBar: boolean;
  usesFullHeightForOthers: boolean;
};

const THUMBNAIL_FALLBACK_COLOR = "#E5E7EB";

function resolveGroup(category: string): OutfitThumbnailGroupKey {
  if (category === "tops") {
    return "tops";
  }

  if (category === "bottoms") {
    return "bottoms";
  }

  return "others";
}

function buildSegment(item: OutfitThumbnailItem): OutfitThumbnailSegment {
  const mainColor = item.colors.find((color) => color.role === "main");
  const subColor = item.colors.find((color) => color.role === "sub");

  return {
    id: item.id,
    mainColorHex: mainColor?.hex ?? THUMBNAIL_FALLBACK_COLOR,
    subColorHex: subColor?.hex ?? null,
  };
}

export function getOutfitThumbnailFallbackColor() {
  return THUMBNAIL_FALLBACK_COLOR;
}

export function buildOutfitThumbnailLayout(
  items: OutfitThumbnailItem[],
): OutfitThumbnailLayout {
  const layout: OutfitThumbnailLayout = {
    tops: [],
    bottoms: [],
    others: [],
    hasOthersBar: false,
    usesFullHeightForOthers: false,
  };

  items.forEach((item) => {
    const group = resolveGroup(item.category);
    layout[group].push(buildSegment(item));
  });

  layout.hasOthersBar = layout.others.length > 0 && (layout.tops.length > 0 || layout.bottoms.length > 0);
  layout.usesFullHeightForOthers =
    layout.others.length > 0 && layout.tops.length === 0 && layout.bottoms.length === 0;

  return layout;
}
