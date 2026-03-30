import {
  buildOutfitLowerBodyPreviewSource,
  type OutfitLowerBodyPreviewSource,
  type OutfitLowerBodyPreviewItem,
} from "@/lib/outfits/lower-body-preview";
import {
  resolveOnepieceAllinoneLayerStyle,
  resolveThumbnailMainSubColorHexes,
  resolveTopsOnepieceAllinoneLayerOrder,
} from "@/lib/color-thumbnails/onepiece-allinone-shared";
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
      sortedWearLogItems.map((item) => ({
        category: item.category,
        sortOrder: item.sort_order,
      })),
      representativeOnepieceAllinone.sort_order,
    );
  const onepieceAllinoneLayerStyle = resolveOnepieceAllinoneLayerStyle({
    topsAreBelowOnepieceAllinone,
    shouldRenderBottomsLayer: true,
    onepieceAllinoneHasVisibleLowerBody: true,
  });
  const {
    mainColorHex: onepieceAllinoneMainColorHex,
    subColorHex: onepieceAllinoneSubColorHex,
  } = resolveThumbnailMainSubColorHexes(representativeOnepieceAllinone.colors);

  return {
    layout,
    onepieceAllinoneLowerBodyPreview,
    onepieceAllinoneMainColorHex,
    onepieceAllinoneSubColorHex,
    topsAreAboveOnepieceAllinone,
    topsAreBelowOnepieceAllinone,
    onepieceAllinoneLayerStyle,
    skinToneColor,
  };
}
