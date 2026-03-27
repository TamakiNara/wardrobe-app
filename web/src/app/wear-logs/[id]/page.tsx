import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteWearLogButton from "@/components/wear-logs/delete-wear-log-button";
import WearLogStatusAction from "@/components/wear-logs/wear-log-status-action";
import { ITEM_CARE_STATUS_LABELS } from "@/lib/items/metadata";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import { getWearLogStatusLabel } from "@/lib/wear-logs/labels";
import type { WearLogRecord } from "@/types/wear-logs";

function getWearLogStatusBadgeClass(status: WearLogRecord["status"]): string {
  return status === "worn"
    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
    : "border-blue-300 bg-blue-50 text-blue-700";
}

function getItemSourceTypeLabel(itemSourceType: "outfit" | "manual"): string {
  return itemSourceType === "outfit" ? "元コーディネート" : "手動追加";
}

function getTodayYmd(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

async function getWearLog(id: string): Promise<WearLogRecord> {
  const response = await fetchLaravelWithCookie(`/api/wear-logs/${id}`);

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    redirect("/wear-logs");
  }

  const data = await response.json();
  return data.wearLog as WearLogRecord;
}

export default async function WearLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wearLog = await getWearLog(id);
  const today = getTodayYmd();
  const isPastPlanned = wearLog.status === "planned" && wearLog.event_date < today;
  const disposedItems = wearLog.items.filter((item) => item.source_item_status === "disposed");
  const cleaningItems = wearLog.items.filter((item) => item.source_item_care_status === "in_cleaning");

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <Link href="/wear-logs" className="hover:underline">
            着用履歴一覧
          </Link>
          {" / "}
          <span className="text-gray-700">詳細</span>
        </nav>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-gray-500">着用履歴管理</p>
            <h1 className="text-2xl font-bold text-gray-900">着用履歴詳細</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-sm font-medium ${getWearLogStatusBadgeClass(wearLog.status)}`}
              >
                {getWearLogStatusLabel(wearLog.status)}
              </span>
              <span className="text-sm text-gray-500">
                {wearLog.event_date} / {wearLog.display_order}件目
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <Link
              href="/wear-logs"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              一覧へ戻る
            </Link>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">操作</h2>
          <p className="mt-2 text-sm text-gray-600">
            状態変更はこの画面で行い、日付・表示順・元のコーディネート・アイテム構成の変更は編集画面で行います。
          </p>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <WearLogStatusAction wearLog={wearLog} />

            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <Link
                href={`/wear-logs/${wearLog.id}/edit`}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                編集する
              </Link>
              <DeleteWearLogButton wearLogId={String(wearLog.id)} />
            </div>
          </div>
        </section>

        {(wearLog.source_outfit_status === "invalid" ||
          disposedItems.length > 0 ||
          cleaningItems.length > 0 ||
          isPastPlanned) && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">確認事項</h2>
            <div className="mt-4 space-y-3">
              {wearLog.source_outfit_status === "invalid" && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  元のコーディネートは現在候補外ですが、既存の記録として保持しています。
                </p>
              )}

              {disposedItems.length > 0 && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  手放し済みのアイテムが含まれています。履歴確認はできますが、候補としては現在使えません。
                </p>
              )}

              {cleaningItems.length > 0 && (
                <div
                  className={`rounded-xl border px-4 py-3 ${
                    wearLog.status === "worn"
                      ? "border-amber-300 bg-amber-50"
                      : "border-sky-200 bg-sky-50"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      wearLog.status === "worn" ? "text-amber-900" : "text-sky-900"
                    }`}
                  >
                    {wearLog.status === "worn"
                      ? "クリーニング中のアイテムが含まれています。着用済みとして登録する前に内容を確認してください。"
                      : "クリーニング中のアイテムが含まれています。予定として保存はできますが、必要なら先に状態を確認してください。"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cleaningItems.map((item) =>
                      item.source_item_id !== null ? (
                        <Link
                          key={`detail-cleaning-${item.id}`}
                          href={`/items/${item.source_item_id}`}
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            wearLog.status === "worn"
                              ? "border-amber-300 bg-white text-amber-900"
                              : "border-sky-300 bg-white text-sky-800"
                          }`}
                        >
                          {(item.item_name ?? "名称未設定")}を確認
                        </Link>
                      ) : null,
                    )}
                  </div>
                </div>
              )}

              {isPastPlanned && (
                <p className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-700">
                  この記録は過去の未完了予定です。必要に応じて内容確認後に着用済みへ変更できます。
                </p>
              )}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>

          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-700">状態</dt>
              <dd className="mt-1 text-sm text-gray-600">{getWearLogStatusLabel(wearLog.status)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">日付</dt>
              <dd className="mt-1 text-sm text-gray-600">{wearLog.event_date}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">表示順</dt>
              <dd className="mt-1 text-sm text-gray-600">{wearLog.display_order}件目</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">メモ</dt>
              <dd className="mt-1 text-sm text-gray-600">{wearLog.memo || "未設定"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">元のコーディネート</h2>

          {wearLog.source_outfit_id === null ? (
            <p className="mt-3 text-sm text-gray-600">未指定</p>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-medium text-gray-900">
                  {wearLog.source_outfit_name ?? "名称未設定"}
                </p>
                <Link
                  href={`/outfits/${wearLog.source_outfit_id}?from=wear-log&wear_log_id=${wearLog.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  コーディネート詳細
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">アイテム</h2>

          {wearLog.items.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">アイテムは登録されていません。</p>
          ) : (
            <div className="mt-4 space-y-3">
              {wearLog.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {item.item_name ?? "名称未設定"}
                        </h3>
                        {item.source_item_status === "disposed" && (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                            手放し済み
                          </span>
                        )}
                        {item.source_item_care_status === "in_cleaning" && (
                          <span className="rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
                            {ITEM_CARE_STATUS_LABELS.in_cleaning}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.sort_order}番目 / {getItemSourceTypeLabel(item.item_source_type)}
                      </p>
                    </div>

                    {item.source_item_id !== null && (
                      <Link
                        href={`/items/${item.source_item_id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        アイテム詳細
                      </Link>
                    )}
                  </div>

                  {item.source_item_status === "disposed" && (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      このアイテムは現在候補外ですが、既存の記録として表示しています。
                    </p>
                  )}
                  {item.source_item_care_status === "in_cleaning" && (
                    <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                      クリーニング中ですが、予定・着用履歴ともに保持できます。
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
