import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SafeImage from "@/components/images/safe-image";
import { IndexPageHeader } from "@/components/shared/index-page-header";
import { PurchaseUrlLink } from "@/components/shared/purchase-url-link";
import { buildPageMetadata } from "@/lib/metadata";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type {
  PurchaseCandidateDetailResponse,
  PurchaseCandidateImageRecord,
} from "@/types/purchase-candidates";
import type {
  ShoppingMemoDetail,
  ShoppingMemoDetailResponse,
  ShoppingMemoGroup,
  ShoppingMemoGroupItem,
  ShoppingMemoStatus,
} from "@/types/shopping-memos";

const MEMO_STATUS_LABELS: Record<ShoppingMemoStatus, string> = {
  draft: "検討中",
  closed: "終了",
};

const ITEM_STATUS_LABELS: Record<string, string> = {
  considering: "検討中",
  on_hold: "保留",
  purchased: "購入済み",
  dropped: "見送り",
};

type DeadlineState = "expired" | "soon" | null;

type ShoppingMemoItemImageMap = Record<number, string | null>;

function formatPrice(value: number): string {
  return `${value.toLocaleString("ja-JP")}円`;
}

function formatPriceNumber(value: number): string {
  return value.toLocaleString("ja-JP");
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

function resolveNearestItemDeadline(
  item: ShoppingMemoGroupItem,
): string | null {
  const candidates = [item.sale_ends_at, item.discount_ends_at]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  return candidates[0]?.toISOString() ?? null;
}

function resolveDeadlineState(value: string | null): DeadlineState {
  if (!value) {
    return null;
  }

  const deadline = new Date(value);

  if (Number.isNaN(deadline.getTime())) {
    return null;
  }

  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff < 0) {
    return "expired";
  }

  if (diff <= 1000 * 60 * 60 * 24 * 3) {
    return "soon";
  }

  return null;
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

function resolvePrimaryImage(
  images: PurchaseCandidateImageRecord[] | undefined,
): string | null {
  if (!images || images.length === 0) {
    return null;
  }

  const primary =
    images.find((image) => image.is_primary && image.url) ??
    images.find((image) => image.url);

  return primary?.url ?? null;
}

async function getShoppingMemoItemImages(
  memo: ShoppingMemoDetail,
): Promise<ShoppingMemoItemImageMap> {
  const uniqueIds = Array.from(
    new Set(
      memo.groups.flatMap((group) =>
        group.items.map((item) => item.purchase_candidate_id),
      ),
    ),
  );

  const responses = await Promise.all(
    uniqueIds.map(async (candidateId) => {
      const response = await fetchLaravelWithCookie(
        `/api/purchase-candidates/${candidateId}`,
      );

      if (!response.ok) {
        return [candidateId, null] as const;
      }

      const data =
        (await response.json()) as Partial<PurchaseCandidateDetailResponse>;
      const imageUrl = resolvePrimaryImage(data.purchaseCandidate?.images);

      return [candidateId, imageUrl] as const;
    }),
  );

  return Object.fromEntries(responses);
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

function renderDeadlineBadge(deadline: string | null) {
  const state = resolveDeadlineState(deadline);

  if (state === "expired") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
        期限切れ
      </span>
    );
  }

  if (state === "soon") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
        期限間近
      </span>
    );
  }

  return null;
}

function renderSummaryCard(memo: ShoppingMemoDetail) {
  const nearestDeadline = formatDateTime(memo.nearest_deadline);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3 text-sm text-gray-600">
        <p>
          <span className="font-medium text-gray-900">{memo.item_count}件</span>{" "}
          の候補
        </p>
        <p>
          <span className="font-medium text-gray-900">
            {memo.group_count}件
          </span>{" "}
          のグループ
        </p>
        <p>
          小計{" "}
          <span className="text-base font-semibold text-gray-900">
            {formatPrice(memo.subtotal)}
          </span>
        </p>
        {nearestDeadline ? (
          <p>
            一番近い期限{" "}
            <span className="font-medium text-gray-900">{nearestDeadline}</span>
          </p>
        ) : null}
        <p>{memo.has_price_unset ? "価格未設定あり" : "価格未設定なし"}</p>
      </div>
    </section>
  );
}

function renderImageFallback(item: ShoppingMemoGroupItem) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50 px-2 text-center">
      <p className="text-xs font-medium text-gray-500">画像未設定</p>
      <p className="mt-1 line-clamp-2 text-[11px] text-gray-400">
        {item.brand ?? item.name}
      </p>
    </div>
  );
}

function renderGroupItem(item: ShoppingMemoGroupItem, imageUrl: string | null) {
  const nearestDeadline = resolveNearestItemDeadline(item);
  const nearestDeadlineLabel = formatDateTime(nearestDeadline);
  const hasSalePrice = item.sale_price !== null;
  const shouldShowLineTotal =
    item.quantity > 1 && item.line_total !== null && item.is_total_included;
  const metadata = [
    item.brand,
    item.quantity > 1 ? `数量 ${item.quantity}` : null,
    item.priority ? `優先度 ${item.priority}` : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <article
      key={item.shopping_memo_item_id}
      className="border-b border-gray-200/80 pb-4 last:border-b-0 last:pb-0"
    >
      <div className="grid gap-4 md:grid-cols-[6.5rem_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl bg-gray-100">
          <div className="aspect-square bg-gray-50 p-1">
            <SafeImage
              src={imageUrl}
              alt={item.name}
              className="h-full w-full object-contain"
              fallback={renderImageFallback(item)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
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
                {item.unit_price === null ? (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                    価格未設定
                  </span>
                ) : null}
                {renderDeadlineBadge(nearestDeadline)}
              </div>
              {metadata.length > 0 ? (
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
                  {metadata.map((value) => (
                    <span key={value}>{value}</span>
                  ))}
                </p>
              ) : null}
            </div>

            <div className="min-w-[8rem] text-right">
              {item.unit_price !== null ? (
                <div className="space-y-1.5">
                  {hasSalePrice ? (
                    <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                      セール中
                    </span>
                  ) : null}
                  <div className="flex items-end justify-end gap-1">
                    <span
                      className={`text-lg font-semibold leading-none ${
                        hasSalePrice ? "text-rose-700" : "text-gray-900"
                      }`}
                    >
                      {formatPriceNumber(item.unit_price)}
                    </span>
                    <span
                      className={`text-xs leading-5 ${
                        hasSalePrice ? "text-rose-700" : "text-gray-500"
                      }`}
                    >
                      円
                    </span>
                  </div>
                  {hasSalePrice && item.price !== null ? (
                    <p className="text-xs text-gray-500 line-through">
                      通常価格 {formatPrice(item.price)}
                    </p>
                  ) : null}
                  {shouldShowLineTotal ? (
                    <p className="text-xs text-gray-600">
                      小計 {formatPrice(item.line_total)}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-700">
                    価格未設定
                  </p>
                </div>
              )}
            </div>
          </div>

          {nearestDeadlineLabel ? (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">期限:</span>{" "}
              {nearestDeadlineLabel}
            </p>
          ) : null}

          {item.memo ? (
            <p className="rounded-xl bg-white px-3 py-2 text-sm leading-6 text-gray-600 ring-1 ring-gray-200">
              {item.memo}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {item.purchase_url ? (
              <PurchaseUrlLink
                url={item.purchase_url}
                variant="list"
                className="mr-auto"
              />
            ) : (
              <span className="text-xs text-gray-400">商品ページ未設定</span>
            )}
            <Link
              href={`/purchase-candidates/${item.purchase_candidate_id}`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              購入検討詳細を見る
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function renderGroup(
  group: ShoppingMemoGroup,
  itemImages: ShoppingMemoItemImageMap,
) {
  const shouldShowGroupSubtotal = group.items.length > 1;

  return (
    <section
      key={`${group.type}-${group.key}`}
      className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {group.display_name}
          </h2>
          {group.has_price_unset ? (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
              価格未設定あり
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {group.items.map((item) =>
          renderGroupItem(item, itemImages[item.purchase_candidate_id] ?? null),
        )}
      </div>

      {shouldShowGroupSubtotal ? (
        <div className="mt-4 flex justify-end">
          <p className="text-sm font-medium text-gray-700">
            小計{" "}
            <span className="text-base font-semibold text-gray-900">
              {formatPrice(group.subtotal)}
            </span>
          </p>
        </div>
      ) : null}
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

  const itemImages = await getShoppingMemoItemImages(memo);

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6 pb-4">
        <IndexPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "購入検討一覧", href: "/purchase-candidates" },
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
          <div className="space-y-5">
            {memo.groups.map((group) => renderGroup(group, itemImages))}
          </div>
        )}
      </div>
    </main>
  );
}
