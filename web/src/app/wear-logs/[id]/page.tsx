import Link from "next/link";
import { redirect } from "next/navigation";
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
              href={`/wear-logs/${wearLog.id}/edit`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              編集する
            </Link>
            <Link
              href="/wear-logs"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              一覧へ戻る
            </Link>
          </div>
        </div>

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

              {wearLog.source_outfit_status === "invalid" && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  元のコーディネートは現在候補外ですが、既存の記録として表示しています。
                </p>
              )}
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
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
