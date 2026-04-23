import {
  ITEM_THUMBNAIL_FRAME_HEIGHT,
  ITEM_THUMBNAIL_FRAME_RX,
  ITEM_THUMBNAIL_FRAME_WIDTH,
  ITEM_THUMBNAIL_FRAME_X,
  ITEM_THUMBNAIL_FRAME_Y,
} from "@/components/items/item-thumbnail-frame";
import LowerBodyPreviewSvg from "@/components/items/item-lower-body-thumbnail-svg";
import { COLOR_THUMBNAIL_FALLBACK_COLOR } from "@/lib/color-thumbnails/shared";
import {
  resolveBottomsLengthTypeForPreview,
  resolveLegwearCoverageTypeForPreview,
  resolveSkirtLengthTypeForPreview,
} from "@/lib/master-data/item-skin-exposure";
import { resolveSkinToneColor } from "@/lib/master-data/skin-tone-presets";
import type { ItemImageRecord, ItemSpec } from "@/types/items";
import type { SkinTonePreset } from "@/types/settings";
import { useId } from "react";

type ItemThumbnailPreviewProps = {
  category: string;
  shape: string;
  mainColorHex?: string;
  subColorHex?: string;
  topsSpecRaw?: {
    sleeve?: string | null;
    neck?: string | null;
    design?: string | null;
    fit?: string | null;
  } | null;
  spec?: ItemSpec | null;
  images?: ItemImageRecord[];
  size?: "small" | "large";
  skinTonePreset?: SkinTonePreset;
};

function NonLowerBodyItemPreviewSvg({
  mainColorHex,
  subColorHex,
  category,
}: {
  mainColorHex?: string;
  subColorHex?: string;
  category: string;
}) {
  const ariaLabel = `${category} プレビュー`;
  const clipPathId = useId().replace(/:/g, "");
  const subColorBandY = category === "shoes" ? 72 : 20;

  return (
    <svg
      viewBox="0 0 120 120"
      className="h-full w-full"
      role="img"
      aria-label={ariaLabel}
      data-testid="item-non-lower-body-preview-svg"
    >
      <defs>
        <clipPath id={clipPathId}>
          <rect
            x={ITEM_THUMBNAIL_FRAME_X}
            y={ITEM_THUMBNAIL_FRAME_Y}
            width={ITEM_THUMBNAIL_FRAME_WIDTH}
            height={ITEM_THUMBNAIL_FRAME_HEIGHT}
            rx={ITEM_THUMBNAIL_FRAME_RX}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipPathId})`}>
        <rect
          x={ITEM_THUMBNAIL_FRAME_X}
          y={ITEM_THUMBNAIL_FRAME_Y}
          width={ITEM_THUMBNAIL_FRAME_WIDTH}
          height={ITEM_THUMBNAIL_FRAME_HEIGHT}
          fill={mainColorHex ?? COLOR_THUMBNAIL_FALLBACK_COLOR}
        />
        {subColorHex ? (
          <rect
            x={ITEM_THUMBNAIL_FRAME_X}
            y={subColorBandY}
            width={ITEM_THUMBNAIL_FRAME_WIDTH}
            height="6"
            fill={subColorHex}
            data-testid="item-non-lower-body-subcolor-line"
          />
        ) : null}
      </g>
      <rect
        x={ITEM_THUMBNAIL_FRAME_X}
        y={ITEM_THUMBNAIL_FRAME_Y}
        width={ITEM_THUMBNAIL_FRAME_WIDTH}
        height={ITEM_THUMBNAIL_FRAME_HEIGHT}
        rx={ITEM_THUMBNAIL_FRAME_RX}
        fill="none"
        stroke="#D1D5DB"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function ItemThumbnailPreview({
  category,
  shape,
  mainColorHex,
  subColorHex,
  spec,
  images,
  size = "large",
  skinTonePreset,
}: ItemThumbnailPreviewProps) {
  const isBottomsLikeCategory =
    category === "bottoms" || category === "pants" || category === "skirts";
  const primaryImage = images?.find((image) => image.is_primary) ?? images?.[0];
  const sizeClass =
    size === "small"
      ? "h-20 w-20 rounded-2xl"
      : "aspect-square w-full rounded-2xl";
  const contentPaddingClass = size === "small" ? "p-2" : "p-4";
  const legwearPreviewCoverageType = resolveLegwearCoverageTypeForPreview(
    category,
    shape,
    spec?.legwear?.coverage_type,
  );
  const bottomsLengthType = isBottomsLikeCategory
    ? category === "skirts"
      ? resolveSkirtLengthTypeForPreview(
          spec?.skirt?.length_type,
          spec?.bottoms?.length_type,
        )
      : resolveBottomsLengthTypeForPreview(spec?.bottoms?.length_type)
    : null;
  const skinToneColor = resolveSkinToneColor(skinTonePreset);
  const shouldRenderLowerBody =
    isBottomsLikeCategory ||
    (category === "legwear" && Boolean(legwearPreviewCoverageType));
  const shouldRenderNonLowerBodyPreview =
    Boolean(category) && !shouldRenderLowerBody;

  if (primaryImage?.url) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden border border-gray-200 bg-gray-50 ${sizeClass} ${contentPaddingClass}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage.url}
          alt={primaryImage.original_filename ?? "item image"}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  if (shouldRenderNonLowerBodyPreview) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-gray-300 bg-white ${sizeClass} ${contentPaddingClass}`}
      >
        <NonLowerBodyItemPreviewSvg
          mainColorHex={mainColorHex}
          subColorHex={subColorHex}
          category={category}
        />
      </div>
    );
  }

  if (shouldRenderLowerBody) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-gray-300 bg-white ${sizeClass} ${contentPaddingClass}`}
      >
        <LowerBodyPreviewSvg
          lengthType={isBottomsLikeCategory ? bottomsLengthType : null}
          coverageType={
            category === "legwear" ? legwearPreviewCoverageType : null
          }
          bottomsMainColor={isBottomsLikeCategory ? mainColorHex : null}
          bottomsSubColor={isBottomsLikeCategory ? subColorHex : null}
          legwearMainColor={category === "legwear" ? mainColorHex : null}
          legwearSubColor={category === "legwear" ? subColorHex : null}
          skinToneColor={skinToneColor}
          ariaLabel={
            category === "legwear"
              ? "レッグウェアプレビュー"
              : "ボトムスプレビュー"
          }
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center border border-dashed border-gray-300 bg-white ${sizeClass} ${contentPaddingClass}`}
    >
      <div className="text-center">
        <div
          className={`mx-auto rounded-2xl border border-gray-300 ${size === "small" ? "h-14 w-14" : "h-20 w-20"}`}
          style={{
            backgroundColor: mainColorHex ?? COLOR_THUMBNAIL_FALLBACK_COLOR,
          }}
        />
        {subColorHex ? (
          <div
            className={`mt-2 ml-auto rounded-full border border-gray-300 ${size === "small" ? "h-3.5 w-3.5" : "h-4 w-4"}`}
            style={{ backgroundColor: subColorHex }}
          />
        ) : null}
      </div>
    </div>
  );
}
