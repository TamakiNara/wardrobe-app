import { buildWeatherRecordConditionSummary } from "@/lib/weather/labels";
import { getWeatherCodeDefinition } from "@/lib/weather/weather-code-definitions";
import type { WeatherRecord } from "@/types/weather";
import WeatherGlyph from "@/components/weather/weather-glyph";

type WeatherRecordSummaryProps = {
  record: WeatherRecord;
  summaryClassName?: string;
};

export default function WeatherRecordSummary({
  record,
  summaryClassName = "mt-1 text-sm text-gray-600",
}: WeatherRecordSummaryProps) {
  const definition = getWeatherCodeDefinition(record.weather_code);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2 text-gray-700">
        <span
          className="inline-flex items-center justify-center rounded-full bg-sky-50 p-1.5 text-sky-700"
          data-weather-icon={definition.icon}
          data-weather-code={record.weather_code}
        >
          <WeatherGlyph name={definition.icon} className="h-4 w-4" />
          <span className="sr-only">{definition.label}アイコン</span>
        </span>
        {definition.icon !== definition.fallbackIcon ? (
          <span
            className="sr-only"
            data-weather-fallback-icon={definition.fallbackIcon}
          >
            <WeatherGlyph name={definition.fallbackIcon} className="h-0 w-0" />
          </span>
        ) : null}
        {definition.accessoryIcon ? (
          <span
            className="inline-flex items-center justify-center rounded-full bg-amber-50 p-1.5 text-amber-700"
            data-weather-accessory-icon={definition.accessoryIcon}
            data-rain-possibility={
              definition.hasRainPossibility ? "true" : "false"
            }
          >
            <WeatherGlyph name={definition.accessoryIcon} className="h-4 w-4" />
            <span className="sr-only">雨対策の可能性あり</span>
          </span>
        ) : (
          <span className="sr-only" data-rain-possibility="false" />
        )}
      </div>
      <p className={summaryClassName}>
        {buildWeatherRecordConditionSummary(record)}
      </p>
    </div>
  );
}
