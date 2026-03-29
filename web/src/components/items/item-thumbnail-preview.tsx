import LowerBodyPreviewSvg from "@/components/items/item-lower-body-thumbnail-svg";
import { COLOR_THUMBNAIL_FALLBACK_COLOR } from "@/lib/color-thumbnails/shared";
import {
  resolveBottomsLengthTypeForPreview,
  resolveLegwearCoverageTypeForPreview,
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
    shape?: string;
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

function TopLikeItemPreviewSvg({
  mainColorHex,
  subColorHex,
  category,
}: {
  mainColorHex?: string;
  subColorHex?: string;
  category: string;
}) {
  const ariaLabel =
    category === "dress" ? "ワンピースプレビュー" : "トップスプレビュー";
  const clipPathId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 120 120"
      className="h-full w-full"
      role="img"
      aria-label={ariaLabel}
      data-testid="item-toplike-preview-svg"
    >
      <defs>
        <clipPath id={clipPathId}>
          <rect x="22" y="20" width="76" height="72" rx="18" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipPathId})`}>
        <rect
          x="22"
          y="20"
          width="76"
          height="72"
          fill={mainColorHex ?? COLOR_THUMBNAIL_FALLBACK_COLOR}
        />
        {subColorHex ? (
          <rect
            x="22"
            y="20"
            width="76"
            height="6"
            fill={subColorHex}
            data-testid="item-toplike-subcolor-line"
          />
        ) : null}
      </g>
      <rect
        x="22"
        y="20"
        width="76"
        height="72"
        rx="18"
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
  const bottomsLengthType =
    category === "bottoms"
      ? resolveBottomsLengthTypeForPreview(spec?.bottoms?.length_type)
      : null;
  const skinToneColor = resolveSkinToneColor(skinTonePreset);
  const shouldRenderLowerBody =
    category === "bottoms" ||
    (category === "legwear" && Boolean(legwearPreviewCoverageType));
  const shouldRenderTopLikePreview =
    category === "tops" || category === "dress";

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

  if (shouldRenderTopLikePreview) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-gray-300 bg-white ${sizeClass} ${contentPaddingClass}`}
      >
        <TopLikeItemPreviewSvg
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
          lengthType={category === "bottoms" ? bottomsLengthType : null}
          coverageType={
            category === "legwear" ? legwearPreviewCoverageType : null
          }
          bottomsMainColor={category === "bottoms" ? mainColorHex : null}
          bottomsSubColor={category === "bottoms" ? subColorHex : null}
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
