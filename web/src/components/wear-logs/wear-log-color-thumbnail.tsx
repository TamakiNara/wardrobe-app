import { COLOR_THUMBNAIL_OTHERS_BAR_CLASS } from "@/lib/color-thumbnails/shared";
import LowerBodyPreviewSvg from "@/components/items/item-lower-body-thumbnail-svg";
import WearLogOnepieceAllinoneThumbnail from "@/components/wear-logs/wear-log-onepiece-allinone-thumbnail";
import {
  DEFAULT_SKIN_TONE_PRESET,
  resolveSkinToneColor,
} from "@/lib/master-data/skin-tone-presets";
import {
  buildOnepieceAllinoneWearLogThumbnailViewModel,
  buildStandardWearLogThumbnailViewModel,
} from "@/lib/wear-logs/wear-log-thumbnail-view-model";
import {
  resolveWearLogThumbnailMode,
  selectWearLogThumbnailRepresentatives,
  sortWearLogThumbnailItems,
} from "@/lib/wear-logs/wear-log-thumbnail-mode";
import type { SkinTonePreset } from "@/types/settings";
import type { WearLogThumbnailItem } from "@/types/wear-logs";

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

export default function WearLogColorThumbnail({
  items,
  skinTonePreset = DEFAULT_SKIN_TONE_PRESET,
}: {
  items: WearLogThumbnailItem[];
  skinTonePreset?: SkinTonePreset;
}) {
  const sortedWearLogItems = sortWearLogThumbnailItems(items);
  const representatives =
    selectWearLogThumbnailRepresentatives(sortedWearLogItems);
  const modeResolution = resolveWearLogThumbnailMode({
    sortedWearLogItems,
    representatives,
  });
  const skinToneColor = resolveSkinToneColor(skinTonePreset);
  if (modeResolution.mode === "onepiece_allinone") {
    const viewModel = buildOnepieceAllinoneWearLogThumbnailViewModel({
      sortedWearLogItems,
      representatives,
      modeResolution,
      skinToneColor,
    });

    return (
      <div
        className="flex w-14 shrink-0 flex-col gap-1"
        data-testid="wear-log-color-thumbnail"
        aria-hidden="true"
      >
        <WearLogOnepieceAllinoneThumbnail
          viewModel={viewModel}
          mainClassName="h-14"
          testIdPrefix="wear-log-thumbnail"
        />
      </div>
    );
  }

  const { layout, lowerBodyPreview, hasTopBottomSplit } =
    buildStandardWearLogThumbnailViewModel({
      sortedWearLogItems,
      representatives,
      modeResolution,
      skinToneColor,
    });

  return (
    <div
      className="flex w-14 shrink-0 flex-col gap-1"
      data-testid="wear-log-color-thumbnail"
      aria-hidden="true"
    >
      {layout.usesFullHeightForOthers ? (
        <div className="h-14 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <SegmentRow
            segments={layout.others}
            testId="wear-log-thumbnail-others-full"
          />
        </div>
      ) : (
        <>
          <div
            className="flex h-14 min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            data-testid="wear-log-thumbnail-main"
          >
            {layout.tops.length > 0 ? (
              <div
                className={`min-h-0 ${hasTopBottomSplit ? "h-1/2" : "h-full"}`}
                data-testid="wear-log-thumbnail-main-top"
              >
                <SegmentRow
                  segments={layout.tops}
                  testId="wear-log-thumbnail-tops"
                />
              </div>
            ) : null}

            {layout.bottoms.length > 0 ? (
              <div
                className={`min-h-0 ${hasTopBottomSplit ? "h-1/2" : "h-full"}`}
                data-testid="wear-log-thumbnail-main-bottom"
              >
                {lowerBodyPreview ? (
                  <div
                    className="h-full w-full"
                    data-testid="wear-log-thumbnail-lower-body"
                  >
                    <LowerBodyPreviewSvg
                      lengthType={lowerBodyPreview.lengthType}
                      coverageType={lowerBodyPreview.coverageType}
                      bottomsMainColor={lowerBodyPreview.bottomsMainColor}
                      bottomsSubColor={lowerBodyPreview.bottomsSubColor}
                      legwearMainColor={lowerBodyPreview.legwearMainColor}
                      legwearSubColor={lowerBodyPreview.legwearSubColor}
                      skinToneColor={skinToneColor}
                      ariaLabel="wear log lower-body preview"
                      frameMode="viewport"
                      preserveAspectRatio="none"
                    />
                  </div>
                ) : (
                  <SegmentRow
                    segments={layout.bottoms}
                    testId="wear-log-thumbnail-bottoms"
                  />
                )}
              </div>
            ) : null}
          </div>

          {layout.hasOthersBar ? (
            <div
              className={COLOR_THUMBNAIL_OTHERS_BAR_CLASS}
              data-testid="wear-log-thumbnail-others-bar"
            >
              <SegmentRow
                segments={layout.others}
                testId="wear-log-thumbnail-others"
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
