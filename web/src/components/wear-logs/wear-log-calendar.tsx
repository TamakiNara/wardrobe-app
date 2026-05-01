"use client";

import { Check, CircleCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import WearLogModalColorThumbnail from "@/components/wear-logs/wear-log-modal-color-thumbnail";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { formatLocalDateYmd } from "@/lib/date/local-date";
import { buildWeatherRecordConditionSummary } from "@/lib/weather/labels";
import { getJapaneseHoliday } from "@/lib/wear-logs/japanese-holidays";
import {
  getWearLogFeedbackSummaryTags,
  getWearLogFeedbackTagLabel,
  getWearLogOverallRatingBadgeClassName,
  getWearLogOverallRatingLabel,
  getWearLogStatusBadgeClassName,
  getWearLogStatusLabel,
  getWearLogTemperatureFeelLabel,
} from "@/lib/wear-logs/labels";
import type { SkinTonePreset } from "@/types/settings";
import type {
  WearLogByDateResponse,
  WearLogCalendarDaySummary,
} from "@/types/wear-logs";

type WearLogCalendarProps = {
  month: string;
  days: WearLogCalendarDaySummary[];
  weekStart?: "monday" | "sunday";
  skinTonePreset?: SkinTonePreset;
};

type DayType = "weekday" | "saturday" | "sunday" | "holiday";

const WEEKDAY_LABELS = {
  sunday: [
    { label: "日", dayType: "sunday" as const },
    { label: "月", dayType: "weekday" as const },
    { label: "火", dayType: "weekday" as const },
    { label: "水", dayType: "weekday" as const },
    { label: "木", dayType: "weekday" as const },
    { label: "金", dayType: "weekday" as const },
    { label: "土", dayType: "saturday" as const },
  ],
  monday: [
    { label: "月", dayType: "weekday" as const },
    { label: "火", dayType: "weekday" as const },
    { label: "水", dayType: "weekday" as const },
    { label: "木", dayType: "weekday" as const },
    { label: "金", dayType: "weekday" as const },
    { label: "土", dayType: "saturday" as const },
    { label: "日", dayType: "sunday" as const },
  ],
} as const;

function parseMonth(month: string): { year: number; monthIndex: number } {
  const [year, monthNumber] = month.split("-").map((value) => Number(value));

  return {
    year,
    monthIndex: monthNumber - 1,
  };
}

function parseDateString(date: string): {
  year: number;
  monthIndex: number;
  day: number;
} {
  const [year, monthNumber, day] = date
    .split("-")
    .map((value) => Number(value));

  return {
    year,
    monthIndex: monthNumber - 1,
    day,
  };
}

function getDayType(date: string): DayType {
  const holiday = getJapaneseHoliday(date);

  if (holiday.isHoliday) {
    return "holiday";
  }

  const { year, monthIndex, day } = parseDateString(date);
  const weekDay = new Date(year, monthIndex, day).getDay();

  if (weekDay === 0) {
    return "sunday";
  }
  if (weekDay === 6) {
    return "saturday";
  }

  return "weekday";
}

function getDayTypeTextClassName(dayType: DayType): string {
  switch (dayType) {
    case "holiday":
    case "sunday":
      return "text-rose-600";
    case "saturday":
      return "text-sky-600";
    default:
      return "text-gray-500";
  }
}

function getDayTypeCellClassName(dayType: DayType): string {
  switch (dayType) {
    case "holiday":
    case "sunday":
      return "border-rose-200 bg-rose-50/40 hover:border-rose-300 hover:bg-rose-50/60";
    case "saturday":
      return "border-sky-200 bg-sky-50/40 hover:border-sky-300 hover:bg-sky-50/60";
    default:
      return "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30";
  }
}

function getDayTypeNumberClassName(
  dayType: DayType,
  isCurrentMonth: boolean,
): string {
  if (!isCurrentMonth) {
    return "text-gray-400";
  }

  switch (dayType) {
    case "holiday":
    case "sunday":
      return "text-rose-700";
    case "saturday":
      return "text-sky-700";
    default:
      return "text-gray-900";
  }
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

function buildWeatherHref(
  date: string,
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const params = new URLSearchParams();
  params.set("date", date);
  params.set(
    "returnTo",
    `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
  );

  return `/wear-logs/weather?${params.toString()}`;
}

function hasWearLogFeedbackSummary(
  wearLog: WearLogByDateResponse["wearLogs"][number],
): boolean {
  return (
    wearLog.overall_rating !== null ||
    wearLog.outdoor_temperature_feel !== null ||
    wearLog.indoor_temperature_feel !== null ||
    (wearLog.feedback_tags?.length ?? 0) > 0
  );
}

function buildWearLogTemperatureSummaryParts(
  wearLog: WearLogByDateResponse["wearLogs"][number],
): string[] {
  return [
    wearLog.outdoor_temperature_feel
      ? `屋外 ${getWearLogTemperatureFeelLabel(wearLog.outdoor_temperature_feel)}`
      : null,
    wearLog.indoor_temperature_feel
      ? `屋内 ${getWearLogTemperatureFeelLabel(wearLog.indoor_temperature_feel)}`
      : null,
  ].filter((part): part is string => Boolean(part));
}

function buildWearLogModalFeedbackSummary(
  wearLog: WearLogByDateResponse["wearLogs"][number],
) {
  const overallRatingLabel = wearLog.overall_rating
    ? getWearLogOverallRatingLabel(wearLog.overall_rating)
    : null;
  const temperatureSummaryParts = buildWearLogTemperatureSummaryParts(wearLog);
  const summaryTags = getWearLogFeedbackSummaryTags(wearLog.feedback_tags, 3);

  return {
    overallRatingLabel,
    temperatureSummaryParts,
    summaryTags,
  };
}

function renderWearLogCalendarMarker(
  dot: WearLogCalendarDaySummary["dots"][number],
) {
  const ariaLabel = dot.has_feedback
    ? dot.status === "worn"
      ? "着用済み・振り返りあり"
      : "予定・振り返りあり"
    : dot.status === "worn"
      ? "着用済み"
      : "予定";

  if (!dot.has_feedback) {
    if (dot.status === "worn") {
      return (
        <span
          className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center"
          data-status={dot.status}
          data-feedback="false"
          data-marker-kind="dot-filled"
          aria-label={ariaLabel}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="currentColor"
              className="text-blue-600"
            />
          </svg>
        </span>
      );
    }

    return (
      <span
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-blue-300"
        data-status={dot.status}
        data-feedback="false"
        data-marker-kind="dot-outline"
        aria-label={ariaLabel}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
          <circle
            cx="8"
            cy="8"
            r="5.25"
            fill="white"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </span>
    );
  }

  if (dot.status === "worn") {
    return (
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"
        data-status={dot.status}
        data-feedback="true"
        data-marker-kind="check-filled"
        aria-label={ariaLabel}
      >
        <Check className="h-3 w-3" strokeWidth={2.8} />
      </span>
    );
  }

  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-blue-600"
      data-status={dot.status}
      data-feedback="true"
      data-marker-kind="circle-check"
      aria-label={ariaLabel}
    >
      <CircleCheck className="h-4 w-4" strokeWidth={2.35} />
    </span>
  );
}

export default function WearLogCalendar({
  month,
  days,
  weekStart = "monday",
  skinTonePreset,
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

  const summaryMap = useMemo(
    () => new Map(days.map((day) => [day.date, day])),
    [days],
  );
  const calendarCells = useMemo(
    () => buildCalendarCells(month, weekStart),
    [month, weekStart],
  );
  const today = useMemo(() => formatLocalDateYmd(), []);

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
          error.data?.message ?? "日付詳細の取得に失敗しました。",
        );
        return;
      }

      setDetailsError("日付詳細の取得に失敗しました。");
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
                  `${pathname}${buildQueryWithMonth(
                    searchParams,
                    shiftMonth(month, -1),
                  )}`,
                  { scroll: false },
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
                  `${pathname}${buildQueryWithMonth(
                    searchParams,
                    shiftMonth(month, 1),
                  )}`,
                  { scroll: false },
                )
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
            >
              次の月
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">
            <span className="h-3.5 w-3.5 rounded-full border border-blue-300 bg-white" />
            <span>予定</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-blue-600" />
            <span>着用済み</span>
          </div>
        </div>

        <div className="mx-auto mt-5 w-full max-w-[688px]">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium">
            {WEEKDAY_LABELS[weekStart].map(({ label, dayType }) => (
              <div
                key={label}
                className={`py-2 ${getDayTypeTextClassName(dayType)}`}
                data-day-type={dayType}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarCells.map((cell) => {
              const summary = summaryMap.get(cell.date);
              const holiday = getJapaneseHoliday(cell.date);
              const isSelected = selectedDate === cell.date;
              const isToday = cell.date === today;
              const isPastDate = cell.date < today;
              const dayType = getDayType(cell.date);
              const cellClassName = [
                "aspect-square w-full rounded-lg border p-1.5 text-left transition",
                isSelected
                  ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-100"
                  : isPastDate
                    ? "border-gray-200 bg-gray-100"
                    : getDayTypeCellClassName(dayType),
                !cell.isCurrentMonth ? "text-gray-300" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const dayNumberClassName = [
                "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                isSelected
                  ? "bg-blue-600 text-white"
                  : isToday
                    ? "border border-blue-200 bg-blue-50 text-blue-700"
                    : getDayTypeNumberClassName(dayType, cell.isCurrentMonth),
              ].join(" ");

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => openDayDetails(cell.date)}
                  className={cellClassName}
                  data-date={cell.date}
                  data-day-type={dayType}
                  data-holiday-name={holiday.name ?? undefined}
                  data-current-month={cell.isCurrentMonth ? "true" : "false"}
                  data-selected={isSelected ? "true" : "false"}
                  data-today={isToday ? "true" : "false"}
                  data-past={isPastDate ? "true" : "false"}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={dayNumberClassName}>{cell.dayNumber}</span>
                  </div>

                  <div className="mt-6 flex min-h-3 items-center gap-1">
                    {summary ? (
                      <>
                        {summary.dots.map((dot, index) => (
                          <span key={`${cell.date}-${dot.status}-${index}`}>
                            {renderWearLogCalendarMarker(dot)}
                          </span>
                        ))}
                        {summary.overflowCount > 0 ? (
                          <span className="text-[11px] font-medium text-gray-500">
                            +{summary.overflowCount}
                          </span>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {selectedDate ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/35 p-4 md:p-6">
          <div className="max-h-[min(80vh,720px)] w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  日付詳細
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
              ) : dayDetails ? (
                <>
                  <section className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          この日の天気
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          地域ごとに登録した天気を確認できます。
                        </p>
                      </div>
                      <Link
                        href={buildWeatherHref(
                          selectedDate,
                          pathname,
                          searchParams,
                        )}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {dayDetails.weatherRecords.length > 0
                          ? "天気を編集"
                          : "天気を登録"}
                      </Link>
                    </div>

                    {dayDetails.weatherRecords.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {dayDetails.weatherRecords.map((record) => (
                          <div
                            key={record.id}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-3"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {record.location_name}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {buildWeatherRecordConditionSummary(record)}
                            </p>
                            {(record.memo ?? "").trim() !== "" ? (
                              <p className="mt-1 text-sm text-gray-500">
                                メモ: {record.memo}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-600">
                        まだ天気は登録されていません。
                      </p>
                    )}
                  </section>

                  {dayDetails.wearLogs.length > 0 ? (
                    dayDetails.wearLogs.map((wearLog) => {
                      const {
                        overallRatingLabel,
                        temperatureSummaryParts,
                        summaryTags,
                      } = buildWearLogModalFeedbackSummary(wearLog);
                      const shouldShowFeedbackSummary =
                        hasWearLogFeedbackSummary(wearLog) &&
                        (overallRatingLabel !== null ||
                          temperatureSummaryParts.length > 0 ||
                          summaryTags.length > 0);

                      return (
                        <article
                          key={wearLog.id}
                          className={`rounded-2xl border px-4 py-3 ${
                            wearLog.status === "planned" &&
                            wearLog.event_date < today
                              ? "border-gray-200 bg-gray-100"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <WearLogModalColorThumbnail
                                items={wearLog.thumbnail_items ?? []}
                                skinTonePreset={skinTonePreset}
                              />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getWearLogStatusBadgeClassName(
                                      wearLog.status,
                                    )}`}
                                  >
                                    {getWearLogStatusLabel(wearLog.status)}
                                  </span>
                                  <p className="text-sm font-medium text-gray-900">
                                    {wearLog.display_order}件目
                                  </p>
                                </div>
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

                          {wearLog.memo ? (
                            <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                              {wearLog.memo}
                            </p>
                          ) : null}

                          {shouldShowFeedbackSummary ? (
                            <div className="mt-3 space-y-2">
                              {overallRatingLabel ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">
                                    総合評価
                                  </span>
                                  <span
                                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-sm font-semibold ${getWearLogOverallRatingBadgeClassName(
                                      wearLog.overall_rating!,
                                    )}`}
                                  >
                                    {overallRatingLabel}
                                  </span>
                                </div>
                              ) : null}
                              {temperatureSummaryParts.length > 0 ? (
                                <p className="text-xs text-gray-600">
                                  {temperatureSummaryParts.join(" / ")}
                                </p>
                              ) : null}
                              {summaryTags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {summaryTags.map((tag) => (
                                    <span
                                      key={`${wearLog.id}-${tag}`}
                                      className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700"
                                    >
                                      {getWearLogFeedbackTagLabel(tag)}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          {wearLog.status === "planned" &&
                          wearLog.event_date < today ? (
                            <p className="mt-2 text-xs text-gray-500">
                              過去日の未着用予定です。
                            </p>
                          ) : null}
                        </article>
                      );
                    })
                  ) : (
                    <div className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5">
                      <p className="text-sm font-medium text-gray-900">
                        この日の着用履歴はまだありません
                      </p>
                      <p className="text-sm text-gray-600">
                        必要に応じて日付指定で新しく着用履歴を追加できます。
                      </p>
                      <Link
                        href={buildCreateHref(
                          selectedDate,
                          dayDetails.wearLogs.length,
                        )}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      >
                        この日で新規追加
                      </Link>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
