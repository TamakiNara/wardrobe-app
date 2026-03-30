import type { ItemSpec } from "@/types/items";

export type OutfitColorThumbnailItemColor = {
  role: "main" | "sub";
  mode: "preset" | "custom";
  value: string;
  hex: string;
  label: string;
};

export type OutfitColorThumbnailItem = {
  id: number;
  item_id: number;
  sort_order: number;
  item: {
    id: number;
    name: string | null;
    category: string;
    shape: string;
    colors: OutfitColorThumbnailItemColor[];
    spec?: ItemSpec | null;
  };
};

export type OutfitThumbnailMode = "standard" | "onepiece_allinone";

export type OutfitThumbnailModeResolution = {
  mode: OutfitThumbnailMode;
  representativeOnepieceAllinone: OutfitColorThumbnailItem | null;
  shouldRenderOnepieceWithBottomsLayer: boolean;
};

export function sortOutfitColorThumbnailItems(
  outfitItems: OutfitColorThumbnailItem[],
) {
  return [...outfitItems].sort(
    (left, right) => left.sort_order - right.sort_order,
  );
}

export function resolveOutfitThumbnailMode(
  outfitItems: OutfitColorThumbnailItem[],
): OutfitThumbnailModeResolution {
  const sortedOutfitItems = sortOutfitColorThumbnailItems(outfitItems);
  const hasBottoms = sortedOutfitItems.some(
    (outfitItem) => outfitItem.item.category === "bottoms",
  );
  const onepieceAllinoneItems = sortedOutfitItems.filter(
    (outfitItem) => outfitItem.item.category === "onepiece_allinone",
  );
  const representativeOnepieceAllinone =
    onepieceAllinoneItems.length > 0
      ? onepieceAllinoneItems[onepieceAllinoneItems.length - 1]
      : null;
  const shouldRenderOnepieceWithBottomsLayer =
    representativeOnepieceAllinone !== null &&
    representativeOnepieceAllinone.item.shape === "onepiece" &&
    hasBottoms;
  const mode =
    representativeOnepieceAllinone !== null &&
    (hasBottoms === false || shouldRenderOnepieceWithBottomsLayer)
      ? "onepiece_allinone"
      : "standard";

  return {
    mode,
    representativeOnepieceAllinone,
    shouldRenderOnepieceWithBottomsLayer,
  };
}
