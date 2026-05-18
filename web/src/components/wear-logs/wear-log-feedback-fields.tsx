"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { ChevronDown, ChevronUp, Frown, Meh, Smile } from "lucide-react";
import FieldLabel from "@/components/forms/field-label";
import {
  getWearLogFeedbackTagLabel,
  WEAR_LOG_FEEDBACK_TAG_GROUPS,
  WEAR_LOG_OVERALL_RATING_LABELS,
  WEAR_LOG_TEMPERATURE_FEEL_LABELS,
} from "@/lib/wear-logs/labels";
import type {
  WearLogFeedbackTag,
  WearLogOverallRating,
  WearLogTemperatureFeel,
} from "@/types/wear-logs";

type WearLogFeedbackFieldsProps = {
  overallRating: WearLogOverallRating | null;
  onOverallRatingChange: (nextValue: WearLogOverallRating | null) => void;
  outdoorTemperatureFeel: WearLogTemperatureFeel | null;
  onOutdoorTemperatureFeelChange: (
    nextValue: WearLogTemperatureFeel | null,
  ) => void;
  indoorTemperatureFeel: WearLogTemperatureFeel | null;
  onIndoorTemperatureFeelChange: (
    nextValue: WearLogTemperatureFeel | null,
  ) => void;
  feedbackTags: WearLogFeedbackTag[];
  onFeedbackTagsChange: Dispatch<SetStateAction<WearLogFeedbackTag[]>>;
  feedbackMemo: string;
  onFeedbackMemoChange: (nextValue: string) => void;
};

const TEMPERATURE_FEEL_OPTIONS: WearLogTemperatureFeel[] = [
  "cold",
  "slightly_cold",
  "comfortable",
  "slightly_hot",
  "hot",
];

const TEMPERATURE_FEEL_POSITION_MAP: Record<WearLogTemperatureFeel, number> = {
  cold: 0,
  slightly_cold: 1,
  comfortable: 2,
  slightly_hot: 3,
  hot: 4,
};

const TIME_OF_DAY_FEEDBACK_ROWS = [
  {
    label: "朝",
    cold: "morning_cold",
    hot: "morning_hot",
  },
  {
    label: "昼",
    cold: "day_cold",
    hot: "day_hot",
  },
  {
    label: "夜",
    cold: "night_cold",
    hot: "night_hot",
  },
] as const satisfies Array<{
  label: string;
  cold: WearLogFeedbackTag;
  hot: WearLogFeedbackTag;
}>;

const FEEDBACK_GROUP_SECTION_CLASS_NAME =
  "space-y-3 rounded-lg border border-gray-200 bg-white/80 p-4";

function TemperatureFeelSlider({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: WearLogTemperatureFeel | null;
  onChange: (nextValue: WearLogTemperatureFeel | null) => void;
}) {
  const selectedValue = value ?? "comfortable";
  const sliderValue = TEMPERATURE_FEEL_POSITION_MAP[selectedValue];
  const currentLabel = WEAR_LOG_TEMPERATURE_FEEL_LABELS[selectedValue];

  return (
    <div className="space-y-2" data-testid={name}>
      <FieldLabel as="div" label={label} />

      <div className="space-y-2">
        <div className="flex items-center justify-center text-xs font-medium text-slate-600">
          <span className="rounded-md border border-slate-200 bg-white/90 px-2.5 py-1 shadow-sm">
            {currentLabel}
          </span>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#b9d2f6_0%,#dbe7fa_24%,#f8fafc_50%,#f6dfd8_76%,#ebb8ac_100%)] shadow-inner" />
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={sliderValue}
            onChange={(event) =>
              onChange(
                TEMPERATURE_FEEL_OPTIONS[
                  Number.parseInt(event.target.value, 10)
                ] ?? null,
              )
            }
            className="relative z-10 h-7 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-300 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-300 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
          />
        </div>
        <div className="grid grid-cols-3 text-[11px] text-gray-500">
          <span className="justify-self-start whitespace-nowrap">寒い</span>
          <span className="justify-self-center whitespace-nowrap">
            ちょうどいい
          </span>
          <span className="justify-self-end whitespace-nowrap">暑い</span>
        </div>
      </div>
    </div>
  );
}

function OverallRatingButtons({
  value,
  onChange,
}: {
  value: WearLogOverallRating | null;
  onChange: (nextValue: WearLogOverallRating | null) => void;
}) {
  const options: Array<{
    value: WearLogOverallRating;
    label: string;
    Icon: typeof Smile;
    activeClassName: string;
    inactiveClassName: string;
  }> = [
    {
      value: "good",
      label: WEAR_LOG_OVERALL_RATING_LABELS.good,
      Icon: Smile,
      activeClassName:
        "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm",
      inactiveClassName:
        "border-gray-200 bg-white text-slate-600 hover:bg-slate-50",
    },
    {
      value: "neutral",
      label: WEAR_LOG_OVERALL_RATING_LABELS.neutral,
      Icon: Meh,
      activeClassName: "border-slate-500 bg-slate-100 text-slate-700 shadow-sm",
      inactiveClassName:
        "border-gray-200 bg-white text-slate-600 hover:bg-slate-50",
    },
    {
      value: "bad",
      label: WEAR_LOG_OVERALL_RATING_LABELS.bad,
      Icon: Frown,
      activeClassName: "border-amber-500 bg-amber-50 text-amber-700 shadow-sm",
      inactiveClassName:
        "border-gray-200 bg-white text-slate-600 hover:bg-slate-50",
    },
  ];

  return (
    <div className="space-y-2" data-testid="overall-rating">
      <FieldLabel as="div" label="総合評価" />
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.value;
          const Icon = option.Icon;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : option.value)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${
                selected ? option.activeClassName : option.inactiveClassName
              }`}
            >
              <Icon className={`h-4 w-4 ${selected ? "" : "text-slate-500"}`} />
              <span className={selected ? "font-semibold" : "font-medium"}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function WearLogFeedbackFields({
  overallRating,
  onOverallRatingChange,
  outdoorTemperatureFeel,
  onOutdoorTemperatureFeelChange,
  indoorTemperatureFeel,
  onIndoorTemperatureFeelChange,
  feedbackTags,
  onFeedbackTagsChange,
  feedbackMemo,
  onFeedbackMemoChange,
}: WearLogFeedbackFieldsProps) {
  const [showConcernFeedback, setShowConcernFeedback] = useState(false);

  function toggleFeedbackTag(tag: WearLogFeedbackTag) {
    onFeedbackTagsChange((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((current) => current !== tag)
        : [...currentTags, tag],
    );
  }

  function replaceExclusiveFeedbackTags(
    tags: WearLogFeedbackTag[],
    nextTag: WearLogFeedbackTag | null,
  ) {
    onFeedbackTagsChange((currentTags) => [
      ...currentTags.filter((tag) => !tags.includes(tag)),
      ...(nextTag ? [nextTag] : []),
    ]);
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <OverallRatingButtons
            value={overallRating}
            onChange={onOverallRatingChange}
          />
        </div>
        <TemperatureFeelSlider
          name="outdoor-temperature-feel"
          label="屋外の温度感"
          value={outdoorTemperatureFeel}
          onChange={onOutdoorTemperatureFeelChange}
        />
        <TemperatureFeelSlider
          name="indoor-temperature-feel"
          label="屋内の温度感"
          value={indoorTemperatureFeel}
          onChange={onIndoorTemperatureFeelChange}
        />
      </div>

      <div className="space-y-4">
        <section className={FEEDBACK_GROUP_SECTION_CLASS_NAME}>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-900">
              よかったこと
            </h3>
            <p className="text-xs text-gray-500">
              特に印象がよかった点だけ残します。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {WEAR_LOG_FEEDBACK_TAG_GROUPS.positives.map((tag) => {
              const selected = feedbackTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleFeedbackTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    selected
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  {getWearLogFeedbackTagLabel(tag)}
                </button>
              );
            })}
          </div>
        </section>

        <section className={FEEDBACK_GROUP_SECTION_CLASS_NAME}>
          <button
            type="button"
            aria-expanded={showConcernFeedback}
            onClick={() => setShowConcernFeedback((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">
                気になったこと
              </h3>
              <p className="text-xs text-gray-500">
                必要なときだけ開いて記録します。
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {showConcernFeedback ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>

          {showConcernFeedback ? (
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">時間帯</p>
                <div className="grid gap-3 md:grid-cols-3 md:justify-items-center">
                  {TIME_OF_DAY_FEEDBACK_ROWS.map((row) => {
                    const selectedTag = feedbackTags.includes(row.cold)
                      ? row.cold
                      : feedbackTags.includes(row.hot)
                        ? row.hot
                        : null;

                    return (
                      <div
                        key={row.cold}
                        className="flex flex-wrap items-center justify-center gap-2 px-1 py-1 md:justify-center"
                      >
                        <p className="text-sm font-medium text-gray-700">
                          {row.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { tag: row.cold, label: "寒い" },
                            { tag: row.hot, label: "暑い" },
                          ].map((option) => {
                            const selected = selectedTag === option.tag;

                            return (
                              <button
                                key={option.tag}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                  replaceExclusiveFeedbackTags(
                                    [row.cold, row.hot],
                                    selected ? null : option.tag,
                                  )
                                }
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition sm:text-sm ${
                                  selected
                                    ? option.tag === row.cold
                                      ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm"
                                      : "border-rose-500 bg-rose-50 text-rose-700 shadow-sm"
                                    : option.tag === row.cold
                                      ? "border-gray-300 bg-white text-gray-700 hover:border-sky-300 hover:text-sky-700"
                                      : "border-gray-300 bg-white text-gray-700 hover:border-rose-300 hover:text-rose-700"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">天気・環境</p>
                <div className="flex flex-wrap gap-2">
                  {WEAR_LOG_FEEDBACK_TAG_GROUPS.weatherEnvironment.map(
                    (tag) => {
                      const selected = feedbackTags.includes(tag);

                      return (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleFeedbackTag(tag)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                            selected
                              ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                              : "border-gray-300 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-700"
                          }`}
                        >
                          {getWearLogFeedbackTagLabel(tag)}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className={FEEDBACK_GROUP_SECTION_CLASS_NAME}>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-900">TPO・見た目</h3>
            <p className="text-xs text-gray-500">
              場面や見た目の印象を振り返ります。
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="min-w-20 text-sm font-medium text-gray-700">TPO</p>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    tag: "too_casual" as const,
                    label: "カジュアルすぎた",
                  },
                  {
                    tag: "worked_for_tpo" as const,
                    label: "合っていた",
                  },
                  {
                    tag: "too_formal" as const,
                    label: "きちんとしすぎた",
                  },
                ].map((option) => {
                  const selected = feedbackTags.includes(option.tag);

                  return (
                    <button
                      key={option.tag}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        replaceExclusiveFeedbackTags(
                          ["too_casual", "worked_for_tpo", "too_formal"],
                          selected ? null : option.tag,
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        selected
                          ? option.tag === "worked_for_tpo"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                            : "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                          : option.tag === "worked_for_tpo"
                            ? "border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="min-w-20 text-sm font-medium text-gray-700">
                色合わせ
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    tag: "color_worked_well" as const,
                    label: "よかった",
                  },
                  {
                    tag: "color_mismatch" as const,
                    label: "微妙だった",
                  },
                ].map((option) => {
                  const selected = feedbackTags.includes(option.tag);

                  return (
                    <button
                      key={option.tag}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        replaceExclusiveFeedbackTags(
                          ["color_mismatch", "color_worked_well"],
                          selected ? null : option.tag,
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        selected
                          ? option.tag === "color_worked_well"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                            : "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                          : option.tag === "color_worked_well"
                            ? "border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="min-w-20 text-sm font-medium text-gray-700">気分</p>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    tag: "mood_matched" as const,
                    label: "気分に合っていた",
                  },
                  {
                    tag: "mood_mismatch" as const,
                    label: "気分と合わなかった",
                  },
                ].map((option) => {
                  const selected = feedbackTags.includes(option.tag);

                  return (
                    <button
                      key={option.tag}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        replaceExclusiveFeedbackTags(
                          ["mood_matched", "mood_mismatch"],
                          selected ? null : option.tag,
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        selected
                          ? option.tag === "mood_matched"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                            : "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                          : option.tag === "mood_matched"
                            ? "border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-2">
        <FieldLabel as="div" label="振り返りメモ" />
        <p className="text-xs text-gray-500">
          実際に着て感じたことをメモできます。
        </p>
        <textarea
          rows={4}
          value={feedbackMemo}
          onChange={(event) => onFeedbackMemoChange(event.target.value)}
          placeholder="例: 室内は少し寒かった、色合わせがよかった"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </>
  );
}
