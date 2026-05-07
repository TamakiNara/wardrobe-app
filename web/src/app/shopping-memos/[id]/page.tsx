import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IndexPageHeader } from "@/components/shared/index-page-header";
import { buildPageMetadata } from "@/lib/metadata";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type {
  ShoppingMemoDetail,
  ShoppingMemoDetailResponse,
  ShoppingMemoGroup,
  ShoppingMemoGroupItem,
  ShoppingMemoGroupType,
  ShoppingMemoStatus,
} from "@/types/shopping-memos";

const MEMO_STATUS_LABELS: Record<ShoppingMemoStatus, string> = {
  draft: "検討中",
  closed: "終了",
};

const GROUP_TYPE_LABELS: Record<ShoppingMemoGroupType, string> = {
  domain: "サイト",
  brand: "ブランド",
  uncategorized: "未分類",
};

const ITEM_STATUS_LABELS: Record<string, string> = {
  considering: "検討中",
  on_hold: "保留",
  purchased: "購入済み",
  dropped: "見送り",
};

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

async function getShoppingMemoDetail(
  memoId: string,
): Promise<ShoppingMemoDetail | null> {
  const response = await fetchLaravelWithCookie(
    `/api/shopping-memos/${memoId}`,
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Partial<ShoppingMemoDetailResponse>;

  return data.shoppingMemo ?? null;
}

function renderMemoStatusBadge(status: ShoppingMemoStatus) {
  const isClosed = status === "closed";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        isClosed
          ? "bg-gray-100 text-gray-600"
          : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      }`}
    >
      {MEMO_STATUS_LABELS[status]}
    </span>
  );
}

function renderItemStatusBadge(status: ShoppingMemoGroupItem["status"]) {
  const isInactive = status === "purchased" || status === "dropped";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        isInactive
          ? "bg-gray-100 text-gray-600"
          : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      }`}
    >
      {ITEM_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function renderSummaryCard(memo: ShoppingMemoDetail) {
  const nearestDeadline = formatDateTime(memo.nearest_deadline);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-500">候補</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {memo.item_count}件
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-500">グループ</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {memo.group_count}件
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-500">小計</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {formatPrice(memo.subtotal)}
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-500">価格未設定</p>
        <p className="mt-2 text-sm font-medium text-gray-900">
          {memo.has_price_unset ? "価格未設定あり" : "なし"}
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-500">最短期限</p>
        <p className="mt-2 text-sm font-medium text-gray-900">
          {nearestDeadline ?? "未設定"}
        </p>
      </div>
    </section>
  );
}

function renderGroupItem(item: ShoppingMemoGroupItem) {
  const saleEndsAt = formatDateTime(item.sale_ends_at);
  const discountEndsAt = formatDateTime(item.discount_ends_at);
  const hasSalePrice = item.sale_price !== null;

  return (
    <article
      key={item.shopping_memo_item_id}
      className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/purchase-candidates/${item.purchase_candidate_id}`}
              className="text-base font-semibold text-gray-900 hover:underline"
            >
              {item.name}
            </Link>
            {renderItemStatusBadge(item.status)}
            {!item.is_total_included ? (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                合計対象外
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {item.brand ? <span>ブランド: {item.brand}</span> : null}
            <span>数量: {item.quantity}</span>
            {item.priority ? <span>優先度: {item.priority}</span> : null}
          </div>
          {item.memo ? (
            <p className="text-sm leading-6 text-gray-600">{item.memo}</p>
          ) : null}
        </div>

        <div className="text-right text-sm text-gray-600">
          {item.unit_price !== null ? (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {formatPrice(item.unit_price)}
              </p>
              {hasSalePrice && item.price !== null ? (
                <p className="text-xs text-gray-500 line-through">
                  {formatPrice(item.price)}
                </p>
              ) : null}
              <p>
                行小計:{" "}
                {item.line_total !== null
                  ? formatPrice(item.line_total)
                  : "合計対象外"}
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-amber-700">価格未設定</p>
          )}
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
        {saleEndsAt ? (
          <div>
            <dt className="font-medium text-gray-700">セール終了日</dt>
            <dd>{saleEndsAt}</dd>
          </div>
        ) : null}
        {discountEndsAt ? (
          <div>
            <dt className="font-medium text-gray-700">割引終了日</dt>
            <dd>{discountEndsAt}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

function renderGroup(group: ShoppingMemoGroup) {
  const nearestDeadline = formatDateTime(group.nearest_deadline);

  return (
    <section
      key={`${group.type}-${group.key}`}
      className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {group.display_name}
            </h2>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {GROUP_TYPE_LABELS[group.type]}
            </span>
            {group.has_price_unset ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                価格未設定あり
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <span>小計: {formatPrice(group.subtotal)}</span>
            {nearestDeadline ? <span>最短期限: {nearestDeadline}</span> : null}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">{group.items.map(renderGroupItem)}</div>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const memo = await getShoppingMemoDetail(id);

  if (!memo) {
    return buildPageMetadata("買い物メモ詳細");
  }

  return buildPageMetadata(`${memo.name} | 買い物メモ`);
}

export default async function ShoppingMemoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const memo = await getShoppingMemoDetail(id);

  if (!memo) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <IndexPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "買い物メモ一覧", href: "/shopping-memos" },
            { label: memo.name },
          ]}
          eyebrow="買い物メモ"
          title={memo.name}
          description={
            <div className="space-y-3">
              <div>{renderMemoStatusBadge(memo.status)}</div>
              {memo.memo ? <p>{memo.memo}</p> : null}
            </div>
          }
          actions={
            <Link
              href="/shopping-memos"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              一覧へ戻る
            </Link>
          }
        />

        {renderSummaryCard(memo)}

        {memo.groups.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              この買い物メモには、まだ購入候補がありません。
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              購入検討一覧から候補を追加できます。
            </p>
            <div className="mt-5">
              <Link
                href="/purchase-candidates"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                購入検討一覧を見る
              </Link>
            </div>
          </section>
        ) : (
          <div className="space-y-5">{memo.groups.map(renderGroup)}</div>
        )}
      </div>
    </main>
  );
}
