import type { WeatherCondition, WeatherRecord } from "@/types/weather";

export const WEATHER_CONDITION_LABELS: Record<WeatherCondition, string> = {
  sunny: "晴れ",
  cloudy: "くもり",
  rain: "雨",
  snow: "雪",
  other: "その他",
};

export function getWeatherConditionLabel(condition: WeatherCondition): string {
  return WEATHER_CONDITION_LABELS[condition];
}

export function formatWeatherTemperature(value: number | null): string | null {
  if (value === null) {
    return null;
  }

  return `${value}℃`;
}

export function formatJapaneseDate(date: string): string {
  const [year, month, day] = date.split("-").map((value) => Number(value));

  if (!year || !month || !day) {
    return date;
  }

  return `${year}年${month}月${day}日`;
}

export function buildWeatherRecordSummary(record: WeatherRecord): string {
  const parts = [
    record.location_name,
    buildWeatherRecordConditionSummary(record),
  ];

  return parts.join(" / ");
}

export function buildWeatherRecordConditionSummary(
  record: WeatherRecord,
): string {
  const parts = [getWeatherConditionLabel(record.weather_condition)];
  const high = formatWeatherTemperature(record.temperature_high);
  const low = formatWeatherTemperature(record.temperature_low);

  if (high || low) {
    parts.push(
      [high ? `最高${high}` : null, low ? `最低${low}` : null]
        .filter((part): part is string => Boolean(part))
        .join(" / "),
    );
  }

  return parts.join(" / ");
}
