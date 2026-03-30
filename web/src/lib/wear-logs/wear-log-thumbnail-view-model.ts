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

export function buildStandardWearLogThumbnailViewModel(params: {
  sortedWearLogItems: WearLogThumbnailItem[];
  representatives: WearLogThumbnailRepresentatives;
  modeResolution: WearLogThumbnailModeResolution;
}): WearLogStandardThumbnailViewModel {
  const { sortedWearLogItems } = params;
  const layout = buildWearLogThumbnailLayout(
    buildThumbnailLayoutInput(sortedWearLogItems),
    {
      // current では legwear を others へ流さず、lower-body preview 専用責務に寄せる。
      excludeLegwear: true,
    },
  );
  const lowerBodyPreview = buildOutfitLowerBodyPreviewSource(
    buildLowerBodyPreviewInput(sortedWearLogItems),
  );
  const hasTopBottomSplit = layout.tops.length > 0 && layout.bottoms.length > 0;

  return {
    layout,
    lowerBodyPreview,
    hasTopBottomSplit,
  };
}
