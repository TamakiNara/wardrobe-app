import { COLOR_THUMBNAIL_FALLBACK_COLOR } from "@/lib/color-thumbnails/shared";

type ThumbnailColor = {
  role: "main" | "sub";
  hex: string;
};

type ThumbnailLayerOrderItem = {
  category: string | null | undefined;
  sortOrder: number;
};

export type OnepieceAllinoneThumbnailDensity = "default" | "compact";

export type OnepieceAllinoneLayoutMetrics = {
  topUnderlayHeight: string;
  topOverlayHeight: string;
  lowerBodyHeight: string;
  layerStyle: {
    top: string;
    bottom: string;
  };
};

export function resolveThumbnailMainSubColorHexes(colors: ThumbnailColor[]) {
  const mainColor = colors.find((color) => color.role === "main");
  const subColor = colors.find((color) => color.role === "sub");

  return {
    mainColorHex: mainColor?.hex ?? COLOR_THUMBNAIL_FALLBACK_COLOR,
    subColorHex: subColor?.hex ?? null,
  };
}

export function resolveTopsOnepieceAllinoneLayerOrder(
  items: ThumbnailLayerOrderItem[],
  representativeOnepieceAllinoneSortOrder: number,
) {
  const topsItems = items.filter((item) => item.category === "tops");
  const highestTopSortOrder = topsItems.length
    ? Math.max(...topsItems.map((item) => item.sortOrder))
    : null;

  return {
    topsAreAboveOnepieceAllinone:
      highestTopSortOrder !== null &&
      highestTopSortOrder > representativeOnepieceAllinoneSortOrder,
    topsAreBelowOnepieceAllinone:
      highestTopSortOrder !== null &&
      highestTopSortOrder < representativeOnepieceAllinoneSortOrder,
  };
}

export function resolveOnepieceAllinoneLayerStyle(params: {
  topsAreBelowOnepieceAllinone: boolean;
  shouldRenderBottomsLayer: boolean;
  onepieceAllinoneHasVisibleLowerBody: boolean;
  topOffset?: string;
  bottomsLayerBottom?: string;
  visibleLowerBodyBottom?: string;
  noLowerBodyBottom?: string;
}) {
  const {
    topsAreBelowOnepieceAllinone,
    shouldRenderBottomsLayer,
    onepieceAllinoneHasVisibleLowerBody,
    topOffset = "12%",
    bottomsLayerBottom = "12%",
    visibleLowerBodyBottom = "22%",
    noLowerBodyBottom = "0",
  } = params;

  return {
    top: topsAreBelowOnepieceAllinone ? topOffset : "0",
    bottom: shouldRenderBottomsLayer
      ? bottomsLayerBottom
      : onepieceAllinoneHasVisibleLowerBody
        ? visibleLowerBodyBottom
        : noLowerBodyBottom,
  };
}

export function resolveOnepieceAllinoneLayoutMetrics(params: {
  density: OnepieceAllinoneThumbnailDensity;
  topsAreBelowOnepieceAllinone: boolean;
  shouldRenderBottomsLayer: boolean;
  onepieceAllinoneHasVisibleLowerBody: boolean;
}): OnepieceAllinoneLayoutMetrics {
  const {
    topsAreBelowOnepieceAllinone,
    shouldRenderBottomsLayer,
    onepieceAllinoneHasVisibleLowerBody,
  } = params;
  // compact は小さい thumbnail variant を区別するために残すが、
  // current では一覧と詳細で構造比率を変えない。
  const topOffset = "12%";

  return {
    topUnderlayHeight: topOffset,
    topOverlayHeight: "40%",
    lowerBodyHeight: shouldRenderBottomsLayer ? "20%" : "34%",
    layerStyle: resolveOnepieceAllinoneLayerStyle({
      topsAreBelowOnepieceAllinone,
      shouldRenderBottomsLayer,
      onepieceAllinoneHasVisibleLowerBody,
      topOffset,
    }),
  };
}
