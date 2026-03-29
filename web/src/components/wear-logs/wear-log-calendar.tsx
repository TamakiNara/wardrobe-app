"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import WearLogModalColorThumbnail from "@/components/wear-logs/wear-log-modal-color-thumbnail";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { getWearLogStatusLabel } from "@/lib/wear-logs/labels";
import type {
  WearLogByDateResponse,
  WearLogCalendarDaySummary,
} from "@/types/wear-logs";

type WearLogCalendarProps = {
  month: string;
  days: WearLogCalendarDaySummary[];
  weekStart?: "monday" | "sunday";
};

const WEEKDAY_LABELS = {
  sunday: ["日", "月", "火", "水", "木", "金", "土"],
  monday: ["月", "火", "水", "木", "金", "土", "日"],
} as const;

function parseMonth(month: string): { year: number; monthIndex: number } {
  const [year, monthNumber] = month.split("-").map((value) => Number(value));

  return {
    year,
    monthIndex: monthNumber - 1,
  };
}

function formatMonthLabel(month: string): string {
  const { year, monthIndex } = parseMonth(month);

  return `${year}年${monthIndex + 1}月`;
}

function shiftMonth(month: string, delta: number): string {
  const { year, monthIndex } = parseMonth(month);
  const date = new Date(year, monthIndex + delta, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendarCells(month: string, weekStart: "monday" | "sunday") {
  const { year, monthIndex } = parseMonth(month);
  const firstDay = new Date(year, monthIndex, 1);
  const lastDate = new Date(year, monthIndex + 1, 0).getDate();
  const previousMonthLastDate = new Date(year, monthIndex, 0).getDate();
  const leadingBlankCount =
    weekStart === "monday" ? (firstDay.getDay() + 6) % 7 : firstDay.getDay();
  const cells: Array<{
    key: string;
    date: string;
    dayNumber: number;
    isCurrentMonth: boolean;
  }> = [];

  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  for (let index = 0; index < leadingBlankCount; index += 1) {
    cells.push({
      key: `prev-${index}`,
      date: `${previousMonth}-${String(previousMonthLastDate - leadingBlankCount + index + 1).padStart(2, "0")}`,
      dayNumber: previousMonthLastDate - leadingBlankCount + index + 1,
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= lastDate; day += 1) {
    cells.push({
      key: `${month}-${day}`,
      date: `${month}-${String(day).padStart(2, "0")}`,
      dayNumber: day,
      isCurrentMonth: true,
    });
  }

  let trailingDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      key: `next-${trailingDay}`,
      date: `${nextMonth}-${String(trailingDay).padStart(2, "0")}`,
      dayNumber: trailingDay,
      isCurrentMonth: false,
    });
    trailingDay += 1;
  }

  return cells;
}

function buildQueryWithMonth(
  searchParams: URLSearchParams,
  nextMonth: string,
): string {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("month", nextMonth);

  const query = nextParams.toString();
  return query ? `?${query}` : "";
}

function buildCreateHref(date: string, wearLogsCount: number): string {
  const params = new URLSearchParams({
    event_date: date,
    display_order: String(wearLogsCount + 1),
  });

  return `/wear-logs/new?${params.toString()}`;
}

export default function WearLogCalendar({
  month,
  days,
  weekStart = "monday",
}: WearLogCalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetails, setDayDetails] = useState<WearLogByDateResponse | null>(
    null,
  );
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(null);
    setDayDetails(null);
    setLoadingDetails(false);
    setDetailsError(null);
  }, [month]);

  const summaryMap = useMemo(() => {
    return new Map(days.map((day) => [day.date, day]));
  }, [days]);

  const calendarCells = useMemo(
    () => buildCalendarCells(month, weekStart),
    [month, weekStart],
  );
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function openDayDetails(date: string) {
    setSelectedDate(date);
    setLoadingDetails(true);
    setDetailsError(null);

    try {
      const data = await apiFetch<WearLogByDateResponse>(
        `/api/wear-logs/by-date?event_date=${encodeURIComponent(date)}`,
      );
      setDayDetails(data);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          router.push("/login");
          return;
        }

        setDetailsError(
          error.data?.message ?? "日別詳細の取得に失敗しました。",
        );
        return;
      }

      setDetailsError("日別詳細の取得に失敗しました。");
    } finally {
      setLoadingDetails(false);
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">カレンダー</h2>
            <p className="mt-1 text-sm text-gray-600">
              月ごとの着用履歴を日付単位で確認できます。
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() =>
                router.replace(
                  `${pathname}${buildQueryWithMonth(searchParams, shiftMonth(month, -1))}`,
                  {
                    scroll: false,
                  },
                )
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
            >
              前の月
            </button>
            <p className="min-w-24 text-center text-sm font-medium text-gray-900">
              {formatMonthLabel(month)}
            </p>
            <button
              type="button"
              onClick={() =>
                router.replace(
                  `${pathname}${buildQueryWithMonth(searchParams, shiftMonth(month, 1))}`,
                  {
                    scroll: false,
                  },
                )
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
            >
              次の月
            </button>
          </div>
        </div>

        <div className="mx-auto mt-5 w-full max-w-[688px]">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500">
            {WEEKDAY_LABELS[weekStart].map((label) => (
              <div key={label} className="py-2">
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarCells.map((cell) => {
              const summary = summaryMap.get(cell.date);
              const isSelected = selectedDate === cell.date;
              const isToday = cell.date === today;
              const isPastDate = cell.date < today;
              const cellClassName = [
                "aspect-square w-full rounded-lg border p-1.5 text-left transition",
                isSelected
                  ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-100"
                  : isPastDate
                    ? "border-gray-200 bg-gray-100 hover:border-blue-300 hover:bg-gray-100"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30",
                !cell.isCurrentMonth ? "text-gray-300" : "",
                isPastDate && !isSelected ? "text-gray-600" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const dayNumberClassName = [
                "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                isSelected
                  ? "bg-blue-600 text-white"
                  : isToday
                    ? "border border-blue-200 bg-blue-50 text-blue-700"
                    : cell.isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400",
              ].join(" ");

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => openDayDetails(cell.date!)}
                  className={cellClassName}
                  data-date={cell.date}
                  data-current-month={cell.isCurrentMonth ? "true" : "false"}
                  data-selected={isSelected ? "true" : "false"}
                  data-today={isToday ? "true" : "false"}
                  data-past={isPastDate ? "true" : "false"}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={dayNumberClassName}>{cell.dayNumber}</span>
                  </div>

                  <div className="mt-6 flex min-h-3 items-center gap-1">
                    {!!summary ? (
                      <>
                        {summary.dots.map((dot, index) => (
                          <span
                            key={`${cell.date}-${dot.status}-${index}`}
                            className={`h-2.5 w-2.5 rounded-full ${
                              dot.status === "worn"
                                ? "bg-blue-600"
                                : "bg-blue-300"
                            }`}
                          />
                        ))}
                        {summary.overflowCount > 0 && (
                          <span className="text-[11px] font-medium text-gray-500">
                            +{summary.overflowCount}
                          </span>
                        )}
                      </>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {selectedDate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/35 p-4 md:p-6">
          <div className="max-h-[min(80vh,720px)] w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  日別詳細
                </h3>
                <p className="mt-1 text-sm text-gray-600">{selectedDate}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  setDayDetails(null);
                  setDetailsError(null);
                }}
                className="text-sm font-medium text-gray-500 transition hover:text-gray-700"
              >
                閉じる
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              {loadingDetails ? (
                <p className="text-sm text-gray-600">読み込み中です...</p>
              ) : detailsError ? (
                <p className="text-sm text-red-600">{detailsError}</p>
              ) : dayDetails && dayDetails.wearLogs.length > 0 ? (
                dayDetails.wearLogs.map((wearLog) => (
                  <article
                    key={wearLog.id}
                    className={`rounded-2xl border px-4 py-3 ${
                      wearLog.status === "planned" && wearLog.event_date < today
                        ? "border-gray-200 bg-gray-100"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <WearLogModalColorThumbnail
                          items={wearLog.thumbnail_items ?? []}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {wearLog.display_order}件目 /{" "}
                            {getWearLogStatusLabel(wearLog.status)}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {wearLog.source_outfit_name ??
                              `アイテム ${wearLog.items_count} 件`}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/wear-logs/${wearLog.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        詳細
                      </Link>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      アイテム {wearLog.items_count} 件
                    </p>

                    {wearLog.memo && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {wearLog.memo}
                      </p>
                    )}

                    {wearLog.status === "planned" &&
                      wearLog.event_date < today && (
                        <p className="mt-2 text-xs text-gray-500">
                          過去の未完了予定です。
                        </p>
                      )}
                  </article>
                ))
              ) : (
                <div className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5">
                  <p className="text-sm font-medium text-gray-900">
                    この日の着用履歴はまだありません
                  </p>
                  <p className="text-sm text-gray-600">
                    選択した日付で新しく着用履歴を登録できます。
                  </p>
                  <Link
                    href={buildCreateHref(
                      selectedDate,
                      dayDetails?.wearLogs.length ?? 0,
                    )}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    この日で新規作成
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
