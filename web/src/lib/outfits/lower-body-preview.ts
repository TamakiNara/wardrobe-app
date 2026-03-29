import {
  resolveBottomsLengthType,
  resolveBottomsLengthTypeForPreview,
  resolveLegwearCoverageType,
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

function findMainColorHex(colors: OutfitThumbnailColor[]): string | null {
  return colors.find((color) => color.role === "main")?.hex ?? null;
}

function findSubColorHex(colors: OutfitThumbnailColor[]): string | null {
  return colors.find((color) => color.role === "sub")?.hex ?? null;
}

function findRepresentativeBottoms(items: OutfitLowerBodyPreviewItem[]) {
  const bottomsItems = items
    .filter((outfitItem) => outfitItem.item.category === "bottoms")
    .sort((left, right) => left.sort_order - right.sort_order);

  return (
    bottomsItems.find((outfitItem) =>
      Boolean(
        resolveBottomsLengthType(outfitItem.item.spec?.bottoms?.length_type),
      ),
    ) ??
    bottomsItems[0] ??
    null
  );
}

function findRepresentativeLegwear(items: OutfitLowerBodyPreviewItem[]) {
  return items
    .filter((outfitItem) => outfitItem.item.category === "legwear")
    .sort((left, right) => left.sort_order - right.sort_order)
    .find((outfitItem) =>
      Boolean(
        resolveLegwearCoverageType(
          outfitItem.item.category,
          outfitItem.item.shape,
          outfitItem.item.spec?.legwear?.coverage_type,
        ),
      ),
    );
}

export function buildOutfitLowerBodyPreviewSource(
  items: OutfitLowerBodyPreviewItem[],
): OutfitLowerBodyPreviewSource | null {
  const representativeBottoms = findRepresentativeBottoms(items);

  if (representativeBottoms === null) {
    return null;
  }

  const representativeLegwear = findRepresentativeLegwear(items);
  const coverageType = representativeLegwear
    ? resolveLegwearCoverageType(
        representativeLegwear.item.category,
        representativeLegwear.item.shape,
        representativeLegwear.item.spec?.legwear?.coverage_type,
      )
    : null;

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
