import type { WeatherCode } from "@/types/weather";

export type OpenMeteoWmoMeaning = {
  code: number;
  meaning: string;
};

export const OPEN_METEO_WMO_MEANINGS: readonly OpenMeteoWmoMeaning[] = [
  { code: 0, meaning: "Clear sky" },
  { code: 1, meaning: "Mainly clear" },
  { code: 2, meaning: "Partly cloudy" },
  { code: 3, meaning: "Overcast" },
  { code: 45, meaning: "Fog" },
  { code: 48, meaning: "Depositing rime fog" },
  { code: 51, meaning: "Light drizzle" },
  { code: 53, meaning: "Moderate drizzle" },
  { code: 55, meaning: "Dense drizzle" },
  { code: 61, meaning: "Slight rain" },
  { code: 63, meaning: "Moderate rain" },
  { code: 65, meaning: "Heavy rain" },
  { code: 71, meaning: "Slight snow fall" },
  { code: 73, meaning: "Moderate snow fall" },
  { code: 75, meaning: "Heavy snow fall" },
  { code: 77, meaning: "Snow grains" },
  { code: 80, meaning: "Slight rain showers" },
  { code: 81, meaning: "Moderate rain showers" },
  { code: 82, meaning: "Violent rain showers" },
  { code: 85, meaning: "Slight snow showers" },
  { code: 86, meaning: "Heavy snow showers" },
  { code: 95, meaning: "Thunderstorm" },
  { code: 96, meaning: "Thunderstorm with slight hail" },
  { code: 99, meaning: "Thunderstorm with heavy hail" },
] as const;

export function normalizeOpenMeteoWeatherCodeToWeatherCode(
  weatherCode: number | string | null | undefined,
): WeatherCode {
  const parsed =
    typeof weatherCode === "string" && weatherCode.trim() !== ""
      ? Number(weatherCode)
      : weatherCode;

  if (!Number.isInteger(parsed)) {
    return "other";
  }

  switch (parsed) {
    case 0:
    case 1:
      return "sunny";
    case 2:
    case 3:
      return "cloudy";
    case 45:
    case 48:
      return "fog";
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return "rain";
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return "snow";
    case 95:
    case 96:
    case 99:
      return "thunder";
    default:
      return "other";
  }
}
