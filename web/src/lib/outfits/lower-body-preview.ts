import {
  resolveBottomsLengthType,
  resolveBottomsLengthTypeForPreview,
  resolveLegwearCoverageType,
  resolveLegwearCoverageTypeForPreview,
} from "@/lib/master-data/item-skin-exposure";
import type { ItemSpec } from "@/types/items";

type OutfitThumbnailColor = {
  role: "main" | "sub";
  hex: string;
  label: string;
};

export type OutfitLowerBodyPreviewItem = {
  sort_order: number;
  item: {
    id: number;
    category: string;
    shape: string;
    colors: OutfitThumbnailColor[];
    spec?: ItemSpec | null;
  };
};

export type OutfitLowerBodyPreviewSource = {
  representativeBottomsItemId: number;
  representativeLegwearItemId: number | null;
  lengthType: string;
  coverageType: string | null;
  bottomsMainColor: string | null;
  bottomsSubColor: string | null;
  legwearMainColor: string | null;
  legwearSubColor: string | null;
};

export type OutfitOnepieceAllinoneLowerBodyPreviewSource = {
  representativeOnepieceAllinoneItemId: number;
  representativeLegwearItemId: number | null;
  lengthType: string;
  coverageType: string | null;
  legwearMainColor: string | null;
  legwearSubColor: string | null;
};

function findMainColorHex(colors: OutfitThumbnailColor[]): string | null {
  return colors.find((color) => color.role === "main")?.hex ?? null;
}

function findSubColorHex(colors: OutfitThumbnailColor[]): string | null {
  return colors.find((color) => color.role === "sub")?.hex ?? null;
}

function sortBySortOrder(items: OutfitLowerBodyPreviewItem[]) {
  return [...items].sort((left, right) => left.sort_order - right.sort_order);
}

function filterBottoms(items: OutfitLowerBodyPreviewItem[]) {
  return sortBySortOrder(
    items.filter(
      (outfitItem) =>
        outfitItem.item.category === "bottoms" ||
        outfitItem.item.category === "pants" ||
        outfitItem.item.category === "skirts",
    ),
  );
}

function filterLegwear(items: OutfitLowerBodyPreviewItem[]) {
  return sortBySortOrder(
    items.filter((outfitItem) => outfitItem.item.category === "legwear"),
  );
}

function filterOnepieceAllinone(items: OutfitLowerBodyPreviewItem[]) {
  return sortBySortOrder(
    items.filter(
      (outfitItem) =>
        outfitItem.item.category === "onepiece_allinone" ||
        outfitItem.item.category === "onepiece_dress" ||
        outfitItem.item.category === "allinone",
    ),
  );
}

function hasValidBottomsLengthType(item: OutfitLowerBodyPreviewItem) {
  return Boolean(
    resolveBottomsLengthType(item.item.spec?.bottoms?.length_type),
  );
}

function hasValidLegwearCoverageType(item: OutfitLowerBodyPreviewItem) {
  return Boolean(
    resolveLegwearCoverageType(
      item.item.category,
      item.item.shape,
      item.item.spec?.legwear?.coverage_type,
    ),
  );
}

function isLegwearFallbackCandidate(item: OutfitLowerBodyPreviewItem) {
  return item.item.shape === "tights" || item.item.shape === "stockings";
}

function resolveRepresentativeLegwearCoverageType(
  representativeLegwear: OutfitLowerBodyPreviewItem | null,
) {
  // legwear は current でも lower-body 専用責務。
  // coverage の欠落時 fallback もここで閉じて解決する。
  return representativeLegwear
    ? resolveLegwearCoverageTypeForPreview(
        representativeLegwear.item.category,
        representativeLegwear.item.shape,
        representativeLegwear.item.spec?.legwear?.coverage_type,
      )
    : null;
}

export function selectRepresentativeBottoms(
  items: OutfitLowerBodyPreviewItem[],
) {
  const bottomsItems = filterBottoms(items);

  return (
    bottomsItems.find((outfitItem) => hasValidBottomsLengthType(outfitItem)) ??
    bottomsItems[0] ??
    null
  );
}

export function selectRepresentativeLegwear(
  items: OutfitLowerBodyPreviewItem[],
) {
  const legwearItems = filterLegwear(items);
  // tights / stockings は fixed coverage_type を持つため、
  // spec 未入力でも representative 候補から外さない。
  const fallbackLegwear = legwearItems.find((outfitItem) =>
    isLegwearFallbackCandidate(outfitItem),
  );

  return (
    legwearItems.find((outfitItem) =>
      hasValidLegwearCoverageType(outfitItem),
    ) ??
    fallbackLegwear ??
    legwearItems[0] ??
    null
  );
}

export function selectRepresentativeOnepieceAllinone(
  items: OutfitLowerBodyPreviewItem[],
) {
  const onepieceAllinoneItems = filterOnepieceAllinone(items);

  return onepieceAllinoneItems[onepieceAllinoneItems.length - 1] ?? null;
}

export function buildOutfitLowerBodyPreviewSource(
  items: OutfitLowerBodyPreviewItem[],
): OutfitLowerBodyPreviewSource | null {
  const representativeBottoms = selectRepresentativeBottoms(items);

  if (representativeBottoms === null) {
    return null;
  }

  const representativeLegwear = selectRepresentativeLegwear(items);
  const coverageType = resolveRepresentativeLegwearCoverageType(
    representativeLegwear,
  );

  return {
    representativeBottomsItemId: representativeBottoms.item.id,
    representativeLegwearItemId: representativeLegwear?.item.id ?? null,
    lengthType: resolveBottomsLengthTypeForPreview(
      representativeBottoms.item.spec?.bottoms?.length_type,
    ),
    coverageType,
    bottomsMainColor: findMainColorHex(representativeBottoms.item.colors),
    bottomsSubColor: findSubColorHex(representativeBottoms.item.colors),
    legwearMainColor: representativeLegwear
      ? findMainColorHex(representativeLegwear.item.colors)
      : null,
    legwearSubColor: representativeLegwear
      ? findSubColorHex(representativeLegwear.item.colors)
      : null,
  };
}

export function buildOutfitOnepieceAllinoneLowerBodyPreviewSource(
  items: OutfitLowerBodyPreviewItem[],
): OutfitOnepieceAllinoneLowerBodyPreviewSource | null {
  const representativeOnepieceAllinone =
    selectRepresentativeOnepieceAllinone(items);

  if (representativeOnepieceAllinone === null) {
    return null;
  }

  const representativeLegwear = selectRepresentativeLegwear(items);
  const coverageType = resolveRepresentativeLegwearCoverageType(
    representativeLegwear,
  );

  return {
    representativeOnepieceAllinoneItemId:
      representativeOnepieceAllinone.item.id,
    representativeLegwearItemId: representativeLegwear?.item.id ?? null,
    // current では onepiece は固定の裾見せ、allinone は full 扱い。
    lengthType:
      representativeOnepieceAllinone.item.shape === "allinone"
        ? "full"
        : "cropped",
    coverageType,
    legwearMainColor: representativeLegwear
      ? findMainColorHex(representativeLegwear.item.colors)
      : null,
    legwearSubColor: representativeLegwear
      ? findSubColorHex(representativeLegwear.item.colors)
      : null,
  };
}
