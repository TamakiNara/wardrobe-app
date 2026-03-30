import type { WearLogThumbnailItem } from "@/types/wear-logs";

export type WearLogThumbnailMode = "standard" | "onepiece_allinone";

export type WearLogThumbnailRepresentatives = {
  representativeOnepieceAllinone: WearLogThumbnailItem | null;
};

export type WearLogThumbnailModeResolution = {
  mode: WearLogThumbnailMode;
};

export function sortWearLogThumbnailItems(items: WearLogThumbnailItem[]) {
  return [...items].sort((left, right) => left.sort_order - right.sort_order);
}

export function selectWearLogThumbnailRepresentatives(
  sortedWearLogItems: WearLogThumbnailItem[],
): WearLogThumbnailRepresentatives {
  const onepieceAllinoneItems = sortedWearLogItems.filter(
    (item) => item.category === "onepiece_allinone",
  );

  return {
    representativeOnepieceAllinone:
      onepieceAllinoneItems.length > 0
        ? onepieceAllinoneItems[onepieceAllinoneItems.length - 1]
        : null,
  };
}

export function resolveWearLogThumbnailMode(_: {
  sortedWearLogItems: WearLogThumbnailItem[];
  representatives: WearLogThumbnailRepresentatives;
}): WearLogThumbnailModeResolution {
  // current では wear_log_items 正本の既存レイアウトを維持し、
  // onepiece_allinone 専用 mode はまだ導入しない。
  return {
    mode: "standard",
  };
}
