import ItemThumbnailPreview from "@/components/items/item-thumbnail-preview";
import {
  findItemCategoryLabel,
  findItemShapeLabel,
} from "@/lib/master-data/item-shapes";
import type { ItemImageRecord, ItemSpec } from "@/types/items";

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
}: ItemPreviewCardProps) {
  const categoryLabel = findItemCategoryLabel(category) || "カテゴリ未選択";
  const shapeLabel = findItemShapeLabel(category, shape);

  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">プレビュー</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            {name || "名称未設定"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {categoryLabel}
            {shapeLabel ? ` / ${shapeLabel}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[140px_1fr]">
        <ItemThumbnailPreview
          category={category}
          shape={shape}
          mainColorHex={mainColorHex}
          subColorHex={subColorHex}
          topsSpecRaw={topsSpecRaw}
          spec={spec}
          images={images}
          size="large"
        />

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <ColorDot
              hex={mainColorHex}
              label={mainColorLabel}
              tone="main"
            />
            <ColorDot
              hex={subColorHex}
              label={subColorLabel}
              tone="sub"
            />
          </div>

          {category === "tops" && topsSpec && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">
                トップス仕様
              </p>

              <dl className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
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
          )}
        </div>
      </div>
    </section>
  );
}
