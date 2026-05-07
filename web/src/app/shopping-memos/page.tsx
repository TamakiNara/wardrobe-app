import Link from "next/link";
import { redirect } from "next/navigation";
import { IndexPageHeader } from "@/components/shared/index-page-header";
import { buildPageMetadata } from "@/lib/metadata";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type {
  ShoppingMemoListItem,
  ShoppingMemosListResponse,
  ShoppingMemoStatus,
} from "@/types/shopping-memos";

export const metadata = buildPageMetadata("買い物メモ一覧");

type ShoppingMemosPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

const STATUS_LABELS: Record<ShoppingMemoStatus, string> = {
  draft: "検討中",
  closed: "終了",
};

function readSearchParam(
  searchParams: ShoppingMemosPageSearchParams,
  key: string,
): string {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatPrice(value: number): string {
  return `${value.toLocaleString("ja-JP")}円`;
}

function formatDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function getShoppingMemos(): Promise<ShoppingMemoListItem[]> {
  const response = await fetchLaravelWithCookie("/api/shopping-memos");

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as Partial<ShoppingMemosListResponse>;

  return data.shoppingMemos ?? [];
}

function renderStatusBadge(status: ShoppingMemoStatus) {
  const isClosed = status === "closed";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        isClosed
          ? "bg-gray-100 text-gray-600"
          : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      }`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default async function ShoppingMemosPage({
  searchParams,
}: {
  searchParams: Promise<ShoppingMemosPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const shoppingMemos = await getShoppingMemos();
  const flashMessage =
    readSearchParam(resolvedSearchParams, "message") === "created"
      ? "買い物メモを作成しました。"
      : null;

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <IndexPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "買い物メモ一覧" },
          ]}
          eyebrow="買い物メモ"
          title="買い物メモ一覧"
          description="購入を迷っている候補をまとめて比較するためのメモです。ショップやブランドごとの候補を見比べながら、今買うかどうかを整理できます。"
          actions={
            <Link
              href="/shopping-memos/new"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              買い物メモを作成
            </Link>
          }
        />

        {flashMessage ? (
          <section className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 shadow-sm">
            {flashMessage}
          </section>
        ) : null}

        {shoppingMemos.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              買い物メモはまだありません。
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              購入を迷っている候補をまとめて比較できます。
            </p>
            <div className="mt-5">
              <Link
                href="/shopping-memos/new"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                買い物メモを作成
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {shoppingMemos.map((memo) => {
              const nearestDeadline = formatDateTime(memo.nearest_deadline);
              const updatedAt = formatDateTime(memo.updated_at);

              return (
                <article
                  key={memo.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        <Link
                          href={`/shopping-memos/${memo.id}`}
                          className="hover:underline"
                        >
                          {memo.name}
                        </Link>
                      </h2>
                      {memo.memo ? (
                        <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                          {memo.memo}
                        </p>
                      ) : null}
                    </div>
                    {renderStatusBadge(memo.status)}
                  </div>

                  <dl className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <dt className="font-medium text-gray-700">件数</dt>
                      <dd>
                        {memo.item_count}件 / {memo.group_count}グループ
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <dt className="font-medium text-gray-700">小計</dt>
                      <dd>{formatPrice(memo.subtotal)}</dd>
                    </div>
                    {memo.has_price_unset ? (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <dt className="font-medium text-gray-700">補足</dt>
                        <dd>
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                            価格未設定あり
                          </span>
                        </dd>
                      </div>
                    ) : null}
                    {nearestDeadline ? (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <dt className="font-medium text-gray-700">最短期限</dt>
                        <dd>{nearestDeadline}</dd>
                      </div>
                    ) : null}
                    {updatedAt ? (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <dt className="font-medium text-gray-700">更新日時</dt>
                        <dd>{updatedAt}</dd>
                      </div>
                    ) : null}
                  </dl>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
