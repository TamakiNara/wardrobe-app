import Link from "next/link";
import { redirect } from "next/navigation";
import PurchaseCandidateDuplicateAction from "@/components/purchase-candidates/purchase-candidate-duplicate-action";
import PurchaseCandidateItemDraftAction from "@/components/purchase-candidates/purchase-candidate-item-draft-action";
import { EntityDetailHeader } from "@/components/shared/entity-detail-header";
import { groupItemMaterialsForDisplay } from "@/lib/items/materials";
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
import { resolvePurchaseCandidateItemCategory } from "@/lib/purchase-candidates/category-map";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type { PurchaseCandidateDetailResponse } from "@/types/purchase-candidates";

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
  const resolvedItemCategory = resolvePurchaseCandidateItemCategory(
    candidate.category_id,
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {PURCHASE_CANDIDATE_STATUS_LABELS[candidate.status]}
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700">
                優先度: {PURCHASE_CANDIDATE_PRIORITY_LABELS[candidate.priority]}
              </span>
              {candidate.converted_item_id !== null && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  アイテム化済み
                </span>
              )}
            </div>
          }
          actions={
            <>
              <Link
                href="/purchase-candidates"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                一覧へ戻る
              </Link>
              <PurchaseCandidateDuplicateAction
                candidateId={candidate.id}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
              />
              <Link
                href={`/purchase-candidates/${candidate.id}/edit`}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                編集する
              </Link>
            </>
          }
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">アイテム追加</h2>
          {candidate.status === "purchased" ? (
            <>
              <p className="mt-2 text-sm text-gray-600">
                この購入検討はアイテム化済みの履歴です。購入検討側の更新はアイテムへ反映されません。
              </p>
              <p className="mt-3 text-sm text-emerald-700">
                新しく検討を続ける場合は「複製する」を使ってください。
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-600">
                現在の候補内容からアイテム作成画面の初期値を生成します。
              </p>
              <div className="mt-4">
                <PurchaseCandidateItemDraftAction
                  candidateId={candidate.id}
                  convertedItemId={candidate.converted_item_id}
                />
              </div>
              {candidate.converted_item_id !== null && (
                <p className="mt-3 text-sm text-emerald-700">
                  この候補はアイテム化済みです。必要なら初期値を再生成できます。
                </p>
              )}
            </>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-700">カテゴリ</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {candidate.category_name ?? candidate.category_id}
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
          <h2 className="text-lg font-semibold text-gray-900">購入情報</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-700">ブランド</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {candidate.brand_name ?? "未設定"}
              </dd>
            </div>
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
            色 / 季節 / TPO
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-700">色</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {candidate.colors.length === 0 ? (
                  <li>未設定</li>
                ) : (
                  candidate.colors.map((color) => (
                    <li key={`${color.role}-${color.value}`}>
                      {PURCHASE_CANDIDATE_COLOR_ROLE_LABELS[color.role]}:{" "}
                      {color.label}
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
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">サイズ・属性</h2>
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
              <dt className="text-sm font-medium text-gray-700">雨対応</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {candidate.is_rain_ok ? "対応" : "未対応"}
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
          <h2 className="text-lg font-semibold text-gray-900">メモ</h2>
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

          {candidate.images.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">画像はまだありません。</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {candidate.images.map((image) => (
                <article
                  key={image.id}
                  className="overflow-hidden rounded-xl border border-gray-200"
                >
                  {image.url ? (
                    <div className="flex aspect-[3/4] items-center justify-center bg-gray-50 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.original_filename ?? candidate.name}
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
          )}
        </section>
      </div>
    </main>
  );
}
