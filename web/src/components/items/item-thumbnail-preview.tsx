import TopsPreviewSvg from "@/components/items/preview-svg/tops-preview-svg";
import LowerBodyPreviewSvg from "@/components/items/item-lower-body-thumbnail-svg";
import { COLOR_THUMBNAIL_FALLBACK_COLOR } from "@/lib/color-thumbnails/shared";
import { resolveLegwearCoverageType } from "@/lib/master-data/item-skin-exposure";
import type { ItemImageRecord, ItemSpec } from "@/types/items";

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
};

export default function ItemThumbnailPreview({
  category,
  shape,
  mainColorHex,
  subColorHex,
  topsSpecRaw,
  spec,
  images,
  size = "large",
}: ItemThumbnailPreviewProps) {
  const primaryImage = images?.find((image) => image.is_primary) ?? images?.[0];
  const sizeClass = size === "small"
    ? "h-20 w-20 rounded-2xl"
    : "aspect-square w-full rounded-2xl";
  const contentPaddingClass = size === "small" ? "p-2" : "p-3";
  const legwearCoverageType = resolveLegwearCoverageType(
    category,
    shape,
    spec?.legwear?.coverage_type,
  );
  const bottomsLengthType = spec?.bottoms?.length_type ?? null;
  const shouldRenderLowerBody =
    (category === "bottoms" && Boolean(bottomsLengthType))
    || (category === "legwear" && Boolean(legwearCoverageType));

  if (primaryImage?.url) {
    return (
      <div className={`flex items-center justify-center overflow-hidden border border-gray-200 bg-gray-50 ${sizeClass} ${contentPaddingClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage.url}
          alt={primaryImage.original_filename ?? "item image"}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  if (category === "tops" && topsSpecRaw?.shape) {
    return (
      <div className={`flex items-center justify-center border border-dashed border-gray-300 bg-white ${sizeClass} ${contentPaddingClass}`}>
        <TopsPreviewSvg
          shape={topsSpecRaw.shape}
          sleeve={topsSpecRaw.sleeve ?? undefined}
          neck={topsSpecRaw.neck ?? undefined}
          design={topsSpecRaw.design ?? undefined}
          fit={topsSpecRaw.fit ?? undefined}
          mainColor={mainColorHex}
          subColor={subColorHex}
        />
      </div>
    );
  }

  if (shouldRenderLowerBody) {
    return (
      <div className={`flex items-center justify-center border border-dashed border-gray-300 bg-white ${sizeClass} ${contentPaddingClass}`}>
        <LowerBodyPreviewSvg
          category={category === "legwear" ? "legwear" : "bottoms"}
          lengthType={bottomsLengthType}
          coverageType={legwearCoverageType}
          mainColor={mainColorHex}
          subColor={subColorHex}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center border border-dashed border-gray-300 bg-white ${sizeClass} ${contentPaddingClass}`}>
      <div className="text-center">
        <div
          className={`mx-auto rounded-2xl border border-gray-300 ${size === "small" ? "h-12 w-12" : "h-16 w-16"}`}
          style={{ backgroundColor: mainColorHex ?? COLOR_THUMBNAIL_FALLBACK_COLOR }}
        />
        {subColorHex ? (
          <div
            className={`mt-2 ml-auto rounded-full border border-gray-300 ${size === "small" ? "h-3 w-3" : "h-4 w-4"}`}
            style={{ backgroundColor: subColorHex }}
          />
        ) : null}
        {size === "large" ? <p className="mt-2 text-xs text-gray-500">SVG プレビュー</p> : null}
      </div>
    </div>
  );
}
