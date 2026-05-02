import { getWeatherCodeDefinition } from "@/lib/weather/weather-code-definitions";
import type { WeatherCode } from "@/types/weather";

const MAIN_ICON_TONE_CLASS_NAMES = {
  sunny: "bg-amber-50 text-amber-700",
  cloudy: "bg-slate-100 text-slate-700",
  rain: "bg-sky-100 text-sky-700",
  snow: "bg-cyan-50 text-cyan-700",
  thunder: "bg-violet-50 text-violet-700",
  fog: "bg-slate-100 text-slate-600",
  windy: "bg-sky-50 text-sky-700",
  other: "bg-slate-100 text-slate-500",
} as const;

export const WEATHER_ACCESSORY_ICON_TONE_CLASS_NAME = "bg-sky-50 text-sky-700";

export function getWeatherMainIconToneClassName(code: WeatherCode): string {
  const definition = getWeatherCodeDefinition(code);

  return MAIN_ICON_TONE_CLASS_NAMES[definition.primaryWeather];
}
