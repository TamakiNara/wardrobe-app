import {
  buildWearLogThumbnailLayout,
} from "@/lib/wear-logs/color-thumbnail";
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
}: {
  items: WearLogThumbnailItem[];
}) {
  const layout = buildWearLogThumbnailLayout(items);

  return (
    <div
      className="flex h-16 w-16 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
      data-testid="wear-log-color-thumbnail"
      aria-hidden="true"
    >
      {layout.usesFullHeightForOthers ? (
        <SegmentRow segments={layout.others} testId="wear-log-thumbnail-others-full" />
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col">
            {layout.tops.length > 0 ? (
              <div className={`min-h-0 ${layout.bottoms.length > 0 ? "flex-1" : "h-full"}`}>
                <SegmentRow segments={layout.tops} testId="wear-log-thumbnail-tops" />
              </div>
            ) : null}

            {layout.bottoms.length > 0 ? (
              <div className={`min-h-0 ${layout.tops.length > 0 ? "flex-1" : "h-full"}`}>
                <SegmentRow segments={layout.bottoms} testId="wear-log-thumbnail-bottoms" />
              </div>
            ) : null}
          </div>

          {layout.hasOthersBar ? (
            <div className="h-3 border-t border-white/50">
              <SegmentRow segments={layout.others} testId="wear-log-thumbnail-others" />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
