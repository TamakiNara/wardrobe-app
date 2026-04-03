import Link from "next/link";
import { redirect } from "next/navigation";
import { IndexPageHeader } from "@/components/shared/index-page-header";
import {
  PURCHASE_CANDIDATE_PRIORITY_LABELS,
  PURCHASE_CANDIDATE_STATUS_LABELS,
} from "@/lib/purchase-candidates/labels";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type { PurchaseCandidatesResponse } from "@/types/purchase-candidates";

type PurchaseCandidatesPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

function buildQueryString(
  searchParams: PurchaseCandidatesPageSearchParams,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "message") {
      continue;
    }

    if (Array.isArray(value)) {
      const firstValue = value[0];
      if (firstValue) {
        params.set(key, firstValue);
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  return params.toString();
}

function buildPageHref(
  searchParams: PurchaseCandidatesPageSearchParams,
  page: number,
): string {
  const query = buildQueryString({
    ...searchParams,
    page: page <= 1 ? undefined : String(page),
  });

  return query ? `/purchase-candidates?${query}` : "/purchase-candidates";
}

async function getPurchaseCandidates(
  searchParams: PurchaseCandidatesPageSearchParams,
): Promise<PurchaseCandidatesResponse> {
  const query = buildQueryString(searchParams);
  const endpoint = query
    ? `/api/purchase-candidates?${query}`
    : "/api/purchase-candidates";
  const response = await fetchLaravelWithCookie(endpoint);

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return {
      purchaseCandidates: [],
      meta: {
        total: 0,
        totalAll: 0,
        page: 1,
        lastPage: 1,
      },
    };
  }

  const data = (await response.json()) as Partial<PurchaseCandidatesResponse>;

  return {
    purchaseCandidates: data.purchaseCandidates ?? [],
    meta: {
      total: data.meta?.total ?? 0,
      totalAll: data.meta?.totalAll ?? 0,
      page: data.meta?.page ?? 1,
      lastPage: data.meta?.lastPage ?? 1,
    },
  };
}

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

export default async function PurchaseCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<PurchaseCandidatesPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const data = await getPurchaseCandidates(resolvedSearchParams);
  const flashMessage =
    resolvedSearchParams.message === "deleted"
      ? "購入検討を削除しました。"
      : null;
  const currentPage = data.meta.page;
  const lastPage = data.meta.lastPage;

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <IndexPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "購入検討一覧" },
          ]}
          eyebrow="購入検討管理"
          title="購入検討一覧"
          description="検討中・保留中・購入済み・見送りの候補をまとめて確認します。"
          actions={
            <Link
              href="/purchase-candidates/new"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              購入検討を追加
            </Link>
          }
        />

        {flashMessage && (
          <section className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 shadow-sm">
            {flashMessage}
          </section>
        )}

        {data.meta.totalAll === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              購入検討がまだありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              気になるアイテムを候補として登録して比較や item
              化の準備を進めましょう。
            </p>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">
                表示件数: {data.purchaseCandidates.length} / {data.meta.total}
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.purchaseCandidates.map((candidate) => (
                <article
                  key={candidate.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <Link
                    href={`/purchase-candidates/${candidate.id}`}
                    className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                  >
                    <div className="flex aspect-[4/3] items-center justify-center bg-gray-50 p-3 transition hover:bg-gray-100">
                      {candidate.primary_image?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={candidate.primary_image.url}
                          alt={candidate.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm text-gray-400">
                          画像なし
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {PURCHASE_CANDIDATE_STATUS_LABELS[candidate.status]}
                      </span>
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                        優先度:{" "}
                        {PURCHASE_CANDIDATE_PRIORITY_LABELS[candidate.priority]}
                      </span>
                      {candidate.converted_item_id !== null && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          アイテム化済み
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/purchase-candidates/${candidate.id}`}
                      className="block rounded-lg outline-none transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <h2 className="text-lg font-semibold text-gray-900">
                        {candidate.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {candidate.category_name ?? candidate.category_id}
                      </p>
                    </Link>

                    <dl className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between gap-3">
                        <dt>想定価格</dt>
                        <dd>{formatPrice(candidate.price)}</dd>
                      </div>
                      {(candidate.sale_price !== null ||
                        candidate.sale_ends_at !== null) && (
                        <>
                          {candidate.sale_price !== null && (
                            <div className="flex items-center justify-between gap-3 text-rose-700">
                              <dt>セール価格</dt>
                              <dd>{formatPrice(candidate.sale_price)}</dd>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-3">
                            <dt>終了予定</dt>
                            <dd>{formatDateTime(candidate.sale_ends_at)}</dd>
                          </div>
                        </>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <dt>更新日</dt>
                        <dd>
                          {candidate.updated_at?.slice(0, 10) ?? "未設定"}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/purchase-candidates/${candidate.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        詳細を見る
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              {currentPage > 1 ? (
                <Link
                  href={buildPageHref(resolvedSearchParams, currentPage - 1)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  前へ
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-400">
                  前へ
                </span>
              )}

              <p className="text-sm text-gray-600">
                {currentPage} / {lastPage}ページ
                <span className="ml-2 text-gray-400">
                  （全{data.meta.total}件）
                </span>
              </p>

              {currentPage < lastPage ? (
                <Link
                  href={buildPageHref(resolvedSearchParams, currentPage + 1)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  次へ
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-400">
                  次へ
                </span>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
