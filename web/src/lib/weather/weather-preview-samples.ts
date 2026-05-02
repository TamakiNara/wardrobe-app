import type { WeatherCode } from "@/types/weather";

export type WeatherPreviewSample = {
  rawWeatherText: string;
  weatherCode: WeatherCode;
};

export const WEATHER_PREVIEW_SAMPLES: readonly WeatherPreviewSample[] = [
  { rawWeatherText: "晴れ", weatherCode: "sunny" },
  { rawWeatherText: "くもり", weatherCode: "cloudy" },
  { rawWeatherText: "雨", weatherCode: "rain" },
  { rawWeatherText: "雪", weatherCode: "snow" },
  {
    rawWeatherText: "晴れ　夜のはじめ頃　くもり",
    weatherCode: "sunny_then_cloudy",
  },
  {
    rawWeatherText: "晴れ 夕方 から くもり",
    weatherCode: "sunny_then_cloudy",
  },
  {
    rawWeatherText: "くもり 昼過ぎ から 晴れ",
    weatherCode: "cloudy_then_sunny",
  },
  {
    rawWeatherText: "くもり 夕方 から 雨",
    weatherCode: "cloudy_then_rain",
  },
  {
    rawWeatherText: "雨 昼過ぎ から くもり",
    weatherCode: "rain_then_cloudy",
  },
  {
    rawWeatherText: "晴れ 一時 雨",
    weatherCode: "sunny_with_occasional_rain",
  },
  {
    rawWeatherText: "くもり 一時 雨",
    weatherCode: "cloudy_with_occasional_rain",
  },
  { rawWeatherText: "雷", weatherCode: "thunder" },
  { rawWeatherText: "霧", weatherCode: "fog" },
  { rawWeatherText: "強風", weatherCode: "windy" },
  { rawWeatherText: "雨か雪", weatherCode: "other" },
  { rawWeatherText: "雪時々雨", weatherCode: "other" },
  { rawWeatherText: "くもり一時雪", weatherCode: "other" },
  { rawWeatherText: "晴れ一時雪", weatherCode: "other" },
] as const;

export function normalizeWeatherPreviewText(text: string): string {
  return text
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
