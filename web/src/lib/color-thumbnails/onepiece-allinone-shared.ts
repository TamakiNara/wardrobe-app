import { COLOR_THUMBNAIL_FALLBACK_COLOR } from "@/lib/color-thumbnails/shared";

type ThumbnailColor = {
  role: "main" | "sub";
  hex: string;
};

type ThumbnailLayerOrderItem = {
  category: string | null | undefined;
  sortOrder: number;
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
  bottomsLayerBottom?: string;
  visibleLowerBodyBottom?: string;
  noLowerBodyBottom?: string;
}) {
  const {
    topsAreBelowOnepieceAllinone,
    shouldRenderBottomsLayer,
    onepieceAllinoneHasVisibleLowerBody,
    bottomsLayerBottom = "12%",
    visibleLowerBodyBottom = "22%",
    noLowerBodyBottom = "0",
  } = params;

  return {
    top: topsAreBelowOnepieceAllinone ? "12%" : "0",
    bottom: shouldRenderBottomsLayer
      ? bottomsLayerBottom
      : onepieceAllinoneHasVisibleLowerBody
        ? visibleLowerBodyBottom
        : noLowerBodyBottom,
  };
}
