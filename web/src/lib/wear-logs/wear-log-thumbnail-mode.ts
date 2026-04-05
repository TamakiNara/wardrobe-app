import {
  selectRepresentativeBottoms as selectOutfitRepresentativeBottoms,
  selectRepresentativeLegwear as selectOutfitRepresentativeLegwear,
  type OutfitLowerBodyPreviewItem,
} from "@/lib/outfits/lower-body-preview";
import type { WearLogThumbnailItem } from "@/types/wear-logs";

export type WearLogThumbnailMode = "standard" | "onepiece_allinone";

export type WearLogThumbnailRepresentatives = {
  representativeOnepieceAllinone: WearLogThumbnailItem | null;
  representativeBottoms: WearLogThumbnailItem | null;
  representativeLegwear: WearLogThumbnailItem | null;
};

export type WearLogThumbnailModeResolution = {
  mode: WearLogThumbnailMode;
  shouldRenderOnepieceWithBottomsLayer: boolean;
};

export function sortWearLogThumbnailItems(items: WearLogThumbnailItem[]) {
  return [...items].sort((left, right) => left.sort_order - right.sort_order);
}

function buildLowerBodyPreviewItems(
  sortedWearLogItems: WearLogThumbnailItem[],
): OutfitLowerBodyPreviewItem[] {
  return sortedWearLogItems.map((item, index) => ({
    sort_order: item.sort_order,
    item: {
      id: item.source_item_id ?? -1 * (index + 1),
      category: item.category ?? "",
      shape: item.shape ?? "",
      colors: item.colors.map((color) => ({
        role: color.role,
        hex: color.hex,
        label: color.label ?? "",
      })),
      spec: item.spec ?? null,
    },
  }));
}

export function selectRepresentativeWearLogBottoms(
  sortedWearLogItems: WearLogThumbnailItem[],
) {
  const representative = selectOutfitRepresentativeBottoms(
    buildLowerBodyPreviewItems(sortedWearLogItems),
  );

  return (
    sortedWearLogItems.find(
      (item, index) =>
        (item.source_item_id ?? -1 * (index + 1)) === representative?.item.id,
    ) ?? null
  );
}

export function selectRepresentativeWearLogLegwear(
  sortedWearLogItems: WearLogThumbnailItem[],
) {
  const representative = selectOutfitRepresentativeLegwear(
    buildLowerBodyPreviewItems(sortedWearLogItems),
  );

  return (
    sortedWearLogItems.find(
      (item, index) =>
        (item.source_item_id ?? -1 * (index + 1)) === representative?.item.id,
    ) ?? null
  );
}

export function selectWearLogThumbnailRepresentatives(
  sortedWearLogItems: WearLogThumbnailItem[],
): WearLogThumbnailRepresentatives {
  const onepieceAllinoneItems = sortedWearLogItems.filter(
    (item) =>
      item.category === "onepiece_allinone" ||
      item.category === "onepiece_dress" ||
      item.category === "allinone",
  );

  return {
    representativeOnepieceAllinone:
      onepieceAllinoneItems.length > 0
        ? onepieceAllinoneItems[onepieceAllinoneItems.length - 1]
        : null,
    // current wear log でも lower-body preview の代表候補は wear_log_items を正本に選ぶ。
    representativeBottoms:
      selectRepresentativeWearLogBottoms(sortedWearLogItems),
    representativeLegwear:
      selectRepresentativeWearLogLegwear(sortedWearLogItems),
  };
}

export function resolveWearLogThumbnailMode(params: {
  sortedWearLogItems: WearLogThumbnailItem[];
  representatives: WearLogThumbnailRepresentatives;
}): WearLogThumbnailModeResolution {
  const { representatives } = params;
  const { representativeOnepieceAllinone, representativeBottoms } =
    representatives;

  if (
    representativeOnepieceAllinone?.shape === "onepiece" &&
    representativeBottoms !== null
  ) {
    return {
      mode: "onepiece_allinone",
      shouldRenderOnepieceWithBottomsLayer: true,
    };
  }

  return {
    mode: "standard",
    shouldRenderOnepieceWithBottomsLayer: false,
  };
}
