import { buildWearLogThumbnailLayout } from "@/lib/wear-logs/color-thumbnail";
import type {
  WearLogThumbnailItem,
  WearLogThumbnailModeResolution,
  WearLogThumbnailRepresentatives,
} from "@/lib/wear-logs/wear-log-thumbnail-mode";

export type WearLogStandardThumbnailViewModel = {
  layout: ReturnType<typeof buildWearLogThumbnailLayout>;
  hasTopBottomSplit: boolean;
};

function buildThumbnailLayoutInput(items: WearLogThumbnailItem[]) {
  return items;
}

export function buildStandardWearLogThumbnailViewModel(params: {
  sortedWearLogItems: WearLogThumbnailItem[];
  representatives: WearLogThumbnailRepresentatives;
  modeResolution: WearLogThumbnailModeResolution;
}): WearLogStandardThumbnailViewModel {
  const { sortedWearLogItems } = params;
  const layout = buildWearLogThumbnailLayout(
    buildThumbnailLayoutInput(sortedWearLogItems),
  );
  const hasTopBottomSplit = layout.tops.length > 0 && layout.bottoms.length > 0;

  return {
    layout,
    hasTopBottomSplit,
  };
}
