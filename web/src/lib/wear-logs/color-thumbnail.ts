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

const THUMBNAIL_FALLBACK_COLOR = "#E5E7EB";

function resolveGroup(category: string | null): WearLogThumbnailGroupKey {
  if (category === "tops") {
    return "tops";
  }

  if (category === "bottoms") {
    return "bottoms";
  }

  return "others";
}

function buildSegment(item: WearLogThumbnailItem, index: number): WearLogThumbnailSegment {
  const mainColor = item.colors.find((color) => color.role === "main");
  const subColor = item.colors.find((color) => color.role === "sub");

  return {
    id: item.source_item_id ?? -1 * (index + 1),
    mainColorHex: mainColor?.hex ?? THUMBNAIL_FALLBACK_COLOR,
    subColorHex: subColor?.hex ?? null,
  };
}

export function getWearLogThumbnailFallbackColor() {
  return THUMBNAIL_FALLBACK_COLOR;
}

export function buildWearLogThumbnailLayout(
  items: WearLogThumbnailItem[],
): WearLogThumbnailLayout {
  if (items.length === 0) {
    return {
      tops: [],
      bottoms: [],
      others: [{
        id: -1,
        mainColorHex: THUMBNAIL_FALLBACK_COLOR,
        subColorHex: null,
      }],
      hasOthersBar: false,
      usesFullHeightForOthers: true,
    };
  }

  const layout: WearLogThumbnailLayout = {
    tops: [],
    bottoms: [],
    others: [],
    hasOthersBar: false,
    usesFullHeightForOthers: false,
  };

  items.forEach((item, index) => {
    const group = resolveGroup(item.category);
    layout[group].push(buildSegment(item, index));
  });

  layout.hasOthersBar =
    layout.others.length > 0 && (layout.tops.length > 0 || layout.bottoms.length > 0);
  layout.usesFullHeightForOthers =
    layout.others.length > 0 && layout.tops.length === 0 && layout.bottoms.length === 0;

  return layout;
}
