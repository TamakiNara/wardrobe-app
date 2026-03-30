import { COLOR_THUMBNAIL_OTHERS_BAR_CLASS } from "@/lib/color-thumbnails/shared";
import LowerBodyPreviewSvg from "@/components/items/item-lower-body-thumbnail-svg";
import { SegmentRow } from "@/components/outfits/outfit-thumbnail-primitives";
import type { OutfitStandardThumbnailViewModel } from "@/lib/outfits/outfit-thumbnail-view-model";

export default function OutfitStandardThumbnail({
  viewModel,
  mainClassName,
}: {
  viewModel: OutfitStandardThumbnailViewModel;
  mainClassName: string;
}) {
  const { layout, lowerBodyPreview, hasTopBottomSplit, skinToneColor } =
    viewModel;

  if (layout.usesFullHeightForOthers) {
    return (
      <div
        className={`${mainClassName} overflow-hidden rounded-lg border border-gray-200 bg-gray-50`}
      >
        <SegmentRow segments={layout.others} testId="thumbnail-others-full" />
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex ${mainClassName} min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50`}
        data-testid="thumbnail-main"
      >
        {layout.tops.length > 0 ? (
          <div
            className={`min-h-0 ${hasTopBottomSplit ? "h-1/2" : "h-full"}`}
            data-testid="thumbnail-main-top"
          >
            <SegmentRow segments={layout.tops} testId="thumbnail-tops" />
          </div>
        ) : null}

        {layout.bottoms.length > 0 ? (
          <div
            className={`min-h-0 ${hasTopBottomSplit ? "h-1/2" : "h-full"}`}
            data-testid="thumbnail-main-bottom"
          >
            {lowerBodyPreview ? (
              <div className="h-full w-full" data-testid="thumbnail-lower-body">
                <LowerBodyPreviewSvg
                  lengthType={lowerBodyPreview.lengthType}
                  coverageType={lowerBodyPreview.coverageType}
                  bottomsMainColor={lowerBodyPreview.bottomsMainColor}
                  bottomsSubColor={lowerBodyPreview.bottomsSubColor}
                  legwearMainColor={lowerBodyPreview.legwearMainColor}
                  legwearSubColor={lowerBodyPreview.legwearSubColor}
                  skinToneColor={skinToneColor}
                  ariaLabel="outfit lower-body preview"
                  frameMode="viewport"
                  preserveAspectRatio="none"
                />
              </div>
            ) : (
              <SegmentRow
                segments={layout.bottoms}
                testId="thumbnail-bottoms"
              />
            )}
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
