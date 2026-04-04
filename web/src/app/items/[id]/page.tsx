import Link from "next/link";
import { redirect } from "next/navigation";
import ItemCareStatusAction from "@/components/items/item-care-status-action";
import ItemStatusAction from "@/components/items/item-status-action";
import ItemPreviewCard from "@/components/items/item-preview-card";
import { EntityDetailHeader } from "@/components/shared/entity-detail-header";
import { DEFAULT_SKIN_TONE_PRESET } from "@/lib/master-data/skin-tone-presets";
import {
  formatItemPrice,
  ITEM_CARE_STATUS_LABELS,
  ITEM_SIZE_GENDER_LABELS,
} from "@/lib/items/metadata";
import {
  formatSizeDetailValue,
  getStructuredSizeFieldDefinitions,
  normalizeItemSizeDetails,
} from "@/lib/items/size-details";
import { groupItemMaterialsForDisplay } from "@/lib/items/materials";
import {
  findBottomsLengthLabel,
  findLegwearCoverageLabel,
} from "@/lib/master-data/item-skin-exposure";
import {
  buildTopsSpecLabels,
  buildTopsSpecRaw,
} from "@/lib/master-data/item-tops";
import {
  findItemCategoryLabel,
  findItemShapeLabel,
} from "@/lib/master-data/item-shapes";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type { ItemRecord } from "@/types/items";
import type { SkinTonePreset } from "@/types/settings";

async function getItem(id: string): Promise<ItemRecord> {
  const res = await fetchLaravelWithCookie(`/api/items/${id}`);

  if (res.status === 401) redirect("/login");
  if (!res.ok) redirect("/items");

  const data = await res.json();
  return data.item;
}

async function getSkinTonePreset(): Promise<SkinTonePreset> {
  const res = await fetchLaravelWithCookie("/api/settings/preferences");

  if (res.status === 401) redirect("/login");
  if (!res.ok) return DEFAULT_SKIN_TONE_PRESET;

  const data = (await res.json()) as {
    preferences?: { skinTonePreset?: SkinTonePreset | null };
  };
  return data.preferences?.skinTonePreset ?? DEFAULT_SKIN_TONE_PRESET;
}

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [item, skinTonePreset] = await Promise.all([
    getItem(id),
    getSkinTonePreset(),
  ]);
  const returnToParam =
    typeof resolvedSearchParams.return_to === "string"
      ? resolvedSearchParams.return_to
      : null;
  const returnLabelParam =
    typeof resolvedSearchParams.return_label === "string"
      ? resolvedSearchParams.return_label
      : null;

  const mainColor = item.colors.find((c) => c.role === "main");
  const subColor = item.colors.find((c) => c.role === "sub");
  const topsSpec = buildTopsSpecLabels(item.spec?.tops);
  const topsSpecRaw = buildTopsSpecRaw(item.spec?.tops);
  const bottomsLengthLabel = findBottomsLengthLabel(
    item.spec?.bottoms?.length_type,
  );
  const legwearCoverageLabel = findLegwearCoverageLabel(
    item.spec?.legwear?.coverage_type,
  );
  const categoryLabel = findItemCategoryLabel(item.category);
  const shapeLabel = findItemShapeLabel(item.category, item.shape);
  const itemImages = item.images ?? [];
  const normalizedSizeDetails = normalizeItemSizeDetails(item.size_details);
  const structuredSizeFieldDefinitions = getStructuredSizeFieldDefinitions(
    item.category,
    item.shape,
  );
  const visibleStructuredSizeFields = structuredSizeFieldDefinitions.filter(
    (field) => normalizedSizeDetails?.structured?.[field.name] !== undefined,
  );
  const visibleCustomSizeFields = normalizedSizeDetails?.custom_fields ?? [];
  const groupedMaterials = groupItemMaterialsForDisplay(item.materials);
  const backHref = returnToParam ?? "/items";
  const backLabel = returnToParam
    ? `${returnLabelParam ?? "戻る"}へ戻る`
    : "一覧に戻る";

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <EntityDetailHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            ...(returnToParam
              ? [
                  {
                    label: returnLabelParam ?? "戻る",
                    href: returnToParam,
                  },
                ]
              : []),
            { label: "アイテム一覧", href: "/items" },
            { label: "詳細" },
          ]}
          eyebrow="アイテム管理"
          title={item.name ?? "名称未設定"}
          details={
            item.status === "disposed" || item.care_status ? (
              <div className="flex flex-wrap gap-2">
                {item.status === "disposed" && (
                  <p className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                    手放し済み
                  </p>
                )}
                {item.care_status && (
                  <p className="inline-flex rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">
                    {ITEM_CARE_STATUS_LABELS[item.care_status]}
                  </p>
                )}
              </div>
            ) : null
          }
          actions={
            <>
              <Link
                href={backHref}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {backLabel}
              </Link>
              <Link
                href={`/items/${item.id}/edit`}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                編集
              </Link>
            </>
          }
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">状態操作</h2>
          <p className="mt-2 text-sm text-gray-600">
            所持しなくなった場合は「手放す」を使います。必要になった時は「クローゼットに戻す」で通常状態へ戻せます。
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-900">所持状態</h3>
              <p className="mt-1 text-sm text-gray-600">
                {item.status === "disposed" ? "手放し済み" : "所持品"}
              </p>
              <div className="mt-4">
                <ItemStatusAction itemId={item.id} status={item.status} />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-900">ケア状態</h3>
              <p className="mt-1 text-sm text-gray-600">
                {item.care_status
                  ? ITEM_CARE_STATUS_LABELS[item.care_status]
                  : "未設定"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                ケア状態は補助情報で、手放し状態とは別に扱います。
              </p>
              <div className="mt-4">
                <ItemCareStatusAction
                  itemId={item.id}
                  careStatus={item.care_status}
                />
              </div>
            </section>
          </div>
        </section>

        <ItemPreviewCard
          name={item.name ?? ""}
          category={item.category}
          shape={item.shape}
          mainColorHex={mainColor?.hex}
          mainColorLabel={mainColor?.label}
          subColorHex={subColor?.hex}
          subColorLabel={subColor?.label}
          topsSpec={topsSpec}
          topsSpecRaw={topsSpecRaw}
          spec={item.spec}
          images={item.images}
          skinTonePreset={skinTonePreset}
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-gray-600">
            {categoryLabel} / {shapeLabel}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {mainColor && (
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-sm">
                <span
                  className="h-4 w-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: mainColor.hex }}
                />
                {mainColor.label}
              </span>
            )}
            {subColor && (
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm">
                <span
                  className="h-4 w-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: subColor.hex }}
                />
                {subColor.label}
              </span>
            )}
          </div>

          <p className="mt-4 text-sm text-gray-600">
            季節： {item.seasons?.length ? item.seasons.join(" / ") : "未設定"}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            TPO： {item.tpos?.length ? item.tpos.join(" / ") : "未設定"}
          </p>
          {bottomsLengthLabel ? (
            <p className="mt-1 text-sm text-gray-600">
              ボトムス丈： {bottomsLengthLabel}
            </p>
          ) : null}
          {legwearCoverageLabel ? (
            <p className="mt-1 text-sm text-gray-600">
              レッグウェア： {legwearCoverageLabel}
            </p>
          ) : null}
          {groupedMaterials.length > 0 ? (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-900">
                素材・混率
              </h2>
              <div className="mt-2 space-y-1">
                {groupedMaterials.map((group) => (
                  <p key={group.partLabel} className="text-sm text-gray-600">
                    {group.partLabel}： {group.labels.join("、")}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">画像</h2>
          {itemImages.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {itemImages.map((image) => (
                <article
                  key={image.id ?? `${image.path}-${image.sort_order}`}
                  className="overflow-hidden rounded-xl border border-gray-200"
                >
                  {image.url ? (
                    <div className="flex aspect-[3/4] items-center justify-center bg-gray-50 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.original_filename ?? "item image"}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-gray-100 text-sm text-gray-400">
                      画像なし
                    </div>
                  )}
                  <div className="p-3 text-sm text-gray-600">
                    {image.sort_order}枚目
                    {image.is_primary ? " / 代表画像" : ""}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-600">画像はまだありません。</p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            購入・サイズ情報
          </h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-700">ブランド名</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {item.brand_name ?? "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">実購入価格</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {formatItemPrice(item.price ?? null)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">ケア状態</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {item.care_status
                  ? ITEM_CARE_STATUS_LABELS[item.care_status]
                  : "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">購入 URL</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {item.purchase_url ? (
                  <a
                    href={item.purchase_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    開く
                  </a>
                ) : (
                  "未設定"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">購入日</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {item.purchased_at ? item.purchased_at.slice(0, 10) : "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">サイズ区分</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {item.size_gender
                  ? (ITEM_SIZE_GENDER_LABELS[item.size_gender] ?? "未設定")
                  : "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">サイズ表記</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {item.size_label ?? "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">
                サイズ感メモ
              </dt>
              <dd className="mt-1 text-sm text-gray-600">
                {item.size_note ?? "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">雨対応</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {item.is_rain_ok ? "対応" : "未対応"}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-700">実寸</dt>
              {visibleStructuredSizeFields.length > 0 ||
              visibleCustomSizeFields.length > 0 ? (
                <dd className="mt-2 space-y-3 text-sm text-gray-600">
                  {visibleStructuredSizeFields.length > 0 ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      {visibleStructuredSizeFields.map((field) => (
                        <div
                          key={field.name}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                        >
                          <span className="text-gray-700">{field.label}</span>
                          <span>
                            {formatSizeDetailValue(
                              normalizedSizeDetails?.structured?.[field.name] ??
                                0,
                            )}
                            cm
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {visibleCustomSizeFields.length > 0 ? (
                    <div className="space-y-2">
                      {visibleCustomSizeFields
                        .slice()
                        .sort(
                          (left, right) => left.sort_order - right.sort_order,
                        )
                        .map((field) => (
                          <div
                            key={`${field.label}-${field.sort_order}`}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                          >
                            <span className="text-gray-700">{field.label}</span>
                            <span>{formatSizeDetailValue(field.value)}cm</span>
                          </div>
                        ))}
                    </div>
                  ) : null}
                </dd>
              ) : (
                <dd className="mt-1 text-sm text-gray-600">未設定</dd>
              )}
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-700">メモ</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                {item.memo ?? "未設定"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
