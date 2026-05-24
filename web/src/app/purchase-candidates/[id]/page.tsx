import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata";
import PurchaseCandidateColorVariantAction from "@/components/purchase-candidates/purchase-candidate-color-variant-action";
import PurchaseCandidateDetailImages from "@/components/purchase-candidates/purchase-candidate-detail-images";
import PurchaseCandidateDuplicateAction from "@/components/purchase-candidates/purchase-candidate-duplicate-action";
import PurchaseCandidateItemDraftAction from "@/components/purchase-candidates/purchase-candidate-item-draft-action";
import PurchaseCandidateShoppingMemoAdd from "@/components/purchase-candidates/purchase-candidate-shopping-memo-add";
import PurchaseCandidateSizeComparison from "@/components/purchase-candidates/purchase-candidate-size-comparison";
import PurchaseCandidateSizeDetails from "@/components/purchase-candidates/purchase-candidate-size-details";
import SafeImage from "@/components/images/safe-image";
import { PurchaseUrlLink } from "@/components/shared/purchase-url-link";
import { EntityDetailHeader } from "@/components/shared/entity-detail-header";
import { resolvePurchaseCandidateItemClassification } from "@/lib/items/classification";
import { groupItemMaterialsForDisplay } from "@/lib/items/materials";
import { ITEM_SHEERNESS_LABELS } from "@/lib/items/metadata";
import {
  findBottomsLengthLabel,
  findLegwearCoverageLabel,
  findSkirtDesignLabel,
  findSkirtLengthLabel,
  findSkirtMaterialLabel,
} from "@/lib/master-data/item-skin-exposure";
import { buildTopsSpecLabels } from "@/lib/master-data/item-tops";
import { findItemSubcategoryLabel } from "@/lib/master-data/item-subcategories";
import {
  findItemCategoryLabel,
  findItemShapeLabel,
} from "@/lib/master-data/item-shapes";
import {
  PURCHASE_CANDIDATE_COLOR_ROLE_LABELS,
  PURCHASE_CANDIDATE_PRIORITY_LABELS,
  PURCHASE_CANDIDATE_SIZE_GENDER_LABELS,
  PURCHASE_CANDIDATE_STATUS_LABELS,
} from "@/lib/purchase-candidates/labels";
import { formatPurchaseCandidateDateTime } from "@/lib/purchase-candidates/date-time";
import { getPurchaseCandidateSizeOptions } from "@/lib/purchase-candidates/size-comparison";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type { ItemRecord } from "@/types/items";
import type {
  PurchaseCandidateColor,
  PurchaseCandidateDetailResponse,
  PurchaseCandidateGroupCandidate,
  PurchaseCandidateStatus,
} from "@/types/purchase-candidates";

const fallbackMetadata = buildPageMetadata("購入検討詳細");
const SUMMARY_NOTE_FULL_TEXT_THRESHOLD = 120;

function formatPrice(price: number | null): string {
  if (price === null) {
    return "未設定";
  }

  return `${price.toLocaleString("ja-JP")}円`;
}

function formatDateTime(value: string | null | undefined): string {
  return formatPurchaseCandidateDateTime(value, "long");
}

function shouldShowSupplementSection(
  candidate: PurchaseCandidateDetailResponse["purchaseCandidate"],
) {
  return [candidate.wanted_reason, candidate.memo].some(
    (value) => (value?.length ?? 0) > SUMMARY_NOTE_FULL_TEXT_THRESHOLD,
  );
}

function getStatusBadgeClass(status: PurchaseCandidateStatus): string {
  switch (status) {
    case "purchased":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "dropped":
      return "border-gray-300 bg-gray-100 text-gray-600";
    case "on_hold":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "considering":
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function resolveColorDisplayLabel(
  color: PurchaseCandidateColor | undefined,
): string | null {
  if (!color) {
    return null;
  }

  return color.custom_label?.trim() || color.label;
}

function resolveGroupCandidateColor(
  candidate: PurchaseCandidateGroupCandidate,
) {
  return (
    candidate.colors.find((color) => color.role === "main") ??
    candidate.colors[0]
  );
}

function PurchaseCandidateGroupPrice({
  price,
  salePrice,
}: {
  price: number | null;
  salePrice: number | null;
}) {
  if (salePrice === null) {
    return <span>{price === null ? "価格未設定" : formatPrice(price)}</span>;
  }

  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-medium text-rose-700">
        {formatPrice(salePrice)}
      </span>
      {price !== null ? (
        <span className="text-[11px] text-slate-400 line-through">
          {formatPrice(price)}
        </span>
      ) : null}
    </span>
  );
}

function PurchaseCandidateGroupNavigation({
  candidates,
  detailQueryString,
}: {
  candidates: PurchaseCandidateGroupCandidate[];
  detailQueryString?: string;
}) {
  if (candidates.length <= 1) {
    return null;
  }

  const buildDetailHref = (candidateId: number) =>
    detailQueryString
      ? `/purchase-candidates/${candidateId}?${detailQueryString}`
      : `/purchase-candidates/${candidateId}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-slate-800">
            同じ商品の色違い
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            候補を選ぶと別の詳細へ移動します。
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-500">
          色違い {candidates.length}件
        </span>
      </div>
      <nav
        aria-label="同じ商品の色違い"
        className="mt-2.5 flex gap-2 overflow-x-auto pb-1"
      >
        {candidates.map((groupCandidate) => {
          const color = resolveGroupCandidateColor(groupCandidate);
          const colorDisplayLabel = resolveColorDisplayLabel(color);
          const content = (
            <>
              <span
                className="h-4 w-6 shrink-0 rounded-[5px] border border-slate-300 shadow-sm"
                style={{ backgroundColor: color?.hex ?? "#E5E7EB" }}
                title={colorDisplayLabel ?? "色未設定"}
              />
              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="block truncate text-[11px] text-slate-400">
                  {colorDisplayLabel ?? groupCandidate.name}
                </span>
                <span className="block truncate text-xs text-slate-700">
                  <PurchaseCandidateGroupPrice
                    price={groupCandidate.price}
                    salePrice={groupCandidate.sale_price}
                  />
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${getStatusBadgeClass(groupCandidate.status)}`}
              >
                {PURCHASE_CANDIDATE_STATUS_LABELS[groupCandidate.status]}
              </span>
              {groupCandidate.is_current ? (
                <span className="shrink-0 rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  表示中
                </span>
              ) : null}
            </>
          );

          const className = `flex min-w-48 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
            groupCandidate.is_current
              ? "border-slate-500 bg-white shadow-sm"
              : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white"
          }`;

          return groupCandidate.is_current ? (
            <span
              key={groupCandidate.id}
              aria-current="page"
              className={className}
            >
              {content}
            </span>
          ) : (
            <Link
              key={groupCandidate.id}
              href={buildDetailHref(groupCandidate.id)}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

function PurchaseDecisionSummaryCard({
  candidate,
}: {
  candidate: PurchaseCandidateDetailResponse["purchaseCandidate"];
}) {
  const summaryImage =
    candidate.images.find((image) => image.is_primary) ??
    candidate.images[0] ??
    null;
  const summaryMainColor = candidate.colors.find(
    (color) => color.role === "main",
  );
  const summarySubColor = candidate.colors.find(
    (color) => color.role === "sub",
  );
  const summaryColorChips = [summaryMainColor, summarySubColor].filter(
    (color): color is PurchaseCandidateColor => Boolean(color),
  );
  const summaryColorLabel =
    summaryColorChips.length > 0
      ? summaryColorChips
          .map((color) => resolveColorDisplayLabel(color))
          .filter(Boolean)
          .join(" / ")
      : null;
  const hasColorVariants = (candidate.group_candidates ?? []).some(
    (groupCandidate) => !groupCandidate.is_current,
  );
  const summarySize = [
    candidate.size_gender
      ? PURCHASE_CANDIDATE_SIZE_GENDER_LABELS[candidate.size_gender]
      : null,
    candidate.size_label,
  ].filter(Boolean);
  const productDetails = [
    candidate.brand_name
      ? { label: "ブランド", value: candidate.brand_name }
      : null,
    summarySize.length > 0
      ? { label: "サイズ", value: summarySize.join(" / ") }
      : null,
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail),
  );
  const purchaseDetails = [
    candidate.price !== null
      ? { label: "価格", value: formatPrice(candidate.price) }
      : null,
    candidate.sale_price !== null
      ? { label: "セール価格", value: formatPrice(candidate.sale_price) }
      : null,
    candidate.sale_ends_at
      ? { label: "販売終了日", value: formatDateTime(candidate.sale_ends_at) }
      : null,
    candidate.discount_ends_at
      ? {
          label: "セール終了日",
          value: formatDateTime(candidate.discount_ends_at),
        }
      : null,
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail),
  );
  const hasNotes = Boolean(candidate.wanted_reason || candidate.memo);

  if (
    !summaryImage &&
    productDetails.length === 0 &&
    purchaseDetails.length === 0 &&
    summaryColorChips.length === 0 &&
    !hasNotes &&
    !candidate.purchase_url
  ) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
      data-testid="purchase-decision-summary"
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,12rem)_1fr] md:items-start">
        {summaryImage ? (
          <div className="flex max-h-56 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2 md:max-h-none">
            <SafeImage
              src={summaryImage.url}
              alt={summaryImage.original_filename ?? candidate.name}
              className="max-h-52 w-full object-contain md:max-h-60"
              fallback={
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-gray-100 px-3 text-center text-sm text-gray-500">
                  画像を表示できません
                </div>
              }
            />
          </div>
        ) : null}

        <div className="min-w-0 space-y-4">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              {productDetails.length > 0 ? (
                <dl className="grid gap-3">
                  {productDetails.map((detail) => (
                    <div key={detail.label}>
                      <dt className="text-xs font-medium text-gray-500">
                        {detail.label}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900">
                        {detail.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {summaryColorChips.length > 0 ? (
                <div
                  aria-label={`色: ${summaryColorLabel}`}
                  className="inline-flex flex-wrap items-center gap-2"
                >
                  {summaryColorChips.map((color) => {
                    const colorLabel = resolveColorDisplayLabel(color);
                    return (
                      <span
                        key={`${color.role}-${color.value}`}
                        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs text-gray-700 ${
                          color.role === "main"
                            ? "border border-gray-300 bg-white"
                            : "border border-gray-200 bg-gray-50"
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.hex }}
                        />
                        {PURCHASE_CANDIDATE_COLOR_ROLE_LABELS[color.role]}:{" "}
                        {colorLabel}
                      </span>
                    );
                  })}
                  {hasColorVariants ? (
                    <span className="text-xs font-medium text-gray-500">
                      色違いあり
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              {purchaseDetails.length > 0 ? (
                <dl className="grid gap-3">
                  {purchaseDetails.map((detail) => (
                    <div key={detail.label}>
                      <dt className="text-xs font-medium text-gray-500">
                        {detail.label}
                      </dt>
                      <dd
                        className={`mt-1 text-sm font-medium ${detail.label === "セール価格" ? "text-rose-700" : "text-gray-900"}`}
                      >
                        {detail.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {candidate.purchase_url ? (
                <div className="text-sm">
                  <PurchaseUrlLink url={candidate.purchase_url} />
                </div>
              ) : null}
            </div>
          </div>

          {hasNotes ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {candidate.wanted_reason ? (
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">
                    欲しい理由
                  </p>
                  <p className="mt-1 line-clamp-3 text-sm font-medium leading-6 text-gray-900">
                    {candidate.wanted_reason}
                  </p>
                </div>
              ) : null}
              {candidate.memo ? (
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">メモ</p>
                  <p className="mt-1 line-clamp-3 text-sm font-medium leading-6 text-gray-900">
                    {candidate.memo}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

async function fetchPurchaseCandidateDetail(id: string): Promise<{
  status: number;
  purchaseCandidate:
    | PurchaseCandidateDetailResponse["purchaseCandidate"]
    | null;
}> {
  const response = await fetchLaravelWithCookie(
    `/api/purchase-candidates/${id}`,
  );
  const data = (await response
    .json()
    .catch(() => null)) as PurchaseCandidateDetailResponse | null;

  return {
    status: response.status,
    purchaseCandidate: response.ok ? (data?.purchaseCandidate ?? null) : null,
  };
}

async function getPurchaseCandidate(id: string) {
  const result = await fetchPurchaseCandidateDetail(id);

  if (result.status === 401) {
    redirect("/login");
  }

  if (!result.purchaseCandidate) {
    redirect("/purchase-candidates");
  }

  return result.purchaseCandidate;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchPurchaseCandidateDetail(id);
  const candidateName = result.purchaseCandidate?.name?.trim();

  if (!candidateName) {
    return fallbackMetadata;
  }

  return buildPageMetadata(`${candidateName} | 購入検討`);
}

async function getComparableItems(category?: string | null) {
  if (!category) {
    return [] as ItemRecord[];
  }

  const searchParams = new URLSearchParams({
    category,
    all: "1",
  });
  const response = await fetchLaravelWithCookie(
    `/api/items?${searchParams.toString()}`,
  );

  if (!response.ok) {
    return [] as ItemRecord[];
  }

  const data = (await response.json()) as {
    items?: ItemRecord[];
  };

  return data.items ?? [];
}

export default async function PurchaseCandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const candidate = await getPurchaseCandidate(id);
  const resolvedItemCategory = resolvePurchaseCandidateItemClassification(
    candidate.category_id,
    candidate.shape,
  );
  const returnToParam =
    typeof resolvedSearchParams.return_to === "string"
      ? resolvedSearchParams.return_to
      : null;
  const returnLabelParam =
    typeof resolvedSearchParams.return_label === "string"
      ? resolvedSearchParams.return_label
      : null;
  const shoppingMemoReturnIdParam =
    typeof resolvedSearchParams.from_shopping_memo_id === "string"
      ? resolvedSearchParams.from_shopping_memo_id
      : null;
  const shoppingMemoReturnId =
    shoppingMemoReturnIdParam && /^\d+$/.test(shoppingMemoReturnIdParam)
      ? shoppingMemoReturnIdParam
      : null;
  const shoppingMemoReturnHref = shoppingMemoReturnId
    ? `/shopping-memos/${shoppingMemoReturnId}`
    : null;
  const returnTarget = returnToParam
    ? { href: returnToParam, label: returnLabelParam ?? "戻る" }
    : resolvedItemCategory?.category === "underwear"
      ? {
          href: "/purchase-candidates/underwear",
          label: "アンダーウェア購入検討一覧",
        }
      : { href: "/purchase-candidates", label: "購入検討一覧" };
  const shouldPreserveReturnContext =
    Boolean(returnToParam) || resolvedItemCategory?.category === "underwear";
  const detailQuery = new URLSearchParams({
    return_to: returnTarget.href,
    return_label: returnTarget.label,
  });

  if (shoppingMemoReturnId) {
    detailQuery.set("from_shopping_memo_id", shoppingMemoReturnId);
  }

  const detailQueryString = shouldPreserveReturnContext
    ? detailQuery.toString()
    : shoppingMemoReturnId
      ? `from_shopping_memo_id=${shoppingMemoReturnId}`
      : undefined;
  const editHref = shouldPreserveReturnContext
    ? `/purchase-candidates/${candidate.id}/edit?${detailQuery.toString()}`
    : `/purchase-candidates/${candidate.id}/edit`;
  const comparableItems = await getComparableItems(
    resolvedItemCategory?.category,
  );
  const topsSpec = buildTopsSpecLabels(candidate.spec?.tops);
  const categoryLabel = findItemCategoryLabel(resolvedItemCategory?.category);
  const subcategoryLabel = findItemSubcategoryLabel(
    resolvedItemCategory?.category,
    resolvedItemCategory?.subcategory,
  );
  const shapeLabel = findItemShapeLabel(
    resolvedItemCategory?.category,
    resolvedItemCategory?.shape,
  );
  const classificationDetails = [
    { label: "カテゴリ", value: categoryLabel },
    {
      label: "種類",
      value:
        subcategoryLabel || candidate.category_name || candidate.category_id,
    },
    { label: "形", value: shapeLabel },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value),
  );
  const specDetails = [
    { label: "袖", value: topsSpec?.sleeve ?? "" },
    { label: "丈", value: topsSpec?.length ?? "" },
    { label: "首回り", value: topsSpec?.neck ?? "" },
    { label: "デザイン", value: topsSpec?.design ?? "" },
    { label: "シルエット", value: topsSpec?.fit ?? "" },
    {
      label: "丈",
      value: findBottomsLengthLabel(candidate.spec?.bottoms?.length_type),
    },
    {
      label: "股上",
      value:
        candidate.spec?.bottoms?.rise_type === "high_waist"
          ? "ハイウエスト"
          : candidate.spec?.bottoms?.rise_type === "low_rise"
            ? "ローライズ"
            : "",
    },
    {
      label: "丈",
      value: findSkirtLengthLabel(candidate.spec?.skirt?.length_type),
    },
    {
      label: "素材感",
      value: findSkirtMaterialLabel(candidate.spec?.skirt?.material_type),
    },
    {
      label: "デザイン",
      value: findSkirtDesignLabel(candidate.spec?.skirt?.design_type),
    },
    {
      label: "レッグウェア",
      value: findLegwearCoverageLabel(candidate.spec?.legwear?.coverage_type),
    },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value),
  );
  const sizeOptions = getPurchaseCandidateSizeOptions({
    ...candidate,
    resolvedCategory: resolvedItemCategory?.category,
    resolvedSubcategory: resolvedItemCategory?.subcategory,
    resolvedShape: resolvedItemCategory?.shape,
  });
  const materialGroups = groupItemMaterialsForDisplay(candidate.materials);
  const showSupplementSection = shouldShowSupplementSection(candidate);
  const showImageSection = candidate.images.length > 1;

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <EntityDetailHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: returnTarget.label, href: returnTarget.href },
            { label: "詳細" },
          ]}
          eyebrow="購入検討管理"
          title={candidate.name}
          details={
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {PURCHASE_CANDIDATE_STATUS_LABELS[candidate.status]}
                </span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700">
                  優先度:{" "}
                  {PURCHASE_CANDIDATE_PRIORITY_LABELS[candidate.priority]}
                </span>
                {candidate.converted_item_id !== null && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    アイテム化済み
                  </span>
                )}
              </div>
              {candidate.status === "purchased" ? (
                <div className="space-y-2 text-sm leading-6 text-gray-600">
                  <p>
                    この購入検討はアイテム化済みの履歴です。購入検討側の更新はアイテムへ反映されません。
                  </p>
                  <p className="text-emerald-700">
                    新しく検討を続ける場合は「複製する」を使ってください。
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-sm leading-6 text-gray-600">
                  <p>
                    現在の候補内容からアイテム作成画面の初期値を生成します。
                  </p>
                  {candidate.converted_item_id !== null && (
                    <p className="text-emerald-700">
                      この候補はアイテム化済みです。必要なら初期値を再生成できます。
                    </p>
                  )}
                </div>
              )}
            </div>
          }
          actions={
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:min-w-[18rem] sm:items-end">
              <div className="flex flex-wrap justify-end gap-2">
                {candidate.status !== "purchased" && (
                  <PurchaseCandidateItemDraftAction
                    candidateId={candidate.id}
                    convertedItemId={candidate.converted_item_id}
                    sizeOptions={sizeOptions}
                  />
                )}
                <Link
                  href={editHref}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  編集
                </Link>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <PurchaseCandidateColorVariantAction
                  candidateId={candidate.id}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                />
                <PurchaseCandidateDuplicateAction
                  candidateId={candidate.id}
                  buttonLabel="複製"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                />
              </div>
              {shoppingMemoReturnHref ? (
                <div className="flex justify-end">
                  <Link
                    href={shoppingMemoReturnHref}
                    className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    買い物メモへ戻る
                  </Link>
                </div>
              ) : null}
              <div className="flex justify-end">
                <Link
                  href={returnTarget.href}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
                >
                  {shouldPreserveReturnContext
                    ? `${returnTarget.label}へ戻る`
                    : "一覧に戻る"}
                </Link>
              </div>
            </div>
          }
        />

        <PurchaseDecisionSummaryCard candidate={candidate} />

        <PurchaseCandidateGroupNavigation
          candidates={candidate.group_candidates ?? []}
          detailQueryString={detailQueryString}
        />

        <PurchaseCandidateShoppingMemoAdd
          candidateId={candidate.id}
          candidateStatus={candidate.status}
        />

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
                      key={`${detail.label}-${detail.value}`}
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
            利用条件・特性
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-700">季節</p>
              <p className="mt-2 text-sm text-gray-600">
                {candidate.seasons.length === 0
                  ? "未設定"
                  : candidate.seasons.join(" / ")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">TPO</p>
              <p className="mt-2 text-sm text-gray-600">
                {candidate.tpos.length === 0
                  ? "未設定"
                  : candidate.tpos.join(" / ")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">雨対応</p>
              <p className="mt-2 text-sm text-gray-600">
                {candidate.is_rain_ok ? "対応" : "未対応"}
              </p>
            </div>
            {candidate.sheerness ? (
              <div>
                <p className="text-sm font-medium text-gray-700">透け感</p>
                <p className="mt-2 text-sm text-gray-600">
                  {ITEM_SHEERNESS_LABELS[candidate.sheerness]}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">サイズ・実寸</h2>
          <PurchaseCandidateSizeDetails
            sizeGender={candidate.size_gender}
            sizeOptions={sizeOptions}
            resolvedCategory={resolvedItemCategory?.category}
            resolvedShape={resolvedItemCategory?.shape}
          />
        </section>
        <PurchaseCandidateSizeComparison
          candidate={candidate}
          resolvedCategory={resolvedItemCategory?.category}
          resolvedSubcategory={resolvedItemCategory?.subcategory}
          resolvedShape={resolvedItemCategory?.shape}
          items={comparableItems}
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">素材・混率</h2>
          {materialGroups.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">未登録</p>
          ) : (
            <div className="mt-4 space-y-1">
              {materialGroups.map((group) => (
                <p key={group.partLabel} className="text-sm text-gray-600">
                  {group.partLabel}: {group.labels.join("、")}
                </p>
              ))}
            </div>
          )}
        </section>

        {showSupplementSection ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">補足情報</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              {candidate.wanted_reason ? (
                <div>
                  <dt className="text-sm font-medium text-gray-700">
                    欲しい理由
                  </dt>
                  <dd className="mt-1 text-sm text-gray-600">
                    {candidate.wanted_reason}
                  </dd>
                </div>
              ) : null}
              {candidate.memo ? (
                <div>
                  <dt className="text-sm font-medium text-gray-700">メモ</dt>
                  <dd className="mt-1 text-sm text-gray-600">
                    {candidate.memo}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {showImageSection ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">画像一覧</h2>

            <PurchaseCandidateDetailImages
              images={candidate.images}
              candidateName={candidate.name}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}
