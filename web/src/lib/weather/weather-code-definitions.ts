export type PrimaryWeather =
  | "sunny"
  | "cloudy"
  | "rain"
  | "snow"
  | "thunder"
  | "fog"
  | "windy"
  | "other";

export type WeatherVisualIconName =
  | "Sun"
  | "Cloud"
  | "CloudSun"
  | "CloudRain"
  | "CloudLightning"
  | "CloudFog"
  | "CloudSunRain"
  | "CloudSnow"
  | "Snowflake"
  | "Umbrella"
  | "Wind"
  | "Zap";

export type WeatherCodeDefinition = {
  code: import("@/types/weather").WeatherCode;
  label: string;
  primaryWeather: PrimaryWeather;
  icon: WeatherVisualIconName;
  fallbackIcon: WeatherVisualIconName;
  hasRainPossibility: boolean;
  accessoryIcon: WeatherVisualIconName | null;
};

export const WEATHER_CODE_DEFINITIONS = [
  {
    code: "sunny",
    label: "晴れ",
    primaryWeather: "sunny",
    icon: "Sun",
    fallbackIcon: "Sun",
    hasRainPossibility: false,
    accessoryIcon: null,
  },
  {
    code: "cloudy",
    label: "くもり",
    primaryWeather: "cloudy",
    icon: "Cloud",
    fallbackIcon: "Cloud",
    hasRainPossibility: false,
    accessoryIcon: null,
  },
  {
    code: "rain",
    label: "雨",
    primaryWeather: "rain",
    icon: "CloudRain",
    fallbackIcon: "Cloud",
    hasRainPossibility: true,
    accessoryIcon: "Umbrella",
  },
  {
    code: "snow",
    label: "雪",
    primaryWeather: "snow",
    icon: "Snowflake",
    fallbackIcon: "CloudSnow",
    hasRainPossibility: false,
    accessoryIcon: null,
  },
  {
    code: "thunder",
    label: "雷",
    primaryWeather: "thunder",
    icon: "CloudLightning",
    fallbackIcon: "Zap",
    hasRainPossibility: true,
    accessoryIcon: "Umbrella",
  },
  {
    code: "fog",
    label: "霧",
    primaryWeather: "fog",
    icon: "CloudFog",
    fallbackIcon: "Cloud",
    hasRainPossibility: false,
    accessoryIcon: null,
  },
  {
    code: "windy",
    label: "強風",
    primaryWeather: "windy",
    icon: "Wind",
    fallbackIcon: "Cloud",
    hasRainPossibility: false,
    accessoryIcon: null,
  },
  {
    code: "other",
    label: "その他",
    primaryWeather: "other",
    icon: "Cloud",
    fallbackIcon: "Cloud",
    hasRainPossibility: false,
    accessoryIcon: null,
  },
  {
    code: "sunny_then_cloudy",
    label: "晴れのちくもり",
    primaryWeather: "sunny",
    icon: "CloudSun",
    fallbackIcon: "Sun",
    hasRainPossibility: false,
    accessoryIcon: null,
  },
  {
    code: "cloudy_then_sunny",
    label: "くもりのち晴れ",
    primaryWeather: "cloudy",
    icon: "CloudSun",
    fallbackIcon: "Cloud",
    hasRainPossibility: false,
    accessoryIcon: null,
  },
  {
    code: "cloudy_then_rain",
    label: "くもりのち雨",
    primaryWeather: "cloudy",
    icon: "CloudRain",
    fallbackIcon: "Cloud",
    hasRainPossibility: true,
    accessoryIcon: "Umbrella",
  },
  {
    code: "rain_then_cloudy",
    label: "雨のちくもり",
    primaryWeather: "rain",
    icon: "CloudRain",
    fallbackIcon: "Cloud",
    hasRainPossibility: true,
    accessoryIcon: "Umbrella",
  },
  {
    code: "sunny_with_occasional_clouds",
    label: "晴れ時々くもり",
    primaryWeather: "sunny",
    icon: "CloudSun",
    fallbackIcon: "Sun",
    hasRainPossibility: false,
    accessoryIcon: null,
  },
  {
    code: "cloudy_with_occasional_rain",
    label: "くもり時々雨",
    primaryWeather: "cloudy",
    icon: "CloudRain",
    fallbackIcon: "Cloud",
    hasRainPossibility: true,
    accessoryIcon: "Umbrella",
  },
  {
    code: "sunny_with_occasional_rain",
    label: "晴れ時々雨",
    primaryWeather: "sunny",
    icon: "CloudSunRain",
    fallbackIcon: "CloudRain",
    hasRainPossibility: true,
    accessoryIcon: "Umbrella",
  },
] as const satisfies readonly WeatherCodeDefinition[];

export function getWeatherCodeDefinition(
  code: import("@/types/weather").WeatherCode,
): WeatherCodeDefinition {
  const definition = WEATHER_CODE_DEFINITIONS.find(
    (entry) => entry.code === code,
  );

  if (!definition) {
    return WEATHER_CODE_DEFINITIONS.find((entry) => entry.code === "other")!;
  }

  return definition;
}
