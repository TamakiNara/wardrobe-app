import { COLOR_THUMBNAIL_OTHERS_BAR_CLASS } from "@/lib/color-thumbnails/shared";
import LowerBodyPreviewSvg from "@/components/items/item-lower-body-thumbnail-svg";
import {
  OnepieceAllinoneLayerBand,
  SegmentRow,
} from "@/components/outfits/outfit-thumbnail-primitives";
import type { OutfitOnepieceAllinoneThumbnailViewModel } from "@/lib/outfits/outfit-thumbnail-view-model";

export default function OutfitOnepieceAllinoneThumbnail({
  viewModel,
  mainClassName,
}: {
  viewModel: OutfitOnepieceAllinoneThumbnailViewModel;
  mainClassName: string;
}) {
  const {
    layout,
    onepieceAllinoneLowerBodyPreview,
    onepieceAllinoneHasVisibleLowerBody,
    onepieceAllinoneMainColorHex,
    onepieceAllinoneSubColorHex,
    topsAreAboveOnepieceAllinone,
    topsAreBelowOnepieceAllinone,
    onepieceAllinoneLayerStyle,
    onepieceAllinoneLayoutMetrics,
    skinToneColor,
  } = viewModel;

  return (
    <>
      <div
        className={`relative ${mainClassName} overflow-hidden rounded-lg border border-gray-200 bg-gray-50`}
        data-testid="thumbnail-onepiece-allinone-main"
      >
        {topsAreBelowOnepieceAllinone && layout.tops.length > 0 ? (
          <div
            className="absolute inset-x-0 top-0 z-0 overflow-hidden"
            style={{ height: onepieceAllinoneLayoutMetrics.topUnderlayHeight }}
            data-testid="thumbnail-onepiece-allinone-top-underlay"
          >
            <SegmentRow
              segments={layout.tops}
              testId="thumbnail-onepiece-allinone-underlay-tops"
            />
          </div>
        ) : null}

        {onepieceAllinoneHasVisibleLowerBody &&
        onepieceAllinoneLowerBodyPreview ? (
          <div
            className="absolute inset-x-0 bottom-0 z-0"
            style={{ height: onepieceAllinoneLayoutMetrics.lowerBodyHeight }}
            data-testid="thumbnail-onepiece-allinone-lower-body"
          >
            <LowerBodyPreviewSvg
              lengthType={onepieceAllinoneLowerBodyPreview.lengthType}
              coverageType={onepieceAllinoneLowerBodyPreview.coverageType}
              bottomsMainColor={onepieceAllinoneMainColorHex}
              bottomsSubColor={onepieceAllinoneSubColorHex}
              legwearMainColor={
                onepieceAllinoneLowerBodyPreview.legwearMainColor
              }
              legwearSubColor={onepieceAllinoneLowerBodyPreview.legwearSubColor}
              skinToneColor={skinToneColor}
              ariaLabel="outfit onepiece_allinone lower-body preview"
              frameMode="viewport"
              preserveAspectRatio="none"
            />
          </div>
        ) : null}

        <div
          className="absolute inset-x-0 z-10 overflow-hidden"
          style={onepieceAllinoneLayerStyle}
          data-testid="thumbnail-onepiece-allinone-layer"
        >
          <OnepieceAllinoneLayerBand
            mainColorHex={onepieceAllinoneMainColorHex ?? "#E5E7EB"}
            subColorHex={onepieceAllinoneSubColorHex}
          />
        </div>

        {topsAreAboveOnepieceAllinone && layout.tops.length > 0 ? (
          <div
            className="absolute inset-x-0 top-0 z-20 overflow-hidden"
            style={{ height: onepieceAllinoneLayoutMetrics.topOverlayHeight }}
            data-testid="thumbnail-onepiece-allinone-top-overlay"
          >
            <SegmentRow
              segments={layout.tops}
              testId="thumbnail-onepiece-allinone-overlay-tops"
            />
          </div>
        ) : null}
      </div>

      {layout.hasOthersBar ? (
        <div
          className={COLOR_THUMBNAIL_OTHERS_BAR_CLASS}
          data-testid="thumbnail-others-bar"
        >
          <SegmentRow segments={layout.others} testId="thumbnail-others" />
        </div>
      ) : null}
    </>
  );
}
