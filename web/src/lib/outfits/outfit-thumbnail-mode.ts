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

export type OutfitThumbnailRepresentatives = {
  representativeOnepieceAllinone: OutfitColorThumbnailItem | null;
};

export type OutfitThumbnailModeResolution = {
  mode: OutfitThumbnailMode;
  shouldRenderOnepieceWithBottomsLayer: boolean;
};

export function sortOutfitColorThumbnailItems(
  outfitItems: OutfitColorThumbnailItem[],
) {
  return [...outfitItems].sort(
    (left, right) => left.sort_order - right.sort_order,
  );
}

export function selectOutfitThumbnailRepresentatives(
  sortedOutfitItems: OutfitColorThumbnailItem[],
): OutfitThumbnailRepresentatives {
  const onepieceAllinoneItems = sortedOutfitItems.filter(
    (outfitItem) =>
      outfitItem.item.category === "onepiece_allinone" ||
      outfitItem.item.category === "onepiece_dress" ||
      outfitItem.item.category === "allinone",
  );
  const representativeOnepieceAllinone =
    onepieceAllinoneItems.length > 0
      ? onepieceAllinoneItems[onepieceAllinoneItems.length - 1]
      : null;

  return {
    representativeOnepieceAllinone,
  };
}

export function resolveOutfitThumbnailMode(params: {
  sortedOutfitItems: OutfitColorThumbnailItem[];
  representatives: OutfitThumbnailRepresentatives;
}): OutfitThumbnailModeResolution {
  const { sortedOutfitItems, representatives } = params;
  const hasBottoms = sortedOutfitItems.some(
    (outfitItem) =>
      outfitItem.item.category === "bottoms" ||
      outfitItem.item.category === "pants" ||
      outfitItem.item.category === "skirts",
  );
  const { representativeOnepieceAllinone } = representatives;
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
    shouldRenderOnepieceWithBottomsLayer,
  };
}
