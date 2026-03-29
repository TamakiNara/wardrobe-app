import Link from "next/link";
import { redirect } from "next/navigation";
import WearLogCalendar from "@/components/wear-logs/wear-log-calendar";
import WearLogColorThumbnail from "@/components/wear-logs/wear-log-color-thumbnail";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import {
  WEAR_LOG_STATUS_LABELS,
  getWearLogStatusLabel,
} from "@/lib/wear-logs/labels";
import type {
  WearLogCalendarResponse,
  WearLogsResponse,
} from "@/types/wear-logs";

type WearLogsPageSearchParams = Record<string, string | string[] | undefined>;
type PreferencesResponse = {
  preferences?: {
    calendarWeekStart?: "monday" | "sunday" | null;
  };
};

function normalizeMonth(value: string | string[] | undefined): string {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue && /^\d{4}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function buildQueryString(searchParams: WearLogsPageSearchParams): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
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

function buildPageLink(
  searchParams: WearLogsPageSearchParams,
  nextPage: number,
): string {
  const query = buildQueryString({
    ...searchParams,
    page: String(nextPage),
  });

  return query ? `/wear-logs?${query}` : "/wear-logs";
}

async function getWearLogs(
  searchParams: WearLogsPageSearchParams,
): Promise<WearLogsResponse> {
  const query = buildQueryString(searchParams);
  const path = query ? `/api/wear-logs?${query}` : "/api/wear-logs";
  const response = await fetchLaravelWithCookie(path);

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return {
      wearLogs: [],
      meta: {
        total: 0,
        totalAll: 0,
        page: 1,
        lastPage: 1,
      },
    };
  }

  const data = (await response.json()) as Partial<WearLogsResponse>;

  return {
    wearLogs: data.wearLogs ?? [],
    meta: {
      total: data.meta?.total ?? 0,
      totalAll: data.meta?.totalAll ?? 0,
      page: data.meta?.page ?? 1,
      lastPage: data.meta?.lastPage ?? 1,
    },
  };
}

async function getWearLogCalendar(
  month: string,
): Promise<WearLogCalendarResponse> {
  const response = await fetchLaravelWithCookie(
    `/api/wear-logs/calendar?month=${encodeURIComponent(month)}`,
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return {
      month,
      days: [],
    };
  }

  const data = (await response.json()) as Partial<WearLogCalendarResponse>;

  return {
    month: data.month ?? month,
    days: data.days ?? [],
  };
}

async function getCalendarWeekStart(): Promise<"monday" | "sunday"> {
  const response = await fetchLaravelWithCookie("/api/settings/preferences");

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return "monday";
  }

  const data = (await response.json()) as PreferencesResponse;
  return data.preferences?.calendarWeekStart === "sunday" ? "sunday" : "monday";
}

export default async function WearLogsPage({
  searchParams,
}: {
  searchParams: Promise<WearLogsPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedMonth = normalizeMonth(resolvedSearchParams.month);
  const [data, calendarData, calendarWeekStart] = await Promise.all([
    getWearLogs(resolvedSearchParams),
    getWearLogCalendar(selectedMonth),
    getCalendarWeekStart(),
  ]);
  const flashMessage =
    resolvedSearchParams.message === "deleted"
      ? "着用履歴を削除しました。"
      : null;

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <span className="text-gray-700">着用履歴一覧</span>
        </nav>

        <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">着用履歴管理</p>
            <h1 className="text-2xl font-bold text-gray-900">着用履歴一覧</h1>
            <p className="mt-1 text-sm text-gray-600">
              予定 / 着用済み の履歴を日付順で確認します。
            </p>
          </div>

          <Link
            href="/wear-logs/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            着用履歴を追加
          </Link>
        </header>

        {flashMessage && (
          <section className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 shadow-sm">
            {flashMessage}
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <input type="hidden" name="month" value={selectedMonth} />
            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                キーワード
              </label>
              <input
                type="search"
                name="keyword"
                defaultValue={
                  typeof resolvedSearchParams.keyword === "string"
                    ? resolvedSearchParams.keyword
                    : ""
                }
                placeholder="メモ / 元のコーディネート名"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                状態
              </label>
              <select
                name="status"
                defaultValue={
                  typeof resolvedSearchParams.status === "string"
                    ? resolvedSearchParams.status
                    : ""
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">すべて</option>
                <option value="planned">
                  {WEAR_LOG_STATUS_LABELS.planned}
                </option>
                <option value="worn">{WEAR_LOG_STATUS_LABELS.worn}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                開始日
              </label>
              <input
                type="date"
                name="date_from"
                defaultValue={
                  typeof resolvedSearchParams.date_from === "string"
                    ? resolvedSearchParams.date_from
                    : ""
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                終了日
              </label>
              <input
                type="date"
                name="date_to"
                defaultValue={
                  typeof resolvedSearchParams.date_to === "string"
                    ? resolvedSearchParams.date_to
                    : ""
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                sort
              </label>
              <select
                name="sort"
                defaultValue={
                  typeof resolvedSearchParams.sort === "string"
                    ? resolvedSearchParams.sort
                    : "date_desc"
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="date_desc">日付の新しい順</option>
                <option value="date_asc">日付の古い順</option>
              </select>
            </div>

            <div className="flex items-end gap-3 xl:col-span-5">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                絞り込む
              </button>
              <Link
                href="/wear-logs"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                条件をクリア
              </Link>
            </div>
          </form>
        </section>

        <WearLogCalendar
          month={calendarData.month}
          days={calendarData.days}
          weekStart={calendarWeekStart}
        />

        {data.meta.totalAll === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              着用履歴がまだありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              予定 / 着用済み を登録して、日々の記録を残していきましょう。
            </p>
          </section>
        ) : data.wearLogs.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              条件に一致する着用履歴はありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              条件を変えてお試しください。
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.wearLogs.map((wearLog) => (
                <article
                  key={wearLog.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-medium ${
                        wearLog.status === "worn"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-blue-300 bg-blue-50 text-blue-700"
                      }`}
                    >
                      {getWearLogStatusLabel(wearLog.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {wearLog.event_date} / {wearLog.display_order}件目
                    </span>
                  </div>

                  <div className="mt-3 flex items-start gap-4">
                    <WearLogColorThumbnail
                      items={wearLog.thumbnail_items ?? []}
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {wearLog.source_outfit_name ??
                          `アイテム ${wearLog.items_count} 件`}
                      </h2>

                      {wearLog.source_outfit_status === "invalid" && (
                        <p className="mt-1 text-sm text-amber-800">
                          元のコーディネートは現在利用不可です。
                        </p>
                      )}

                      {wearLog.has_disposed_items && (
                        <p className="mt-1 text-sm text-amber-800">
                          一部アイテムは現在利用不可です。
                        </p>
                      )}

                      {wearLog.memo && (
                        <p className="mt-2 text-sm text-gray-600">
                          {wearLog.memo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <Link
                      href={`/wear-logs/${wearLog.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      詳細
                    </Link>
                  </div>
                </article>
              ))}
            </section>

            <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              {data.meta.page > 1 ? (
                <Link
                  href={buildPageLink(resolvedSearchParams, data.meta.page - 1)}
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
                {data.meta.page} / {data.meta.lastPage}ページ
                <span className="ml-2 text-gray-400">
                  （全{data.meta.total}件）
                </span>
              </p>

              {data.meta.page < data.meta.lastPage ? (
                <Link
                  href={buildPageLink(resolvedSearchParams, data.meta.page + 1)}
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
