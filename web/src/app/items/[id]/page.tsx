import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteItemButton from "@/components/items/delete-item-button";
import ItemCareStatusAction from "@/components/items/item-care-status-action";
import ItemDuplicateActions from "@/components/items/item-duplicate-actions";
import ItemStatusAction from "@/components/items/item-status-action";
import { EntityDetailHeader } from "@/components/shared/entity-detail-header";
import { PurchaseUrlLink } from "@/components/shared/purchase-url-link";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import { buildPageMetadata } from "@/lib/metadata";
import { DEFAULT_SKIN_TONE_PRESET } from "@/lib/master-data/skin-tone-presets";
import type { SkinTonePreset } from "@/types/settings";
import type { ItemRecord } from "@/types/items";
import {
  formatItemPrice,
  ITEM_CARE_STATUS_LABELS,
  ITEM_SHEERNESS_LABELS,
  ITEM_SIZE_GENDER_LABELS,
} from "@/lib/items/metadata";
import {
  formatSizeDetailValue,
  getStructuredSizeFieldDefinitions,
  normalizeItemSizeDetails,
} from "@/lib/items/size-details";
import { groupItemMaterialsForDisplay } from "@/lib/items/materials";
import { resolveCurrentItemCategoryValue } from "@/lib/api/categories";
import {
  findItemCategoryLabel,
  findItemShapeLabel,
  resolveCurrentItemShapeValue,
} from "@/lib/master-data/item-shapes";
import {
  findItemSubcategoryLabel,
  resolveCurrentItemSubcategoryValue,
} from "@/lib/master-data/item-subcategories";
import { buildTopsSpecLabels } from "@/lib/master-data/item-tops";
import {
  BOTTOMS_RISE_OPTIONS,
  findBottomsLengthLabel,
  findLegwearCoverageLabel,
  findSkirtDesignLabel,
  findSkirtLengthLabel,
  findSkirtMaterialLabel,
} from "@/lib/master-data/item-skin-exposure";

const fallbackMetadata = buildPageMetadata("アイテム詳細");

type ItemGroupItem = NonNullable<ItemRecord["group_items"]>[number];
type ItemColor = ItemRecord["colors"][number];

async function fetchItemDetail(
  id: string,
): Promise<{ status: number; item: ItemRecord | null }> {
  const res = await fetchLaravelWithCookie(`/api/items/${id}`);
  const data = await res.json().catch(() => null);

  return {
    status: res.status,
    item: res.ok ? ((data?.item as ItemRecord | undefined) ?? null) : null,
  };
}

async function getItem(id: string): Promise<ItemRecord> {
  const result = await fetchItemDetail(id);

  if (result.status === 401) redirect("/login");
  if (!result.item) redirect("/items");

  return result.item;
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

function resolveItemReturnTarget(
  item: ItemRecord,
  currentCategory: string,
  returnToParam: string | null,
  returnLabelParam: string | null,
) {
  if (returnToParam) {
    return {
      href: returnToParam,
      label: returnLabelParam ?? "戻る",
    };
  }

  const isUnderwear =
    currentCategory === "underwear" ||
    item.category === "underwear" ||
    (item.category === "inner" &&
      (item.subcategory === "underwear" || item.shape === "underwear"));

  if (isUnderwear && item.status === "disposed") {
    return {
      href: "/items/underwear/disposed",
      label: "手放したアンダーウェア一覧",
    };
  }

  if (isUnderwear) {
    return {
      href: "/items/underwear",
      label: "アンダーウェア一覧",
    };
  }

  if (item.status === "disposed") {
    return {
      href: "/items/disposed",
      label: "手放したアイテム一覧",
    };
  }

  return {
    href: "/items",
    label: "アイテム一覧",
  };
}

function shouldPreserveItemReturnContext(
  href: string,
  currentCategory: string,
  item: ItemRecord,
) {
  if (href.startsWith("/items/underwear")) {
    return true;
  }

  if (href === "/items/disposed" && item.status === "disposed") {
    return true;
  }

  return currentCategory === "underwear" || item.category === "underwear";
}

function buildItemDetailHref(
  itemId: number,
  returnTarget: { href: string; label: string },
  shouldPreserveReturnContext: boolean,
) {
  if (!shouldPreserveReturnContext) {
    return `/items/${itemId}`;
  }

  return `/items/${itemId}?${new URLSearchParams({
    return_to: returnTarget.href,
    return_label: returnTarget.label,
  }).toString()}`;
}

function getItemGroupStatusBadgeClass(status: ItemRecord["status"]): string {
  if (status === "disposed") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-500";
}

function resolveGroupItemColor(item: ItemGroupItem) {
  return item.colors.find((color) => color.role === "main") ?? item.colors[0];
}

function resolveGroupItemColorLabel(item: ItemGroupItem) {
  const color = resolveGroupItemColor(item);

  if (!color) {
    return item.name ?? "色未設定";
  }

  return color.custom_label?.trim() || color.label || item.name || "色未設定";
}

function resolveItemColorDisplayLabel(color: ItemColor | undefined) {
  if (!color) {
    return null;
  }

  return (
    color.custom_label?.trim() ||
    color.label ||
    (color.hex ? "カスタムカラー" : null)
  );
}

function ItemSummaryColorChip({ label, hex }: { label: string; hex: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700">
      <span
        className="h-3 w-3 rounded-full border border-gray-300"
        style={{ backgroundColor: hex }}
      />
      <span className="font-medium text-gray-800">{label}</span>
    </span>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchItemDetail(id);
  const itemName = result.item?.name?.trim();

  if (!itemName) {
    return fallbackMetadata;
  }

  return buildPageMetadata(`${itemName} | アイテム`);
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
  const [item] = await Promise.all([getItem(id), getSkinTonePreset()]);
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
  const currentCategory =
    resolveCurrentItemCategoryValue(item.category, item.shape) ?? item.category;
  const returnTarget = resolveItemReturnTarget(
    item,
    currentCategory,
    returnToParam,
    returnLabelParam,
  );
  const shouldPreserveReturnContext = shouldPreserveItemReturnContext(
    returnTarget.href,
    currentCategory,
    item,
  );
  const editHref = shouldPreserveReturnContext
    ? `/items/${item.id}/edit?${new URLSearchParams({
        return_to: returnTarget.href,
        return_label: returnTarget.label,
      }).toString()}`
    : `/items/${item.id}/edit`;
  const bottomsLengthLabel =
    currentCategory === "skirts"
      ? findSkirtLengthLabel(
          item.spec?.skirt?.length_type,
          item.spec?.bottoms?.length_type,
        )
      : findBottomsLengthLabel(item.spec?.bottoms?.length_type);
  const legwearCoverageLabel = findLegwearCoverageLabel(
    item.spec?.legwear?.coverage_type,
  );
  const skirtMaterialLabel =
    currentCategory === "skirts"
      ? findSkirtMaterialLabel(item.spec?.skirt?.material_type)
      : "";
  const skirtDesignLabel =
    currentCategory === "skirts"
      ? findSkirtDesignLabel(item.spec?.skirt?.design_type)
      : "";
  const currentSubcategory =
    resolveCurrentItemSubcategoryValue(
      currentCategory,
      item.shape,
      item.subcategory,
    ) ?? null;
  const currentShape =
    resolveCurrentItemShapeValue(item.category, item.shape) ?? "";
  const categoryLabel = findItemCategoryLabel(currentCategory);
  const subcategoryLabel = findItemSubcategoryLabel(
    currentCategory,
    currentSubcategory,
  );
  const shapeLabel = currentShape
    ? findItemShapeLabel(currentCategory, currentShape)
    : "";
  const itemImages = item.images ?? [];
  const primaryImage =
    itemImages.find((image) => image.is_primary) ?? itemImages[0] ?? null;
  const normalizedSizeDetails = normalizeItemSizeDetails(item.size_details);
  const structuredSizeFieldDefinitions = getStructuredSizeFieldDefinitions(
    currentCategory,
    currentShape,
  );
  const visibleStructuredSizeFields = structuredSizeFieldDefinitions.filter(
    (field) => normalizedSizeDetails?.structured?.[field.name] !== undefined,
  );
  const visibleCustomSizeFields = normalizedSizeDetails?.custom_fields ?? [];
  const groupedMaterials = groupItemMaterialsForDisplay(item.materials);
  const groupItems = item.group_items ?? [];
  const itemMemo = item.memo?.trim() ? item.memo : null;
  const purchaseUrl = item.purchase_url?.trim() ? item.purchase_url : null;
  const purchasedAt = item.purchased_at?.trim() ? item.purchased_at : null;
  const purchaseDetails: Array<{
    label: string;
    value: ReactNode;
    isFullWidth?: boolean;
  }> = [];
  if (item.price !== null && item.price !== undefined) {
    purchaseDetails.push({
      label: "購入価格",
      value: formatItemPrice(item.price),
    });
  }
  if (purchasedAt) {
    purchaseDetails.push({
      label: "購入日",
      value: purchasedAt.slice(0, 10),
    });
  }
  if (purchaseUrl) {
    purchaseDetails.push({
      label: "購入 URL",
      value: <PurchaseUrlLink url={purchaseUrl} />,
      isFullWidth: true,
    });
  }
  const bottomsRiseLabel =
    BOTTOMS_RISE_OPTIONS.find(
      (option) => option.value === item.spec?.bottoms?.rise_type,
    )?.label ?? "";
  const classificationDetails = [
    { label: "カテゴリ", value: categoryLabel },
    { label: "種類", value: subcategoryLabel },
    { label: "形", value: shapeLabel },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value),
  );
  const specDetails = [
    { label: "袖", value: topsSpec?.sleeve ?? "" },
    { label: "丈", value: topsSpec?.length || bottomsLengthLabel },
    { label: "首回り", value: topsSpec?.neck ?? "" },
    { label: "デザイン", value: topsSpec?.design || skirtDesignLabel },
    { label: "シルエット", value: topsSpec?.fit ?? "" },
    { label: "股上", value: bottomsRiseLabel },
    { label: "素材", value: skirtMaterialLabel },
    { label: "レッグウェア", value: legwearCoverageLabel },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value),
  );
  const colorChips = [
    mainColor
      ? {
          key: "main",
          label: resolveItemColorDisplayLabel(mainColor) ?? "色未設定",
          hex: mainColor.hex ?? "#E5E7EB",
          supportingLabel: "メインカラー",
          tone: "main" as const,
        }
      : null,
    subColor
      ? {
          key: "sub",
          label: resolveItemColorDisplayLabel(subColor) ?? "色未設定",
          hex: subColor.hex ?? "#E5E7EB",
          supportingLabel: "サブカラー",
          tone: "sub" as const,
        }
      : null,
  ].filter(
    (
      chip,
    ): chip is {
      key: string;
      label: string;
      hex: string;
      supportingLabel: string;
      tone: "main" | "sub";
    } => Boolean(chip),
  );
  const sizeSummary = [
    item.size_gender ? ITEM_SIZE_GENDER_LABELS[item.size_gender] : "",
    item.size_label ?? "",
  ]
    .filter(Boolean)
    .join(" / ");
  const hasColorVariants = groupItems.length > 1;
  const summaryItemDetails = [
    { label: "ブランド", value: item.brand_name ?? "" },
    { label: "サイズ", value: sizeSummary },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value),
  );
  const summaryConditionDetails = [
    {
      label: "季節",
      value: item.seasons?.length ? item.seasons.join(" / ") : "",
    },
    {
      label: "TPO",
      value: item.tpos?.length ? item.tpos.join(" / ") : "",
    },
    { label: "雨対応", value: item.is_rain_ok ? "対応" : "非対応" },
    {
      label: "ケア状態",
      value: item.care_status ? ITEM_CARE_STATUS_LABELS[item.care_status] : "",
    },
    {
      label: "透け感",
      value: item.sheerness ? ITEM_SHEERNESS_LABELS[item.sheerness] : "",
    },
    {
      label: "状態",
      value: item.status === "disposed" ? "手放し済み" : "",
    },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value),
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <EntityDetailHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: returnTarget.label, href: returnTarget.href },
            { label: "詳細" },
          ]}
          eyebrow="アイテム詳細"
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
            <ItemDuplicateActions
              itemId={item.id}
              editHref={editHref}
              returnHref={returnTarget.href}
              returnLabel="一覧へ戻る"
            />
          }
        />

        <section
          data-testid="item-detail-summary"
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
        >
          <div className="grid gap-5 md:grid-cols-[minmax(0,12rem)_1fr] md:items-start">
            {primaryImage?.url ? (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                <div className="flex min-h-[12rem] items-center justify-center p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryImage.url}
                    alt={primaryImage.original_filename ?? "item image"}
                    className="max-h-[13rem] w-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex min-h-[10rem] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                画像なし
              </div>
            )}

            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-4">
                  {summaryItemDetails.length > 0 ? (
                    <dl className="grid gap-4">
                      {summaryItemDetails.map((detail) => (
                        <div key={detail.label} className="space-y-1">
                          <dt className="text-xs font-medium text-gray-500">
                            {detail.label}
                          </dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {detail.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {colorChips.length > 0 || hasColorVariants ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="sr-only">色</span>
                      {colorChips.map((chip) => (
                        <ItemSummaryColorChip
                          key={chip.key}
                          label={chip.label}
                          hex={chip.hex}
                        />
                      ))}
                      {hasColorVariants ? (
                        <span className="text-xs font-medium text-gray-500">
                          色違いあり
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {summaryConditionDetails.length > 0 ? (
                  <dl className="grid gap-4">
                    {summaryConditionDetails.map((detail) => (
                      <div key={detail.label} className="space-y-1">
                        <dt className="text-xs font-medium text-gray-500">
                          {detail.label}
                        </dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {detail.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                関連コーディネート
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                このアイテムを含むコーディネートを確認できます。
              </p>
            </div>
            <Link
              href={`/outfits?item_id=${item.id}`}
              className="inline-flex items-center justify-center self-start rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 sm:self-auto"
            >
              コーディネートを見る
            </Link>
          </div>
        </section>

        <div className="space-y-6">
          {groupItems.length > 1 ? (
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-medium text-slate-800">
                    色違いの候補
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    アイテムを選ぶと別の詳細へ移動します。
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-500">
                  色違い {groupItems.length}件
                </span>
              </div>
              <nav
                aria-label="色違いの候補"
                className="mt-2.5 flex gap-2 overflow-x-auto pb-1"
              >
                {groupItems.map((groupItem) => {
                  const groupColor = resolveGroupItemColor(groupItem);
                  const colorLabel = resolveGroupItemColorLabel(groupItem);
                  const groupItemHref = buildItemDetailHref(
                    groupItem.id,
                    returnTarget,
                    shouldPreserveReturnContext,
                  );
                  const content = (
                    <>
                      <span
                        className="h-4 w-6 shrink-0 rounded-[5px] border border-slate-300 shadow-sm"
                        style={{
                          backgroundColor: groupColor?.hex ?? "#E5E7EB",
                        }}
                        title={colorLabel}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] text-slate-400">
                          {colorLabel}
                        </span>
                      </span>
                      {groupItem.status === "disposed" ? (
                        <span
                          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${getItemGroupStatusBadgeClass(
                            groupItem.status,
                          )}`}
                        >
                          手放し済み
                        </span>
                      ) : null}
                      {groupItem.is_current ? (
                        <span className="shrink-0 rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          表示中
                        </span>
                      ) : null}
                    </>
                  );
                  const className = `flex min-w-48 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
                    groupItem.is_current
                      ? "border-slate-500 bg-white shadow-sm"
                      : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white"
                  }`;

                  return groupItem.is_current ? (
                    <span
                      key={groupItem.id}
                      aria-current="page"
                      className={className}
                    >
                      {content}
                    </span>
                  ) : (
                    <Link
                      key={groupItem.id}
                      href={groupItemHref}
                      className={className}
                    >
                      {content}
                    </Link>
                  );
                })}
              </nav>
            </section>
          ) : null}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">分類</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              {classificationDetails.map((detail) => (
                <div key={detail.label}>
                  <dt className="text-sm font-medium text-gray-700">
                    {detail.label}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-600">{detail.value}</dd>
                </div>
              ))}
              {specDetails.length > 0 ? (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-700">
                    仕様・属性
                  </dt>
                  <dd className="mt-2 grid gap-2 md:grid-cols-2">
                    {specDetails.map((detail) => (
                      <div
                        key={detail.label}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <p className="text-xs font-medium text-gray-500">
                          {detail.label}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {detail.value}
                        </p>
                      </div>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              サイズ・実寸
            </h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-700">
                  サイズ区分
                </dt>
                <dd className="mt-1 text-sm text-gray-600">
                  {item.size_gender
                    ? (ITEM_SIZE_GENDER_LABELS[item.size_gender] ?? "未設定")
                    : "未設定"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-700">
                  サイズ表記
                </dt>
                <dd className="mt-1 text-sm text-gray-600">
                  {item.size_label ?? "未設定"}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-700">
                  サイズ感メモ
                </dt>
                <dd className="mt-1 text-sm text-gray-600">
                  {item.size_note ?? "未設定"}
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
                                normalizedSizeDetails?.structured?.[
                                  field.name
                                ] ?? {},
                              )}
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
                              <span className="text-gray-700">
                                {field.label}
                              </span>
                              <span>{formatSizeDetailValue(field)}</span>
                            </div>
                          ))}
                      </div>
                    ) : null}
                  </dd>
                ) : (
                  <dd className="mt-1 text-sm text-gray-600">未設定</dd>
                )}
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">素材・混率</h2>
            {groupedMaterials.length > 0 ? (
              <div className="mt-4 space-y-1">
                {groupedMaterials.map((group) => (
                  <p key={group.partLabel} className="text-sm text-gray-600">
                    {group.partLabel}: {group.labels.join("、")}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-600">未設定</p>
            )}
          </section>

          {purchaseDetails.length > 0 ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">購入情報</h2>
              <dl className="mt-4 grid gap-4 md:grid-cols-2">
                {purchaseDetails.map((detail) => (
                  <div
                    key={detail.label}
                    className={detail.isFullWidth ? "md:col-span-2" : ""}
                  >
                    <dt className="text-sm font-medium text-gray-700">
                      {detail.label}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-600">
                      {detail.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {itemMemo ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">補足情報</h2>
              <dl className="mt-4">
                <div>
                  <dt className="text-sm font-medium text-gray-700">メモ</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                    {itemMemo}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          {itemImages.length >= 2 ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">画像一覧</h2>
              <div className="mt-4 space-y-3">
                {itemImages.map((image) => (
                  <article
                    key={image.id ?? `${image.path}-${image.sort_order}`}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                  >
                    {image.url ? (
                      <div className="flex max-h-[28rem] min-h-[16rem] items-center justify-center bg-gray-50 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={image.original_filename ?? "item image"}
                          className="h-full max-h-[24rem] w-full object-contain"
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
            </section>
          ) : null}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">状態管理</h2>
            <p className="mt-2 text-sm text-gray-600">
              所持しなくなった場合は「手放す」を使います。必要になった時は「クローゼットに戻す」で通常状態へ戻せます。
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-medium text-gray-900">所持状態</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {item.status === "disposed" ? "手放し済み" : "所持品"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  一覧や登録候補への表示状態を切り替える補助操作です。
                </p>
                <div className="mt-4">
                  <ItemStatusAction itemId={item.id} status={item.status} />
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-medium text-gray-900">ケア状態</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {item.care_status
                    ? ITEM_CARE_STATUS_LABELS[item.care_status]
                    : "未設定"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
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

          <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">削除</h2>
            <div className="mt-3 space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  誤って登録したアイテムなど、履歴として残す必要がない場合にのみ削除してください。
                </p>
                <p>
                  実際に手放したアイテムは「手放す」を使うと、履歴を残したまま管理できます。
                </p>
              </div>
              <DeleteItemButton
                itemId={item.id}
                convertedPurchaseCandidatesCount={
                  item.converted_purchase_candidates_count ?? 0
                }
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
