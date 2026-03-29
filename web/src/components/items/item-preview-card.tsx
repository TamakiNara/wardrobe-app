import ItemThumbnailPreview from "@/components/items/item-thumbnail-preview";
import {
  findBottomsLengthLabel,
  findLegwearCoverageLabel,
} from "@/lib/master-data/item-skin-exposure";
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
  shape: string;
  mainColorHex?: string;
  mainColorLabel?: string;
  subColorHex?: string;
  subColorLabel?: string;
  topsSpec?: {
    shape?: string;
    sleeve?: string;
    length?: string;
    neck?: string;
    design?: string;
    fit?: string;
  } | null;
  topsSpecRaw?: {
    shape?: string;
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
};

function ColorDot({
  hex,
  label,
  tone,
}: {
  hex?: string;
  label?: string;
  tone: "main" | "sub";
}) {
  if (!hex || !label) return null;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
        tone === "main"
          ? "border border-gray-300 bg-white"
          : "border border-gray-200 bg-gray-50"
      }`}
    >
      <span
        className="h-4 w-4 rounded-full border border-gray-300"
        style={{ backgroundColor: hex }}
      />
      {label}
    </div>
  );
}

export default function ItemPreviewCard({
  name,
  category,
  shape,
  mainColorHex,
  mainColorLabel,
  subColorHex,
  subColorLabel,
  topsSpec,
  topsSpecRaw,
  spec,
  images,
  skinTonePreset,
  compact = false,
}: ItemPreviewCardProps) {
  const showDebugDetails = isItemPreviewDebugEnabled();
  const categoryLabel = findItemCategoryLabel(category) || "カテゴリ未選択";
  const shapeLabel = findItemShapeLabel(category, shape);
  const bottomsLengthLabel = findBottomsLengthLabel(spec?.bottoms?.length_type);
  const legwearCoverageLabel = findLegwearCoverageLabel(
    spec?.legwear?.coverage_type,
  );
  const selectedSkinTone = findSkinTonePresetOption(skinTonePreset);

  const previewMeta = [
    {
      label: "メインカラー",
      value:
        mainColorLabel && mainColorHex
          ? `${mainColorLabel} (${mainColorHex})`
          : "未設定",
    },
    {
      label: "サブカラー",
      value:
        subColorLabel && subColorHex
          ? `${subColorLabel} (${subColorHex})`
          : "未設定",
    },
    {
      label: "skinTonePreset",
      value: `${selectedSkinTone.label} (${selectedSkinTone.value})`,
    },
  ];

  return (
    <section className={`rounded-2xl border border-gray-200 bg-gray-50 p-4`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">プレビュー</p>
          <h2
            className={`mt-1 font-semibold text-gray-900 ${compact ? "text-base" : "text-lg"}`}
          >
            {name || "名称未設定"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {categoryLabel}
            {shapeLabel ? ` / ${shapeLabel}` : ""}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 ${compact ? "grid grid-cols-[88px_1fr] items-start gap-3" : "space-y-4"}`}
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

        {showDebugDetails ? (
          <div
            className={compact ? "space-y-2 self-start pt-0.5" : "space-y-3"}
          >
            <div className={`flex flex-wrap gap-2 ${compact ? "text-xs" : ""}`}>
              <ColorDot hex={mainColorHex} label={mainColorLabel} tone="main" />
              <ColorDot hex={subColorHex} label={subColorLabel} tone="sub" />
            </div>

            <div
              className={`rounded-xl border border-gray-200 bg-white ${compact ? "p-3" : "p-3.5"}`}
            >
              <p
                className={`font-medium text-gray-700 ${compact ? "mb-2 text-xs" : "mb-2 text-sm"}`}
              >
                {compact ? "確認中の設定" : "プレビュー詳細"}
              </p>

              <dl
                className={`grid text-gray-600 ${compact ? "gap-1 text-xs" : "gap-1.5 text-sm"}`}
              >
                {previewMeta.map((item) => (
                  <div key={item.label}>
                    <dt className="font-medium text-gray-700">{item.label}</dt>
                    <dd>{item.value}</dd>
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
                    <dd>{topsSpec.shape || "未選択"}</dd>
                  </div>
                  <div>
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
