import {
  getWeatherCodeDefinition,
  type PrimaryWeather,
} from "@/lib/weather/weather-code-definitions";
import type { WeatherCode, WeatherRecord } from "@/types/weather";

export function getWeatherCodeLabel(code: WeatherCode): string {
  return getWeatherCodeDefinition(code).label;
}

export function getWeatherPrimaryWeather(code: WeatherCode): PrimaryWeather {
  return getWeatherCodeDefinition(code).primaryWeather;
}

export function hasWeatherRainPossibility(code: WeatherCode): boolean {
  return getWeatherCodeDefinition(code).hasRainPossibility;
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
  const parts = [getWeatherCodeLabel(record.weather_code)];
  const high = formatWeatherTemperature(record.temperature_high);
  const low = formatWeatherTemperature(record.temperature_low);

  if (high || low) {
    parts.push(
      [high ? `最高 ${high}` : null, low ? `最低 ${low}` : null]
        .filter((part): part is string => Boolean(part))
        .join(" / "),
    );
  }

  return parts.join(" / ");
}
