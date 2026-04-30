import type {
  WearLogFeedbackTag,
  WearLogOverallRating,
  WearLogStatus,
  WearLogTemperatureFeel,
} from "@/types/wear-logs";

export const WEAR_LOG_STATUS_LABELS: Record<WearLogStatus, string> = {
  planned: "予定",
  worn: "着用済み",
};

const WEAR_LOG_STATUS_BADGE_CLASS_NAMES: Record<WearLogStatus, string> = {
  planned: "border-blue-200 bg-blue-50 text-blue-700",
  worn: "border-blue-600 bg-blue-600 text-white",
};

const WEAR_LOG_STATUS_DOT_CLASS_NAMES: Record<WearLogStatus, string> = {
  planned: "rounded-full border border-blue-300 bg-white",
  worn: "rounded-full bg-blue-600",
};

export function getWearLogStatusLabel(status: WearLogStatus): string {
  return WEAR_LOG_STATUS_LABELS[status];
}

export function getWearLogStatusBadgeClassName(status: WearLogStatus): string {
  return WEAR_LOG_STATUS_BADGE_CLASS_NAMES[status];
}

export function getWearLogStatusDotClassName(status: WearLogStatus): string {
  return WEAR_LOG_STATUS_DOT_CLASS_NAMES[status];
}

export const WEAR_LOG_TEMPERATURE_FEEL_LABELS: Record<
  WearLogTemperatureFeel,
  string
> = {
  cold: "寒い",
  slightly_cold: "少し寒い",
  comfortable: "ちょうどいい",
  slightly_hot: "少し暑い",
  hot: "暑い",
};

export const WEAR_LOG_OVERALL_RATING_LABELS: Record<
  WearLogOverallRating,
  string
> = {
  good: "よかった",
  neutral: "普通",
  bad: "微妙",
};

export const WEAR_LOG_FEEDBACK_TAG_LABELS: Record<WearLogFeedbackTag, string> =
  {
    comfortable_all_day: "一日快適だった",
    temperature_gap_ready: "寒暖差に対応できた",
    rain_ready: "雨でも問題なかった",
    morning_cold: "朝寒い",
    day_cold: "昼寒い",
    night_cold: "夜寒い",
    morning_hot: "朝暑い",
    day_hot: "昼暑い",
    night_hot: "夜暑い",
    rain_problem: "雨で困った",
    wind_problem: "風で困った",
    aircon_cold: "冷房で寒かった",
    heating_hot: "暖房で暑かった",
    worked_for_tpo: "TPOに合っていた",
    too_casual: "カジュアルすぎた",
    too_formal: "きちんとしすぎた",
    color_worked_well: "色合わせがよかった",
    color_mismatch: "色合わせが微妙だった",
    mood_matched: "気分に合っていた",
    mood_mismatch: "気分と合わなかった",
  };

export const WEAR_LOG_FEEDBACK_TAG_GROUPS = {
  positives: [
    "comfortable_all_day",
    "temperature_gap_ready",
    "rain_ready",
  ] satisfies WearLogFeedbackTag[],
  timeOfDay: [
    "morning_cold",
    "day_cold",
    "night_cold",
    "morning_hot",
    "day_hot",
    "night_hot",
  ] satisfies WearLogFeedbackTag[],
  weatherEnvironment: [
    "rain_problem",
    "wind_problem",
    "aircon_cold",
    "heating_hot",
  ] satisfies WearLogFeedbackTag[],
  tpoAppearance: [
    "worked_for_tpo",
    "too_casual",
    "too_formal",
    "color_worked_well",
    "color_mismatch",
    "mood_matched",
    "mood_mismatch",
  ] satisfies WearLogFeedbackTag[],
} as const;

const WEAR_LOG_FEEDBACK_TAG_ORDER: WearLogFeedbackTag[] = [
  ...WEAR_LOG_FEEDBACK_TAG_GROUPS.positives,
  ...WEAR_LOG_FEEDBACK_TAG_GROUPS.timeOfDay,
  ...WEAR_LOG_FEEDBACK_TAG_GROUPS.weatherEnvironment,
  ...WEAR_LOG_FEEDBACK_TAG_GROUPS.tpoAppearance,
];

export function getWearLogTemperatureFeelLabel(
  feel: WearLogTemperatureFeel,
): string {
  return WEAR_LOG_TEMPERATURE_FEEL_LABELS[feel];
}

export function getWearLogOverallRatingLabel(
  rating: WearLogOverallRating,
): string {
  return WEAR_LOG_OVERALL_RATING_LABELS[rating];
}

export function getWearLogOverallRatingBadgeClassName(
  rating: WearLogOverallRating,
): string {
  switch (rating) {
    case "good":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "neutral":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "bad":
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function getWearLogFeedbackTagLabel(tag: WearLogFeedbackTag): string {
  return WEAR_LOG_FEEDBACK_TAG_LABELS[tag];
}

export function isWearLogFeedbackTag(
  value: unknown,
): value is WearLogFeedbackTag {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(WEAR_LOG_FEEDBACK_TAG_LABELS, value)
  );
}

export function getWearLogFeedbackSummaryTags(
  tags: WearLogFeedbackTag[] | null | undefined,
  limit = 3,
): WearLogFeedbackTag[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  const tagSet = new Set(tags.filter((tag) => isWearLogFeedbackTag(tag)));

  return WEAR_LOG_FEEDBACK_TAG_ORDER.filter((tag) => tagSet.has(tag)).slice(
    0,
    limit,
  );
}

export function splitWearLogFeedbackTags(
  tags: WearLogFeedbackTag[] | null | undefined,
): {
  positives: WearLogFeedbackTag[];
  concerns: WearLogFeedbackTag[];
} {
  if (!tags || tags.length === 0) {
    return {
      positives: [],
      concerns: [],
    };
  }

  const positives = new Set<WearLogFeedbackTag>([
    ...WEAR_LOG_FEEDBACK_TAG_GROUPS.positives,
    "worked_for_tpo",
    "color_worked_well",
    "mood_matched",
  ]);
  const concerns = new Set<WearLogFeedbackTag>([
    ...WEAR_LOG_FEEDBACK_TAG_GROUPS.timeOfDay,
    ...WEAR_LOG_FEEDBACK_TAG_GROUPS.weatherEnvironment,
    "too_casual",
    "too_formal",
    "color_mismatch",
    "mood_mismatch",
  ]);

  return tags.reduce<{
    positives: WearLogFeedbackTag[];
    concerns: WearLogFeedbackTag[];
  }>(
    (carry, tag) => {
      if (!isWearLogFeedbackTag(tag)) {
        return carry;
      }

      if (positives.has(tag)) {
        carry.positives.push(tag);
      } else if (concerns.has(tag)) {
        carry.concerns.push(tag);
      }

      return carry;
    },
    {
      positives: [],
      concerns: [],
    },
  );
}
