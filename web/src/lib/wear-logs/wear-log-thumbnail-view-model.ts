import {
  buildOutfitLowerBodyPreviewSource,
  type OutfitLowerBodyPreviewSource,
  type OutfitLowerBodyPreviewItem,
} from "@/lib/outfits/lower-body-preview";
import { buildWearLogThumbnailLayout } from "@/lib/wear-logs/color-thumbnail";
import type { WearLogThumbnailItem } from "@/types/wear-logs";
import type {
  WearLogThumbnailModeResolution,
  WearLogThumbnailRepresentatives,
} from "@/lib/wear-logs/wear-log-thumbnail-mode";

export type WearLogStandardThumbnailViewModel = {
  layout: ReturnType<typeof buildWearLogThumbnailLayout>;
  lowerBodyPreview: OutfitLowerBodyPreviewSource | null;
  hasTopBottomSplit: boolean;
  skinToneColor: string;
};

export type WearLogOnepieceAllinoneThumbnailViewModel = {
  layout: ReturnType<typeof buildWearLogThumbnailLayout>;
  onepieceAllinoneLowerBodyPreview: OutfitLowerBodyPreviewSource | null;
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

function buildThumbnailLayoutInput(items: WearLogThumbnailItem[]) {
  return items;
}

function buildLowerBodyPreviewInput(
  items: WearLogThumbnailItem[],
): OutfitLowerBodyPreviewItem[] {
  return items.map((item, index) => ({
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

function buildStandardThumbnailLayout(items: WearLogThumbnailItem[]) {
  return buildWearLogThumbnailLayout(buildThumbnailLayoutInput(items), {
    // current では legwear を others へ流さず、lower-body preview 専用責務に寄せる。
    excludeLegwear: true,
  });
}

function buildOnepieceAllinoneThumbnailLayout(items: WearLogThumbnailItem[]) {
  return buildWearLogThumbnailLayout(buildThumbnailLayoutInput(items), {
    excludeLegwear: true,
    excludeOnepieceAllinone: true,
  });
}

function findMainColorHex(colors: WearLogThumbnailItem["colors"]) {
  return colors.find((color) => color.role === "main")?.hex ?? "#E5E7EB";
}

function findSubColorHex(colors: WearLogThumbnailItem["colors"]) {
  return colors.find((color) => color.role === "sub")?.hex ?? null;
}

function resolveTopsOnepieceAllinoneLayerOrder(
  sortedWearLogItems: WearLogThumbnailItem[],
  representativeOnepieceAllinoneSortOrder: number,
) {
  const topsItems = sortedWearLogItems.filter(
    (item) => item.category === "tops",
  );
  const highestTopSortOrder = topsItems.length
    ? Math.max(...topsItems.map((item) => item.sort_order))
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

function resolveOnepieceAllinoneLayerStyle(params: {
  topsAreBelowOnepieceAllinone: boolean;
}) {
  return {
    top: params.topsAreBelowOnepieceAllinone ? "12%" : "0",
    bottom: "12%",
  };
}

export function buildStandardWearLogThumbnailViewModel(params: {
  sortedWearLogItems: WearLogThumbnailItem[];
  representatives: WearLogThumbnailRepresentatives;
  modeResolution: WearLogThumbnailModeResolution;
  skinToneColor: string;
}): WearLogStandardThumbnailViewModel {
  const { sortedWearLogItems, skinToneColor } = params;
  const layout = buildStandardThumbnailLayout(sortedWearLogItems);
  const lowerBodyPreview = buildOutfitLowerBodyPreviewSource(
    buildLowerBodyPreviewInput(sortedWearLogItems),
  );
  const hasTopBottomSplit = layout.tops.length > 0 && layout.bottoms.length > 0;

  return {
    layout,
    lowerBodyPreview,
    hasTopBottomSplit,
    skinToneColor,
  };
}

export function buildOnepieceAllinoneWearLogThumbnailViewModel(params: {
  sortedWearLogItems: WearLogThumbnailItem[];
  representatives: WearLogThumbnailRepresentatives;
  modeResolution: WearLogThumbnailModeResolution;
  skinToneColor: string;
}): WearLogOnepieceAllinoneThumbnailViewModel {
  const { sortedWearLogItems, representatives, modeResolution, skinToneColor } =
    params;
  void modeResolution;
  const { representativeOnepieceAllinone } = representatives;

  if (representativeOnepieceAllinone === null) {
    throw new Error(
      "buildOnepieceAllinoneWearLogThumbnailViewModel requires onepiece_allinone representative item.",
    );
  }

  const layout = buildOnepieceAllinoneThumbnailLayout(sortedWearLogItems);
  const onepieceAllinoneLowerBodyPreview = buildOutfitLowerBodyPreviewSource(
    buildLowerBodyPreviewInput(sortedWearLogItems),
  );
  const { topsAreAboveOnepieceAllinone, topsAreBelowOnepieceAllinone } =
    resolveTopsOnepieceAllinoneLayerOrder(
      sortedWearLogItems,
      representativeOnepieceAllinone.sort_order,
    );
  const onepieceAllinoneLayerStyle = resolveOnepieceAllinoneLayerStyle({
    topsAreBelowOnepieceAllinone,
  });

  return {
    layout,
    onepieceAllinoneLowerBodyPreview,
    onepieceAllinoneMainColorHex: findMainColorHex(
      representativeOnepieceAllinone.colors,
    ),
    onepieceAllinoneSubColorHex: findSubColorHex(
      representativeOnepieceAllinone.colors,
    ),
    topsAreAboveOnepieceAllinone,
    topsAreBelowOnepieceAllinone,
    onepieceAllinoneLayerStyle,
    skinToneColor,
  };
}
