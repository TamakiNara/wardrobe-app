import {
  buildColorThumbnailLayout,
  COLOR_THUMBNAIL_FALLBACK_COLOR,
} from "@/lib/color-thumbnails/shared";
import type { WearLogThumbnailItem } from "@/types/wear-logs";

export type WearLogThumbnailGroupKey = "tops" | "bottoms" | "others";

export type WearLogThumbnailSegment = {
  id: number;
  mainColorHex: string;
  subColorHex: string | null;
};

export type WearLogThumbnailLayout = {
  tops: WearLogThumbnailSegment[];
  bottoms: WearLogThumbnailSegment[];
  others: WearLogThumbnailSegment[];
  hasOthersBar: boolean;
  usesFullHeightForOthers: boolean;
};

export function getWearLogThumbnailFallbackColor() {
  return COLOR_THUMBNAIL_FALLBACK_COLOR;
}

export function buildWearLogThumbnailLayout(
  items: WearLogThumbnailItem[],
  options?: {
    excludeLegwear?: boolean;
    excludeOnepieceAllinone?: boolean;
  },
): WearLogThumbnailLayout {
  const excludedCategories = options?.excludeLegwear ? ["legwear"] : [];

  if (options?.excludeOnepieceAllinone) {
    excludedCategories.push("onepiece_allinone");
  }

  return buildColorThumbnailLayout(
    items.map((item, index) => ({
      id: item.source_item_id ?? -1 * (index + 1),
      category: item.category,
      colors: item.colors,
    })),
    {
      fallbackWhenEmpty: true,
      emptyFallbackId: -1,
      excludedCategories,
    },
  );
}
