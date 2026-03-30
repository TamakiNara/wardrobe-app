import { COLOR_THUMBNAIL_OTHERS_BAR_CLASS } from "@/lib/color-thumbnails/shared";
import LowerBodyPreviewSvg from "@/components/items/item-lower-body-thumbnail-svg";
import {
  OnepieceAllinoneLayerBand,
  SegmentRow,
} from "@/components/outfits/outfit-thumbnail-primitives";
import type { WearLogOnepieceAllinoneThumbnailViewModel } from "@/lib/wear-logs/wear-log-thumbnail-view-model";

export default function WearLogOnepieceAllinoneThumbnail({
  viewModel,
  mainClassName,
  testIdPrefix,
}: {
  viewModel: WearLogOnepieceAllinoneThumbnailViewModel;
  mainClassName: string;
  testIdPrefix: "wear-log-thumbnail" | "wear-log-modal-thumbnail";
}) {
  const {
    layout,
    onepieceAllinoneLowerBodyPreview,
    onepieceAllinoneMainColorHex,
    onepieceAllinoneSubColorHex,
    topsAreAboveOnepieceAllinone,
    topsAreBelowOnepieceAllinone,
    onepieceAllinoneLayerStyle,
    skinToneColor,
  } = viewModel;

  return (
    <>
      <div
        className={`relative ${mainClassName} overflow-hidden rounded-lg border border-gray-200 bg-gray-50`}
        data-testid={`${testIdPrefix}-onepiece-allinone-main`}
      >
        {topsAreBelowOnepieceAllinone && layout.tops.length > 0 ? (
          <div
            className="absolute inset-x-0 top-0 z-0 h-[12%] overflow-hidden"
            data-testid={`${testIdPrefix}-onepiece-allinone-top-underlay`}
          >
            <SegmentRow
              segments={layout.tops}
              testId={`${testIdPrefix}-onepiece-allinone-underlay-tops`}
            />
          </div>
        ) : null}

        {onepieceAllinoneLowerBodyPreview ? (
          <div
            className="absolute inset-x-0 bottom-0 z-0 h-[20%]"
            data-testid={`${testIdPrefix}-onepiece-allinone-lower-body`}
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
              ariaLabel="wear log onepiece_allinone lower-body preview"
              frameMode="viewport"
              preserveAspectRatio="none"
            />
          </div>
        ) : null}

        <div
          className="absolute inset-x-0 z-10 overflow-hidden"
          style={onepieceAllinoneLayerStyle}
          data-testid={`${testIdPrefix}-onepiece-allinone-layer`}
        >
          <OnepieceAllinoneLayerBand
            mainColorHex={onepieceAllinoneMainColorHex ?? "#E5E7EB"}
            subColorHex={onepieceAllinoneSubColorHex}
          />
        </div>

        {topsAreAboveOnepieceAllinone && layout.tops.length > 0 ? (
          <div
            className="absolute inset-x-0 top-0 z-20 h-[40%] overflow-hidden"
            data-testid={`${testIdPrefix}-onepiece-allinone-top-overlay`}
          >
            <SegmentRow
              segments={layout.tops}
              testId={`${testIdPrefix}-onepiece-allinone-overlay-tops`}
            />
          </div>
        ) : null}
      </div>

      {layout.hasOthersBar ? (
        <div
          className={COLOR_THUMBNAIL_OTHERS_BAR_CLASS}
          data-testid={`${testIdPrefix}-others-bar`}
        >
          <SegmentRow
            segments={layout.others}
            testId={`${testIdPrefix}-others`}
          />
        </div>
      ) : null}
    </>
  );
}
