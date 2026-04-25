import ItemThumbnailPreview from "@/components/items/item-thumbnail-preview";
import { resolveCurrentItemCategoryValue } from "@/lib/api/categories";
import {
  findBottomsLengthLabel,
  findLegwearCoverageLabel,
  findSkirtLengthLabel,
} from "@/lib/master-data/item-skin-exposure";
import {
  findItemSubcategoryLabel,
  resolveCurrentItemSubcategoryValue,
} from "@/lib/master-data/item-subcategories";
import {
  findItemCategoryLabel,
  findItemShapeLabel,
} from "@/lib/master-data/item-shapes";
import { isItemPreviewDebugEnabled } from "@/lib/features/item-preview-debug";
import { findSkinTonePresetOption } from "@/lib/master-data/skin-tone-presets";
import type { ItemImageRecord, ItemSpec } from "@/types/items";
import type { SkinTonePreset } from "@/types/settings";

type ItemPreviewCardProps = {
  name: string;
  category: string;
  subcategory?: string | null;
  shape: string;
  mainColorHex?: string;
  mainColorLabel?: string;
  mainColorCustomLabel?: string | null;
  subColorHex?: string;
  subColorLabel?: string;
  subColorCustomLabel?: string | null;
  topsSpec?: {
    sleeve?: string;
    length?: string;
    neck?: string;
    design?: string;
    fit?: string;
  } | null;
  topsSpecRaw?: {
    sleeve?: string;
    length?: string;
    neck?: string;
    design?: string;
    fit?: string;
  } | null;
  spec?: ItemSpec | null;
  images?: ItemImageRecord[];
  skinTonePreset?: SkinTonePreset;
  compact?: boolean;
  showDebugDetails?: boolean;
  showSummary?: boolean;
};

function resolveDisplayedColorLabel(
  label?: string,
  customLabel?: string | null,
) {
  const trimmedCustomLabel = customLabel?.trim();

  return trimmedCustomLabel || label || "";
}

function ColorDot({
  hex,
  label,
  customLabel,
  tone,
}: {
  hex?: string;
  label?: string;
  customLabel?: string | null;
  tone: "main" | "sub";
}) {
  if (!hex || !label) return null;

  const displayedLabel = resolveDisplayedColorLabel(label, customLabel);

  return (
    <div className="min-w-0">
      <div
        className={`inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-1 text-sm ${
          tone === "main"
            ? "border border-gray-300 bg-white"
            : "border border-gray-200 bg-gray-50"
        }`}
      >
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-gray-300"
          style={{ backgroundColor: hex }}
        />
        <span className="truncate">{displayedLabel}</span>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        <span className="font-mono text-gray-400">{hex.toUpperCase()}</span>
      </p>
    </div>
  );
}

export default function ItemPreviewCard({
  name,
  category,
  subcategory,
  shape,
  mainColorHex,
  mainColorLabel,
  mainColorCustomLabel,
  subColorHex,
  subColorLabel,
  subColorCustomLabel,
  topsSpec,
  topsSpecRaw,
  spec,
  images,
  skinTonePreset,
  compact = false,
  showDebugDetails,
  showSummary = true,
}: ItemPreviewCardProps) {
  const shouldShowDebugDetails =
    showDebugDetails ?? isItemPreviewDebugEnabled();
  const currentCategory =
    resolveCurrentItemCategoryValue(category, shape) ?? category;
  const categoryLabel =
    findItemCategoryLabel(currentCategory) || "カテゴリ未選択";
  const currentSubcategory =
    resolveCurrentItemSubcategoryValue(currentCategory, shape, subcategory) ??
    null;
  const subcategoryLabel = findItemSubcategoryLabel(
    currentCategory,
    currentSubcategory,
  );
  const shapeLabel = findItemShapeLabel(category, shape);
  const classificationLabels = [categoryLabel, subcategoryLabel, shapeLabel]
    .filter((label): label is string => Boolean(label))
    .filter((label, index, labels) => labels.indexOf(label) === index);
  const bottomsLengthLabel =
    currentCategory === "skirts"
      ? findSkirtLengthLabel(
          spec?.skirt?.length_type,
          spec?.bottoms?.length_type,
        )
      : findBottomsLengthLabel(spec?.bottoms?.length_type);
  const legwearCoverageLabel = findLegwearCoverageLabel(
    spec?.legwear?.coverage_type,
  );
  const selectedSkinTone = findSkinTonePresetOption(skinTonePreset);
  const displayedMainColorLabel = resolveDisplayedColorLabel(
    mainColorLabel,
    mainColorCustomLabel,
  );
  const displayedSubColorLabel = resolveDisplayedColorLabel(
    subColorLabel,
    subColorCustomLabel,
  );

  const previewMeta = [
    {
      label: "メインカラー",
      value:
        mainColorLabel && mainColorHex
          ? `${displayedMainColorLabel} (${mainColorHex})`
          : "未設定",
    },
    {
      label: "サブカラー",
      value:
        subColorLabel && subColorHex
          ? `${displayedSubColorLabel} (${subColorHex})`
          : "未設定",
    },
    {
      label: "skinTonePreset",
      value: `${selectedSkinTone.label} (${selectedSkinTone.value})`,
    },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      {showSummary ? (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">プレビュー</p>
            <h2
              className={`mt-1 break-words font-semibold leading-snug text-gray-900 [overflow-wrap:anywhere] ${compact ? "text-base" : "text-lg"}`}
            >
              {name || "商品名未設定"}
            </h2>
            <p className="mt-1 break-words text-sm leading-6 text-gray-600 [overflow-wrap:anywhere]">
              {classificationLabels.join(" / ")}
            </p>
          </div>
        </div>
      ) : null}

      <div
        className={`${showSummary ? "mt-4 " : ""}${compact ? "grid grid-cols-[88px_1fr] items-start gap-3" : "space-y-4"}`}
      >
        <div className={compact ? "" : "flex justify-center"}>
          <div className={compact ? "" : "w-full max-w-[9.5rem]"}>
            <ItemThumbnailPreview
              category={category}
              shape={shape}
              mainColorHex={mainColorHex}
              subColorHex={subColorHex}
              topsSpecRaw={topsSpecRaw}
              spec={spec}
              images={images}
              skinTonePreset={skinTonePreset}
              size={compact ? "small" : "large"}
            />
          </div>
        </div>

        {shouldShowDebugDetails ? (
          <div
            className={compact ? "space-y-2 self-start pt-0.5" : "space-y-3"}
          >
            <div className={`grid gap-2 ${compact ? "text-xs" : ""}`}>
              <ColorDot
                hex={mainColorHex}
                label={mainColorLabel}
                customLabel={mainColorCustomLabel}
                tone="main"
              />
              <ColorDot
                hex={subColorHex}
                label={subColorLabel}
                customLabel={subColorCustomLabel}
                tone="sub"
              />
            </div>

            <div
              className={`rounded-xl border border-gray-200 bg-white ${compact ? "p-3" : "p-3.5"}`}
            >
              <p
                className={`font-medium text-gray-700 ${compact ? "mb-2 text-xs" : "mb-2 text-sm"}`}
              >
                {compact ? "プレビュー中の設定" : "プレビュー詳細"}
              </p>

              <dl
                className={`grid text-gray-600 ${compact ? "gap-1 text-xs" : "gap-1.5 text-sm"}`}
              >
                {previewMeta.map((item) => (
                  <div key={item.label}>
                    <dt className="font-medium text-gray-700">{item.label}</dt>
                    <dd className="break-words [overflow-wrap:anywhere]">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {category === "tops" && topsSpec ? (
              <div
                className={`rounded-xl border border-gray-200 bg-white ${compact ? "p-3" : "p-3.5"}`}
              >
                <p
                  className={`font-medium text-gray-700 ${compact ? "mb-2 text-xs" : "mb-2 text-sm"}`}
                >
                  トップス仕様
                </p>

                <dl
                  className={`grid text-gray-600 ${compact ? "gap-1 text-xs" : "gap-1.5 text-sm"}`}
                >
                  <div>
                    <dt className="font-medium text-gray-700">形</dt>
                    <dt className="font-medium text-gray-700">袖</dt>
                    <dd>{topsSpec.sleeve || "未選択"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">丈</dt>
                    <dd>{topsSpec.length || "未選択"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">首回り</dt>
                    <dd>{topsSpec.neck || "未選択"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">デザイン</dt>
                    <dd>{topsSpec.design || "未選択"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">シルエット</dt>
                    <dd>{topsSpec.fit || "未選択"}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {bottomsLengthLabel ? (
              <div
                className={`rounded-xl border border-gray-200 bg-white ${compact ? "p-3" : "p-3.5"}`}
              >
                <p
                  className={`font-medium text-gray-700 ${compact ? "mb-2 text-xs" : "mb-2 text-sm"}`}
                >
                  ボトムス仕様
                </p>

                <dl
                  className={`grid text-gray-600 ${compact ? "gap-1 text-xs" : "gap-1.5 text-sm"}`}
                >
                  <div>
                    <dt className="font-medium text-gray-700">ボトムス丈</dt>
                    <dd>{bottomsLengthLabel}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {legwearCoverageLabel ? (
              <div
                className={`rounded-xl border border-gray-200 bg-white ${compact ? "p-3" : "p-3.5"}`}
              >
                <p
                  className={`font-medium text-gray-700 ${compact ? "mb-2 text-xs" : "mb-2 text-sm"}`}
                >
                  レッグウェア仕様
                </p>

                <dl
                  className={`grid text-gray-600 ${compact ? "gap-1 text-xs" : "gap-1.5 text-sm"}`}
                >
                  <div>
                    <dt className="font-medium text-gray-700">レッグウェア</dt>
                    <dd>{legwearCoverageLabel}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
