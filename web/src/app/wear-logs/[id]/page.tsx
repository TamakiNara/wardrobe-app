import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata";
import WeatherRecordSummary from "@/components/weather/weather-record-summary";
import DeleteWearLogButton from "@/components/wear-logs/delete-wear-log-button";
import WearLogStatusAction from "@/components/wear-logs/wear-log-status-action";
import { EntityDetailHeader } from "@/components/shared/entity-detail-header";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import {
  getWearLogFeedbackTagLabel,
  getWearLogOverallRatingBadgeClassName,
  getWearLogOverallRatingLabel,
  getWearLogStatusBadgeClassName,
  getWearLogStatusLabel,
  getWearLogTemperatureFeelLabel,
  splitWearLogFeedbackTags,
} from "@/lib/wear-logs/labels";
import type { WearLogRecord } from "@/types/wear-logs";

const fallbackMetadata = buildPageMetadata("着用履歴詳細");

function getItemSourceTypeLabel(itemSourceType: "outfit" | "manual"): string {
  return itemSourceType === "outfit" ? "コーディネート由来" : "手動追加";
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

function formatWearLogTitleDate(value: string): string {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return "着用履歴詳細";
  }

  return `${Number(year)}年${Number(month)}月${Number(day)}日の着用履歴`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchWearLogDetail(id);
  const eventDate = result.wearLog?.event_date;

  if (!eventDate) {
    return fallbackMetadata;
  }

  return buildPageMetadata(formatWearLogTitleDate(eventDate));
}

async function fetchWearLogDetail(
  id: string,
): Promise<{ status: number; wearLog: WearLogRecord | null }> {
  const response = await fetchLaravelWithCookie(`/api/wear-logs/${id}`);
  const data = await response.json().catch(() => null);

  return {
    status: response.status,
    wearLog: response.ok
      ? ((data?.wearLog as WearLogRecord | undefined) ?? null)
      : null,
  };
}

async function getWearLog(id: string): Promise<WearLogRecord> {
  const result = await fetchWearLogDetail(id);

  if (result.status === 401) {
    redirect("/login");
  }

  if (!result.wearLog) {
    redirect("/wear-logs");
  }

  return result.wearLog;
}

export default async function WearLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wearLog = await getWearLog(id);
  const today = getTodayYmd();
  const isPastPlanned =
    wearLog.status === "planned" && wearLog.event_date < today;
  const feedbackSummary = splitWearLogFeedbackTags(wearLog.feedback_tags ?? []);
  const hasFeedbackSection =
    wearLog.overall_rating !== null ||
    wearLog.outdoor_temperature_feel !== null ||
    wearLog.indoor_temperature_feel !== null ||
    feedbackSummary.positives.length > 0 ||
    feedbackSummary.concerns.length > 0 ||
    (wearLog.feedback_memo ?? "").trim() !== "";
  const hasWeatherSection = wearLog.weather_records.length > 0;

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <EntityDetailHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "着用履歴一覧", href: "/wear-logs" },
            { label: "詳細" },
          ]}
          eyebrow="着用履歴管理"
          title="着用履歴詳細"
          details={
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-sm font-medium ${getWearLogStatusBadgeClassName(
                  wearLog.status,
                )}`}
              >
                {getWearLogStatusLabel(wearLog.status)}
              </span>
              <span className="text-sm text-gray-500">
                {wearLog.event_date} / {wearLog.display_order}件目
              </span>
            </div>
          }
          actions={
            <>
              <Link
                href="/wear-logs"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                一覧へ戻る
              </Link>
              <Link
                href={`/wear-logs/${wearLog.id}/edit`}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                編集
              </Link>
            </>
          }
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              {isPastPlanned ? (
                <p className="text-sm text-gray-600">
                  この予定は過去日の未着用記録です。着用済みへ更新できます。
                </p>
              ) : null}
            </div>
            <div className="flex w-full shrink-0 flex-wrap items-center justify-start gap-3 md:ml-auto md:w-auto md:justify-end">
              <WearLogStatusAction wearLog={wearLog} />
              <DeleteWearLogButton wearLogId={String(wearLog.id)} />
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-700">状態</dt>
                <dd className="mt-1 text-sm text-gray-600">
                  {getWearLogStatusLabel(wearLog.status)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-700">日付</dt>
                <dd className="mt-1 text-sm text-gray-600">
                  {wearLog.event_date}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-700">表示順</dt>
                <dd className="mt-1 text-sm text-gray-600">
                  {wearLog.display_order}件目
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-700">メモ</dt>
                <dd className="mt-1 text-sm text-gray-600">
                  {wearLog.memo || "未記録"}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {hasFeedbackSection ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              服装の振り返り
            </h2>

            {wearLog.overall_rating ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">総合評価</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${getWearLogOverallRatingBadgeClassName(
                      wearLog.overall_rating,
                    )}`}
                  >
                    {getWearLogOverallRatingLabel(wearLog.overall_rating)}
                  </span>
                </div>
              </div>
            ) : null}

            {(wearLog.outdoor_temperature_feel ||
              wearLog.indoor_temperature_feel) && (
              <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
                {wearLog.outdoor_temperature_feel ? (
                  <div className="flex items-center gap-2">
                    <dt className="text-gray-500">屋外</dt>
                    <dd className="font-medium text-gray-900">
                      {getWearLogTemperatureFeelLabel(
                        wearLog.outdoor_temperature_feel,
                      )}
                    </dd>
                  </div>
                ) : null}
                {wearLog.indoor_temperature_feel ? (
                  <div className="flex items-center gap-2">
                    <dt className="text-gray-500">屋内</dt>
                    <dd className="font-medium text-gray-900">
                      {getWearLogTemperatureFeelLabel(
                        wearLog.indoor_temperature_feel,
                      )}
                    </dd>
                  </div>
                ) : null}
              </dl>
            )}

            {feedbackSummary.positives.length > 0 ? (
              <div className="mt-5">
                <h3 className="text-sm font-medium text-gray-500">
                  よかったこと
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {feedbackSummary.positives.map((tag) => (
                    <span
                      key={`positive-${tag}`}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
                    >
                      {getWearLogFeedbackTagLabel(tag)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {feedbackSummary.concerns.length > 0 ? (
              <div className="mt-5">
                <h3 className="text-sm font-medium text-gray-500">
                  気になったこと
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {feedbackSummary.concerns.map((tag) => (
                    <span
                      key={`concern-${tag}`}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-700"
                    >
                      {getWearLogFeedbackTagLabel(tag)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {(wearLog.feedback_memo ?? "").trim() !== "" ? (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-medium text-gray-500">
                  振り返りメモ
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {wearLog.feedback_memo}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {hasWeatherSection ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              この日の天気
            </h2>
            <div className="mt-4 space-y-3">
              {wearLog.weather_records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {record.location_name}
                  </p>
                  <WeatherRecordSummary record={record} />
                  {(record.memo ?? "").trim() !== "" ? (
                    <p className="mt-1 text-sm text-gray-600">
                      メモ: {record.memo}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">アイテム</h2>

          {wearLog.items.length > 0 ? (
            <div className="mt-4 space-y-3">
              {wearLog.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {item.item_name ?? "名前未設定"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.sort_order}件目 /{" "}
                        {getItemSourceTypeLabel(item.item_source_type)}
                      </p>
                    </div>
                    {item.source_item_id !== null ? (
                      <Link
                        href={`/items/${item.source_item_id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        アイテム詳細
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">
              アイテムはまだありません。
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
