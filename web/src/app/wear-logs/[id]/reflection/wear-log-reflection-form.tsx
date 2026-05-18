"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import WeatherRecordSummary from "@/components/weather/weather-record-summary";
import { ApiClientError } from "@/lib/api/client";
import { updateWearLogFeedback } from "@/lib/api/wear-logs";
import { redirectToLoginForSessionExpired } from "@/lib/auth/unauthorized";
import {
  getWearLogFeedbackTagLabel,
  getWearLogStatusLabel,
  WEAR_LOG_FEEDBACK_TAG_GROUPS,
  WEAR_LOG_OVERALL_RATING_LABELS,
  WEAR_LOG_TEMPERATURE_FEEL_LABELS,
} from "@/lib/wear-logs/labels";
import type {
  WearLogFeedbackTag,
  WearLogOverallRating,
  WearLogRecord,
  WearLogTemperatureFeel,
} from "@/types/wear-logs";

type WearLogReflectionFormProps = {
  wearLog: WearLogRecord;
};

const TAG_SECTIONS: Array<{
  title: string;
  description: string;
  tags: readonly WearLogFeedbackTag[];
}> = [
  {
    title: "よかったこと",
    description: "快適さやその日の予定に合っていた点を残します。",
    tags: WEAR_LOG_FEEDBACK_TAG_GROUPS.positives,
  },
  {
    title: "気になったこと",
    description: "時間帯や天候・室内環境で気になった点を残します。",
    tags: [
      ...WEAR_LOG_FEEDBACK_TAG_GROUPS.timeOfDay,
      ...WEAR_LOG_FEEDBACK_TAG_GROUPS.weatherEnvironment,
    ],
  },
  {
    title: "TPO・見た目",
    description: "場面への合い方、色合わせ、気分との相性を残します。",
    tags: WEAR_LOG_FEEDBACK_TAG_GROUPS.tpoAppearance,
  },
];

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

function toggleTag(
  tags: WearLogFeedbackTag[],
  tag: WearLogFeedbackTag,
): WearLogFeedbackTag[] {
  return tags.includes(tag)
    ? tags.filter((current) => current !== tag)
    : [...tags, tag];
}

function TemperatureFeelSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: WearLogTemperatureFeel | null;
  onChange: (value: WearLogTemperatureFeel | null) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value
              ? (event.target.value as WearLogTemperatureFeel)
              : null,
          )
        }
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="">未選択</option>
        {Object.entries(WEAR_LOG_TEMPERATURE_FEEL_LABELS).map(
          ([key, labelText]) => (
            <option key={key} value={key}>
              {labelText}
            </option>
          ),
        )}
      </select>
    </label>
  );
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
          <div>
            <p className="text-sm font-medium text-gray-700">総合評価</p>
            <div
              className="mt-2 flex flex-wrap gap-2"
              data-testid="reflection-overall-rating"
            >
              {Object.entries(WEAR_LOG_OVERALL_RATING_LABELS).map(
                ([key, label]) => {
                  const rating = key as WearLogOverallRating;
                  const isSelected = overallRating === rating;

                  return (
                    <button
                      key={rating}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setOverallRating(isSelected ? null : rating)
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TemperatureFeelSelect
              id="reflection-outdoor-temperature-feel"
              label="屋外の温度感"
              value={outdoorTemperatureFeel}
              onChange={setOutdoorTemperatureFeel}
            />
            <TemperatureFeelSelect
              id="reflection-indoor-temperature-feel"
              label="屋内の温度感"
              value={indoorTemperatureFeel}
              onChange={setIndoorTemperatureFeel}
            />
          </div>

          {TAG_SECTIONS.map((section) => (
            <div key={section.title}>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {section.title}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {section.description}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {section.tags.map((tag) => {
                  const isSelected = feedbackTags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setFeedbackTags((current) => toggleTag(current, tag))
                      }
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {getWearLogFeedbackTagLabel(tag)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              振り返りメモ
            </span>
            <textarea
              value={feedbackMemo}
              onChange={(event) => setFeedbackMemo(event.target.value)}
              rows={5}
              placeholder="例: 室内は少し寒かった、色合わせがよかった"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

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
