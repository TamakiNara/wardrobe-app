import { COLOR_THUMBNAIL_OTHERS_BAR_CLASS } from "@/lib/color-thumbnails/shared";
import LowerBodyPreviewSvg from "@/components/items/item-lower-body-thumbnail-svg";
import { resolveSkinToneColor } from "@/lib/master-data/skin-tone-presets";
import { buildOutfitThumbnailLayout } from "@/lib/outfits/color-thumbnail";
import { buildOutfitLowerBodyPreviewSource } from "@/lib/outfits/lower-body-preview";
import type { ItemSpec } from "@/types/items";
import type { SkinTonePreset } from "@/types/settings";

type OutfitItem = {
  id: number;
  item_id: number;
  sort_order: number;
  item: {
    id: number;
    name: string | null;
    category: string;
    shape: string;
    colors: {
      role: "main" | "sub";
      mode: "preset" | "custom";
      value: string;
      hex: string;
      label: string;
    }[];
    spec?: ItemSpec | null;
  };
};

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

export default function OutfitColorThumbnail({
  outfitItems,
  skinTonePreset,
  size = "small",
}: {
  outfitItems: OutfitItem[];
  skinTonePreset?: SkinTonePreset;
  size?: "small" | "large";
}) {
  const layout = buildOutfitThumbnailLayout(
    outfitItems.map((outfitItem) => ({
      id: outfitItem.item.id,
      category: outfitItem.item.category,
      colors: outfitItem.item.colors,
    })),
  );
  const lowerBodyPreview = buildOutfitLowerBodyPreviewSource(
    outfitItems.map((outfitItem) => ({
      sort_order: outfitItem.sort_order,
      item: {
        id: outfitItem.item.id,
        category: outfitItem.item.category,
        shape: outfitItem.item.shape,
        colors: outfitItem.item.colors,
        spec: outfitItem.item.spec ?? null,
      },
    })),
  );
  const hasTopBottomSplit = layout.tops.length > 0 && layout.bottoms.length > 0;
  const dimensions = size === "large"
    ? { wrapper: "w-20", main: "h-20", othersGap: "gap-1.5" }
    : { wrapper: "w-16", main: "h-16", othersGap: "gap-1" };
  const skinToneColor = resolveSkinToneColor(skinTonePreset);

  return (
    <div
      className={`flex ${dimensions.wrapper} flex-col ${dimensions.othersGap}`}
      data-testid="outfit-color-thumbnail"
      aria-hidden="true"
    >
      {layout.usesFullHeightForOthers ? (
        <div className={`${dimensions.main} overflow-hidden rounded-lg border border-gray-200 bg-gray-50`}>
          <SegmentRow segments={layout.others} testId="thumbnail-others-full" />
        </div>
      ) : (
        <>
          <div
            className={`flex ${dimensions.main} min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50`}
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
                  <div
                    className="h-full w-full"
                    data-testid="thumbnail-lower-body"
                  >
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
                  <SegmentRow segments={layout.bottoms} testId="thumbnail-bottoms" />
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
      )}
    </div>
  );
}
