import type { WearLogThumbnailItem } from "@/types/wear-logs";
import { COLOR_THUMBNAIL_OTHERS_BAR_CLASS } from "@/lib/color-thumbnails/shared";
import LowerBodyPreviewSvg from "@/components/items/item-lower-body-thumbnail-svg";
import { buildStandardWearLogThumbnailViewModel } from "@/lib/wear-logs/wear-log-thumbnail-view-model";
import {
  resolveWearLogThumbnailMode,
  selectWearLogThumbnailRepresentatives,
  sortWearLogThumbnailItems,
} from "@/lib/wear-logs/wear-log-thumbnail-mode";

function ColorBand({
  mainColorHex,
  subColorHex,
}: {
  mainColorHex: string;
  subColorHex: string | null;
}) {
  return (
    <span className="relative block h-full w-full overflow-hidden">
      <span
        className="absolute inset-y-0 left-0"
        style={{
          width: subColorHex ? "90%" : "100%",
          backgroundColor: mainColorHex,
        }}
      />
      {subColorHex ? (
        <span
          className="absolute inset-y-0 right-0"
          style={{ width: "10%", backgroundColor: subColorHex }}
        />
      ) : null}
    </span>
  );
}

function SegmentRow({
  segments,
  testId,
}: {
  segments: Array<{
    id: number;
    mainColorHex: string;
    subColorHex: string | null;
  }>;
  testId: string;
}) {
  return (
    <div className="flex h-full w-full" data-testid={testId}>
      {segments.map((segment) => (
        <div
          key={segment.id}
          className="h-full min-w-0 flex-1"
          data-testid={`${testId}-segment`}
        >
          <ColorBand
            mainColorHex={segment.mainColorHex}
            subColorHex={segment.subColorHex}
          />
        </div>
      ))}
    </div>
  );
}

export default function WearLogModalColorThumbnail({
  items,
}: {
  items: WearLogThumbnailItem[];
}) {
  const sortedWearLogItems = sortWearLogThumbnailItems(items);
  const representatives =
    selectWearLogThumbnailRepresentatives(sortedWearLogItems);
  const modeResolution = resolveWearLogThumbnailMode({
    sortedWearLogItems,
    representatives,
  });
  const { layout, lowerBodyPreview, hasTopBottomSplit } =
    buildStandardWearLogThumbnailViewModel({
      sortedWearLogItems,
      representatives,
      modeResolution,
    });

  return (
    <div
      className="flex w-11 shrink-0 flex-col gap-1"
      data-testid="wear-log-modal-color-thumbnail"
      aria-hidden="true"
    >
      {layout.usesFullHeightForOthers ? (
        <div className="h-11 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          <SegmentRow
            segments={layout.others}
            testId="wear-log-modal-thumbnail-others-full"
          />
        </div>
      ) : (
        <>
          <div className="flex h-11 min-h-0 flex-col overflow-hidden rounded-md border border-gray-200 bg-gray-50">
            {layout.tops.length > 0 ? (
              <div
                className={`min-h-0 ${hasTopBottomSplit ? "h-1/2" : "h-full"}`}
                data-testid="wear-log-modal-thumbnail-main-top"
              >
                <SegmentRow
                  segments={layout.tops}
                  testId="wear-log-modal-thumbnail-tops"
                />
              </div>
            ) : null}

            {layout.bottoms.length > 0 ? (
              <div
                className={`min-h-0 ${hasTopBottomSplit ? "h-1/2" : "h-full"}`}
                data-testid="wear-log-modal-thumbnail-main-bottom"
              >
                {lowerBodyPreview ? (
                  <div
                    className="h-full w-full"
                    data-testid="wear-log-modal-thumbnail-lower-body"
                  >
                    <LowerBodyPreviewSvg
                      lengthType={lowerBodyPreview.lengthType}
                      coverageType={lowerBodyPreview.coverageType}
                      bottomsMainColor={lowerBodyPreview.bottomsMainColor}
                      bottomsSubColor={lowerBodyPreview.bottomsSubColor}
                      legwearMainColor={lowerBodyPreview.legwearMainColor}
                      legwearSubColor={lowerBodyPreview.legwearSubColor}
                      ariaLabel="wear log modal lower-body preview"
                      frameMode="viewport"
                      preserveAspectRatio="none"
                    />
                  </div>
                ) : (
                  <SegmentRow
                    segments={layout.bottoms}
                    testId="wear-log-modal-thumbnail-bottoms"
                  />
                )}
              </div>
            ) : null}
          </div>

          {layout.hasOthersBar ? (
            <div
              className={COLOR_THUMBNAIL_OTHERS_BAR_CLASS}
              data-testid="wear-log-modal-thumbnail-others-bar"
            >
              <SegmentRow
                segments={layout.others}
                testId="wear-log-modal-thumbnail-others"
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
