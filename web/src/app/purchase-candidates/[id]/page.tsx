import Link from "next/link";
import { redirect } from "next/navigation";
import PurchaseCandidateColorVariantAction from "@/components/purchase-candidates/purchase-candidate-color-variant-action";
import PurchaseCandidateDetailImages from "@/components/purchase-candidates/purchase-candidate-detail-images";
import PurchaseCandidateDuplicateAction from "@/components/purchase-candidates/purchase-candidate-duplicate-action";
import PurchaseCandidateItemDraftAction from "@/components/purchase-candidates/purchase-candidate-item-draft-action";
import { EntityDetailHeader } from "@/components/shared/entity-detail-header";
import { resolvePurchaseCandidateItemClassification } from "@/lib/items/classification";
import { groupItemMaterialsForDisplay } from "@/lib/items/materials";
import {
  findBottomsLengthLabel,
  findLegwearCoverageLabel,
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
import {
  formatSizeDetailValue,
  getStructuredSizeFieldDefinitions,
  normalizeItemSizeDetails,
} from "@/lib/items/size-details";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type {
  PurchaseCandidateColor,
  PurchaseCandidateDetailResponse,
  PurchaseCandidateGroupCandidate,
  PurchaseCandidateStatus,
} from "@/types/purchase-candidates";

function formatPrice(price: number | null): string {
  if (price === null) {
    return "未設定";
  }

  return `${price.toLocaleString("ja-JP")}円`;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "未設定";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

function formatDetailColorLabel(color: PurchaseCandidateColor): string {
  const customLabel = color.role === "main" ? color.custom_label?.trim() : "";

  return customLabel || color.label;
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
}: {
  candidates: PurchaseCandidateGroupCandidate[];
}) {
  if (candidates.length <= 1) {
    return null;
  }

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
              href={`/purchase-candidates/${groupCandidate.id}`}
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

async function getPurchaseCandidate(id: string) {
  const response = await fetchLaravelWithCookie(
    `/api/purchase-candidates/${id}`,
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    redirect("/purchase-candidates");
  }

  const data = (await response.json()) as PurchaseCandidateDetailResponse;
  return data.purchaseCandidate;
}

export default async function PurchaseCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getPurchaseCandidate(id);
  const resolvedItemCategory = resolvePurchaseCandidateItemClassification(
    candidate.category_id,
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
      label: "レッグウェア",
      value: findLegwearCoverageLabel(candidate.spec?.legwear?.coverage_type),
    },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value),
  );
  const normalizedSizeDetails = normalizeItemSizeDetails(
    candidate.size_details,
  );
  const structuredSizeFieldDefinitions = getStructuredSizeFieldDefinitions(
    resolvedItemCategory?.category,
    resolvedItemCategory?.shape,
  );
  const visibleStructuredSizeFields = structuredSizeFieldDefinitions.filter(
    (field) => normalizedSizeDetails?.structured?.[field.name] !== undefined,
  );
  const visibleCustomSizeFields = normalizedSizeDetails?.custom_fields ?? [];
  const materialGroups = groupItemMaterialsForDisplay(candidate.materials);

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <EntityDetailHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "購入検討一覧", href: "/purchase-candidates" },
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
                  />
                )}
                <Link
                  href={`/purchase-candidates/${candidate.id}/edit`}
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
              <div className="flex justify-end">
                <Link
                  href="/purchase-candidates"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
                >
                  一覧に戻る
                </Link>
              </div>
            </div>
          }
        />

        <PurchaseCandidateGroupNavigation
          candidates={candidate.group_candidates ?? []}
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-700">名前</dt>
              <dd className="mt-1 text-sm text-gray-600">{candidate.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">ブランド</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {candidate.brand_name ?? "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">優先度</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {PURCHASE_CANDIDATE_PRIORITY_LABELS[candidate.priority]}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">
                アイテム化状況
              </dt>
              <dd className="mt-1 text-sm text-gray-600">
                {candidate.converted_item_id !== null
                  ? "アイテム化済み"
                  : "未実施"}
              </dd>
            </div>
          </dl>
        </section>

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
          <h2 className="text-lg font-semibold text-gray-900">購入情報</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-700">想定価格</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {formatPrice(candidate.price)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">セール価格</dt>
              <dd
                className={`mt-1 text-sm ${candidate.sale_price !== null ? "text-rose-700" : "text-gray-600"}`}
              >
                {formatPrice(candidate.sale_price)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">
                セール終了予定
              </dt>
              <dd className="mt-1 text-sm text-gray-600">
                {formatDateTime(candidate.sale_ends_at)}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-700">購入 URL</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {candidate.purchase_url ? (
                  <a
                    href={candidate.purchase_url}
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
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            色 / 利用条件・状態
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-700">色</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {candidate.colors.length === 0 ? (
                  <li>未設定</li>
                ) : (
                  candidate.colors.map((color) => (
                    <li key={`${color.role}-${color.value}`}>
                      {PURCHASE_CANDIDATE_COLOR_ROLE_LABELS[color.role]}:{" "}
                      {formatDetailColorLabel(color)}
                    </li>
                  ))
                )}
              </ul>
            </div>
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
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">サイズ・実寸</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-700">サイズ区分</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {candidate.size_gender
                  ? (PURCHASE_CANDIDATE_SIZE_GENDER_LABELS[
                      candidate.size_gender
                    ] ?? "未設定")
                  : "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">サイズ表記</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {candidate.size_label ?? "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">
                サイズ感メモ
              </dt>
              <dd className="mt-1 text-sm text-gray-600">
                {candidate.size_note ?? "未設定"}
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
          </dl>
        </section>

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

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">補足情報</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-700">欲しい理由</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {candidate.wanted_reason ?? "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">メモ</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {candidate.memo ?? "未設定"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">画像</h2>

          <PurchaseCandidateDetailImages
            images={candidate.images}
            candidateName={candidate.name}
          />
        </section>
      </div>
    </main>
  );
}
