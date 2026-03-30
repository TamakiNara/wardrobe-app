import { buildOutfitThumbnailLayout } from "@/lib/outfits/color-thumbnail";
import {
  buildOutfitLowerBodyPreviewSource,
  buildOutfitOnepieceAllinoneLowerBodyPreviewSource,
  type OutfitLowerBodyPreviewItem,
  type OutfitLowerBodyPreviewSource,
  type OutfitOnepieceAllinoneLowerBodyPreviewSource,
} from "@/lib/outfits/lower-body-preview";
import type {
  OutfitColorThumbnailItem,
  OutfitThumbnailModeResolution,
} from "@/lib/outfits/outfit-thumbnail-mode";

export type OutfitStandardThumbnailViewModel = {
  layout: ReturnType<typeof buildOutfitThumbnailLayout>;
  lowerBodyPreview: OutfitLowerBodyPreviewSource | null;
  hasTopBottomSplit: boolean;
  skinToneColor: string;
};

export type OutfitOnepieceAllinoneThumbnailViewModel = {
  layout: ReturnType<typeof buildOutfitThumbnailLayout>;
  representativeOnepieceAllinoneItemId: number;
  shouldRenderOnepieceWithBottomsLayer: boolean;
  onepieceAllinoneLowerBodyPreview:
    | OutfitLowerBodyPreviewSource
    | OutfitOnepieceAllinoneLowerBodyPreviewSource
    | null;
  onepieceAllinoneHasVisibleLowerBody: boolean;
  onepieceAllinoneMainColorHex: string | null;
  onepieceAllinoneSubColorHex: string | null;
  topsAreAboveOnepieceAllinone: boolean;
  topsAreBelowOnepieceAllinone: boolean;
  onepieceAllinoneLayerStyle: {
    top: string;
    bottom: string;
  };
  skinToneColor: string;
};

function toLayoutItems(outfitItems: OutfitColorThumbnailItem[]) {
  return outfitItems.map((outfitItem) => ({
    id: outfitItem.item.id,
    category: outfitItem.item.category,
    colors: outfitItem.item.colors,
  }));
}

function toLowerBodyPreviewItems(
  outfitItems: OutfitColorThumbnailItem[],
): OutfitLowerBodyPreviewItem[] {
  return outfitItems.map((outfitItem) => ({
    sort_order: outfitItem.sort_order,
    item: {
      id: outfitItem.item.id,
      category: outfitItem.item.category,
      shape: outfitItem.item.shape,
      colors: outfitItem.item.colors,
      spec: outfitItem.item.spec ?? null,
    },
  }));
}

function findMainColorHex(colors: OutfitColorThumbnailItem["item"]["colors"]) {
  return colors.find((color) => color.role === "main")?.hex ?? "#E5E7EB";
}

function findSubColorHex(
  colors: OutfitColorThumbnailItem["item"]["colors"],
): string | null {
  return colors.find((color) => color.role === "sub")?.hex ?? null;
}

export function buildStandardOutfitThumbnailViewModel(params: {
  sortedOutfitItems: OutfitColorThumbnailItem[];
  skinToneColor: string;
}): OutfitStandardThumbnailViewModel {
  const { sortedOutfitItems, skinToneColor } = params;
  const layout = buildOutfitThumbnailLayout(toLayoutItems(sortedOutfitItems));
  const lowerBodyPreview = buildOutfitLowerBodyPreviewSource(
    toLowerBodyPreviewItems(sortedOutfitItems),
  );
  const hasTopBottomSplit = layout.tops.length > 0 && layout.bottoms.length > 0;

  return {
    layout,
    lowerBodyPreview,
    hasTopBottomSplit,
    skinToneColor,
  };
}

export function buildOnepieceAllinoneThumbnailViewModel(params: {
  sortedOutfitItems: OutfitColorThumbnailItem[];
  modeResolution: OutfitThumbnailModeResolution;
  skinToneColor: string;
}): OutfitOnepieceAllinoneThumbnailViewModel {
  const { sortedOutfitItems, modeResolution, skinToneColor } = params;
  const {
    representativeOnepieceAllinone,
    shouldRenderOnepieceWithBottomsLayer,
  } = modeResolution;

  if (representativeOnepieceAllinone === null) {
    throw new Error(
      "buildOnepieceAllinoneThumbnailViewModel requires onepiece_allinone representative item.",
    );
  }

  const layout = buildOutfitThumbnailLayout(toLayoutItems(sortedOutfitItems), {
    excludeOnepieceAllinone: true,
  });
  const lowerBodyPreview = buildOutfitLowerBodyPreviewSource(
    toLowerBodyPreviewItems(sortedOutfitItems),
  );
  const onepieceAllinoneLowerBodyPreview = shouldRenderOnepieceWithBottomsLayer
    ? lowerBodyPreview
    : buildOutfitOnepieceAllinoneLowerBodyPreviewSource(
        toLowerBodyPreviewItems(sortedOutfitItems),
      );
  const topsItems = sortedOutfitItems.filter(
    (outfitItem) => outfitItem.item.category === "tops",
  );
  const highestTopSortOrder = topsItems.length
    ? Math.max(...topsItems.map((outfitItem) => outfitItem.sort_order))
    : null;
  const topsAreAboveOnepieceAllinone =
    highestTopSortOrder !== null &&
    highestTopSortOrder > representativeOnepieceAllinone.sort_order;
  const topsAreBelowOnepieceAllinone =
    highestTopSortOrder !== null &&
    highestTopSortOrder < representativeOnepieceAllinone.sort_order;
  const onepieceAllinoneHasVisibleLowerBody =
    onepieceAllinoneLowerBodyPreview !== null &&
    (shouldRenderOnepieceWithBottomsLayer ||
      onepieceAllinoneLowerBodyPreview.lengthType !== "full");
  const onepieceAllinoneMainColorHex = findMainColorHex(
    representativeOnepieceAllinone.item.colors,
  );
  const onepieceAllinoneSubColorHex = findSubColorHex(
    representativeOnepieceAllinone.item.colors,
  );
  const onepieceAllinoneLayerStyle = {
    top: topsAreBelowOnepieceAllinone ? "12%" : "0",
    bottom: shouldRenderOnepieceWithBottomsLayer
      ? "12%"
      : onepieceAllinoneHasVisibleLowerBody
        ? "22%"
        : "0",
  };

  return {
    layout,
    representativeOnepieceAllinoneItemId:
      representativeOnepieceAllinone.item.id,
    shouldRenderOnepieceWithBottomsLayer,
    onepieceAllinoneLowerBodyPreview,
    onepieceAllinoneHasVisibleLowerBody,
    onepieceAllinoneMainColorHex,
    onepieceAllinoneSubColorHex,
    topsAreAboveOnepieceAllinone,
    topsAreBelowOnepieceAllinone,
    onepieceAllinoneLayerStyle,
    skinToneColor,
  };
}
