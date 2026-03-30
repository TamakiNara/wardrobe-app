import OutfitOnepieceAllinoneThumbnail from "@/components/outfits/outfit-onepiece-allinone-thumbnail";
import OutfitStandardThumbnail from "@/components/outfits/outfit-standard-thumbnail";
import { resolveSkinToneColor } from "@/lib/master-data/skin-tone-presets";
import {
  buildOnepieceAllinoneThumbnailViewModel,
  buildStandardOutfitThumbnailViewModel,
} from "@/lib/outfits/outfit-thumbnail-view-model";
import {
  resolveOutfitThumbnailMode,
  sortOutfitColorThumbnailItems,
  type OutfitColorThumbnailItem as OutfitItem,
} from "@/lib/outfits/outfit-thumbnail-mode";
import type { SkinTonePreset } from "@/types/settings";

export default function OutfitColorThumbnail({
  outfitItems,
  skinTonePreset,
  size = "small",
}: {
  outfitItems: OutfitItem[];
  skinTonePreset?: SkinTonePreset;
  size?: "small" | "large";
}) {
  const sortedOutfitItems = sortOutfitColorThumbnailItems(outfitItems);
  const modeResolution = resolveOutfitThumbnailMode(sortedOutfitItems);
  const dimensions =
    size === "large"
      ? { wrapper: "w-20", main: "h-20", othersGap: "gap-1.5" }
      : { wrapper: "w-16", main: "h-16", othersGap: "gap-1" };
  const skinToneColor = resolveSkinToneColor(skinTonePreset);
  const standardViewModel =
    modeResolution.mode === "standard"
      ? buildStandardOutfitThumbnailViewModel({
          sortedOutfitItems,
          skinToneColor,
        })
      : null;
  const onepieceAllinoneViewModel =
    modeResolution.mode === "onepiece_allinone"
      ? buildOnepieceAllinoneThumbnailViewModel({
          sortedOutfitItems,
          modeResolution,
          skinToneColor,
        })
      : null;

  return (
    <div
      className={`flex ${dimensions.wrapper} flex-col ${dimensions.othersGap}`}
      data-testid="outfit-color-thumbnail"
      aria-hidden="true"
    >
      {onepieceAllinoneViewModel ? (
        <OutfitOnepieceAllinoneThumbnail
          viewModel={onepieceAllinoneViewModel}
          mainClassName={dimensions.main}
        />
      ) : standardViewModel ? (
        <OutfitStandardThumbnail
          viewModel={standardViewModel}
          mainClassName={dimensions.main}
        />
      ) : null}
    </div>
  );
}
