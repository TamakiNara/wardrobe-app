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
  OutfitThumbnailRepresentatives,
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

function buildThumbnailLayoutInput(outfitItems: OutfitColorThumbnailItem[]) {
  return toLayoutItems(outfitItems);
}

function buildLowerBodyPreviewInput(outfitItems: OutfitColorThumbnailItem[]) {
  return toLowerBodyPreviewItems(outfitItems);
}

function buildStandardThumbnailLayout(outfitItems: OutfitColorThumbnailItem[]) {
  return buildOutfitThumbnailLayout(buildThumbnailLayoutInput(outfitItems));
}

function buildOnepieceAllinoneThumbnailLayout(
  outfitItems: OutfitColorThumbnailItem[],
) {
  // current では onepiece_allinone 専用 mode のときだけ、
  // 色帯レイアウトから onepiece_allinone 本体を外して専用レイヤーで描く。
  return buildOutfitThumbnailLayout(buildThumbnailLayoutInput(outfitItems), {
    excludeOnepieceAllinone: true,
  });
}

function resolveItemColorHexes(
  colors: OutfitColorThumbnailItem["item"]["colors"],
) {
  return {
    mainColorHex: findMainColorHex(colors),
    subColorHex: findSubColorHex(colors),
  };
}

function resolveTopsOnepieceAllinoneLayerOrder(
  sortedOutfitItems: OutfitColorThumbnailItem[],
  representativeOnepieceAllinoneSortOrder: number,
) {
  const topsItems = sortedOutfitItems.filter(
    (outfitItem) => outfitItem.item.category === "tops",
  );
  const highestTopSortOrder = topsItems.length
    ? Math.max(...topsItems.map((outfitItem) => outfitItem.sort_order))
    : null;
  const topsAreAboveOnepieceAllinone =
    highestTopSortOrder !== null &&
    highestTopSortOrder > representativeOnepieceAllinoneSortOrder;
  const topsAreBelowOnepieceAllinone =
    highestTopSortOrder !== null &&
    highestTopSortOrder < representativeOnepieceAllinoneSortOrder;

  return {
    topsAreAboveOnepieceAllinone,
    topsAreBelowOnepieceAllinone,
  };
}

function hasVisibleOnepieceAllinoneLowerBody(params: {
  onepieceAllinoneLowerBodyPreview:
    | OutfitLowerBodyPreviewSource
    | OutfitOnepieceAllinoneLowerBodyPreviewSource
    | null;
  shouldRenderOnepieceWithBottomsLayer: boolean;
}) {
  const {
    onepieceAllinoneLowerBodyPreview,
    shouldRenderOnepieceWithBottomsLayer,
  } = params;

  // current 特例:
  // - onepiece + bottoms は裾見せ補助レイヤーとして lower-body を見せる
  // - allinone + bottoms は専用 mode へ入らないので、この判定には来ない
  return (
    onepieceAllinoneLowerBodyPreview !== null &&
    (shouldRenderOnepieceWithBottomsLayer ||
      onepieceAllinoneLowerBodyPreview.lengthType !== "full")
  );
}

function resolveOnepieceAllinoneLayerStyle(params: {
  topsAreBelowOnepieceAllinone: boolean;
  shouldRenderOnepieceWithBottomsLayer: boolean;
  onepieceAllinoneHasVisibleLowerBody: boolean;
}) {
  const {
    topsAreBelowOnepieceAllinone,
    shouldRenderOnepieceWithBottomsLayer,
    onepieceAllinoneHasVisibleLowerBody,
  } = params;

  return {
    // tops と onepiece_allinone の前後は current でも sort_order 正本。
    top: topsAreBelowOnepieceAllinone ? "12%" : "0",
    bottom: shouldRenderOnepieceWithBottomsLayer
      ? "12%"
      : onepieceAllinoneHasVisibleLowerBody
        ? "22%"
        : "0",
  };
}

export function buildStandardOutfitThumbnailViewModel(params: {
  sortedOutfitItems: OutfitColorThumbnailItem[];
  skinToneColor: string;
}): OutfitStandardThumbnailViewModel {
  const { sortedOutfitItems, skinToneColor } = params;
  const lowerBodyPreviewItems = buildLowerBodyPreviewInput(sortedOutfitItems);
  const layout = buildStandardThumbnailLayout(sortedOutfitItems);
  const lowerBodyPreview = buildOutfitLowerBodyPreviewSource(
    lowerBodyPreviewItems,
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
  representatives: OutfitThumbnailRepresentatives;
  modeResolution: OutfitThumbnailModeResolution;
  skinToneColor: string;
}): OutfitOnepieceAllinoneThumbnailViewModel {
  const { sortedOutfitItems, representatives, modeResolution, skinToneColor } =
    params;
  const { representativeOnepieceAllinone } = representatives;
  const { shouldRenderOnepieceWithBottomsLayer } = modeResolution;

  if (representativeOnepieceAllinone === null) {
    throw new Error(
      "buildOnepieceAllinoneThumbnailViewModel requires onepiece_allinone representative item.",
    );
  }

  const lowerBodyPreviewItems = buildLowerBodyPreviewInput(sortedOutfitItems);
  const layout = buildOnepieceAllinoneThumbnailLayout(sortedOutfitItems);
  const lowerBodyPreview = buildOutfitLowerBodyPreviewSource(
    lowerBodyPreviewItems,
  );
  const onepieceAllinoneLowerBodyPreview = shouldRenderOnepieceWithBottomsLayer
    ? lowerBodyPreview
    : buildOutfitOnepieceAllinoneLowerBodyPreviewSource(lowerBodyPreviewItems);
  const { topsAreAboveOnepieceAllinone, topsAreBelowOnepieceAllinone } =
    resolveTopsOnepieceAllinoneLayerOrder(
      sortedOutfitItems,
      representativeOnepieceAllinone.sort_order,
    );
  const onepieceAllinoneHasVisibleLowerBody =
    hasVisibleOnepieceAllinoneLowerBody({
      onepieceAllinoneLowerBodyPreview,
      shouldRenderOnepieceWithBottomsLayer,
    });
  const {
    mainColorHex: onepieceAllinoneMainColorHex,
    subColorHex: onepieceAllinoneSubColorHex,
  } = resolveItemColorHexes(representativeOnepieceAllinone.item.colors);
  const onepieceAllinoneLayerStyle = resolveOnepieceAllinoneLayerStyle({
    topsAreBelowOnepieceAllinone,
    shouldRenderOnepieceWithBottomsLayer,
    onepieceAllinoneHasVisibleLowerBody,
  });

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
