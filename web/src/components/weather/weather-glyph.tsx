import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudSunRain,
  Snowflake,
  Sun,
  Umbrella,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";
import type { WeatherVisualIconName } from "@/lib/weather/weather-code-definitions";

const WEATHER_ICON_COMPONENTS: Record<WeatherVisualIconName, LucideIcon> = {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSunRain,
  CloudSnow,
  Snowflake,
  Umbrella,
};

export function resolveWeatherIcon(name: WeatherVisualIconName): LucideIcon {
  return WEATHER_ICON_COMPONENTS[name] ?? Cloud;
}

type WeatherGlyphProps = {
  name: WeatherVisualIconName;
  className?: string;
};

export default function WeatherGlyph({
  name,
  className = "h-4 w-4",
}: WeatherGlyphProps) {
  return createElement(resolveWeatherIcon(name), {
    className,
    "aria-hidden": true,
  });
}
