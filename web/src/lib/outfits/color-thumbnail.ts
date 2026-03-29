import {
  buildColorThumbnailLayout,
  COLOR_THUMBNAIL_FALLBACK_COLOR,
} from "@/lib/color-thumbnails/shared";

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

export function getOutfitThumbnailFallbackColor() {
  return COLOR_THUMBNAIL_FALLBACK_COLOR;
}

export function buildOutfitThumbnailLayout(
  items: OutfitThumbnailItem[],
): OutfitThumbnailLayout {
  return buildColorThumbnailLayout(items, {
    excludedCategories: ["legwear"],
  });
}
