"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import WearLogFeedbackFields from "@/components/wear-logs/wear-log-feedback-fields";
import WeatherRecordSummary from "@/components/weather/weather-record-summary";
import { ApiClientError } from "@/lib/api/client";
import { updateWearLogFeedback } from "@/lib/api/wear-logs";
import { redirectToLoginForSessionExpired } from "@/lib/auth/unauthorized";
import { getWearLogStatusLabel } from "@/lib/wear-logs/labels";
import type {
  WearLogFeedbackTag,
  WearLogOverallRating,
  WearLogRecord,
  WearLogTemperatureFeel,
} from "@/types/wear-logs";

type WearLogReflectionFormProps = {
  wearLog: WearLogRecord;
};

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map((part) => Number(part));

  if (!year || !month || !day) {
    return value;
  }

  return `${year}年${month}月${day}日`;
}

function buildItemSummary(wearLog: WearLogRecord): string {
  if (wearLog.source_outfit_name) {
    return wearLog.source_outfit_name;
  }

  if (wearLog.items.length === 0) {
    return "アイテム未設定";
  }

  const names = wearLog.items
    .map((item) => item.item_name)
    .filter((name): name is string => Boolean(name));
  const visibleNames = names.slice(0, 3).join("、");
  const hiddenCount = Math.max(names.length - 3, 0);

  return hiddenCount > 0
    ? `${visibleNames} ほか${hiddenCount}件`
    : visibleNames;
}

export default function WearLogReflectionForm({
  wearLog,
}: WearLogReflectionFormProps) {
  const router = useRouter();
  const [overallRating, setOverallRating] =
    useState<WearLogOverallRating | null>(wearLog.overall_rating);
  const [outdoorTemperatureFeel, setOutdoorTemperatureFeel] =
    useState<WearLogTemperatureFeel | null>(wearLog.outdoor_temperature_feel);
  const [indoorTemperatureFeel, setIndoorTemperatureFeel] =
    useState<WearLogTemperatureFeel | null>(wearLog.indoor_temperature_feel);
  const [feedbackTags, setFeedbackTags] = useState<WearLogFeedbackTag[]>(
    wearLog.feedback_tags ?? [],
  );
  const [feedbackMemo, setFeedbackMemo] = useState(wearLog.feedback_memo ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const detailHref = `/wear-logs/${wearLog.id}`;
  const contextWeather = wearLog.weather_records[0] ?? null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateWearLogFeedback(wearLog.id, {
        overall_rating: overallRating,
        outdoor_temperature_feel: outdoorTemperatureFeel,
        indoor_temperature_feel: indoorTemperatureFeel,
        feedback_tags: feedbackTags.length > 0 ? feedbackTags : null,
        feedback_memo: feedbackMemo,
      });

      router.push(detailHref);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          redirectToLoginForSessionExpired(router);
          return;
        }

        setErrorMessage(
          error.data?.message ??
            "振り返りを保存できませんでした。入力内容を確認してください。",
        );
      } else {
        setErrorMessage(
          "振り返りを保存できませんでした。時間をおいてもう一度お試しください。",
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          振り返る着用履歴
        </h2>
        <dl className="mt-4 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-500">着用日</dt>
            <dd className="mt-1">{formatDate(wearLog.event_date)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">状態</dt>
            <dd className="mt-1">{getWearLogStatusLabel(wearLog.status)}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="font-medium text-gray-500">
              コーディネート / アイテム
            </dt>
            <dd className="mt-1">{buildItemSummary(wearLog)}</dd>
          </div>
          {contextWeather ? (
            <div className="md:col-span-2">
              <dt className="font-medium text-gray-500">この日の天気</dt>
              <dd className="mt-2 rounded-xl border border-sky-100 bg-sky-50 p-3">
                <p className="text-sm font-medium text-sky-900">
                  {contextWeather.location_name}
                </p>
                <WeatherRecordSummary
                  record={contextWeather}
                  summaryClassName="mt-1 text-sm text-sky-800"
                />
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">服装の振り返り</h2>
        <p className="mt-1 text-sm text-gray-600">
          着た後の感想だけを保存します。着用日・アイテム・着用メモは変更しません。
        </p>

        <div className="mt-5 space-y-6">
          <WearLogFeedbackFields
            overallRating={overallRating}
            onOverallRatingChange={setOverallRating}
            outdoorTemperatureFeel={outdoorTemperatureFeel}
            onOutdoorTemperatureFeelChange={setOutdoorTemperatureFeel}
            indoorTemperatureFeel={indoorTemperatureFeel}
            onIndoorTemperatureFeelChange={setIndoorTemperatureFeel}
            feedbackTags={feedbackTags}
            onFeedbackTagsChange={setFeedbackTags}
            feedbackMemo={feedbackMemo}
            onFeedbackMemoChange={setFeedbackMemo}
          />

          {errorMessage ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href={detailHref}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
