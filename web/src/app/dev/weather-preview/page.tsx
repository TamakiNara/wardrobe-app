import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";
import WeatherGlyph from "@/components/weather/weather-glyph";
import {
  getWeatherCodeDefinition,
  WEATHER_CODE_DEFINITIONS,
} from "@/lib/weather/weather-code-definitions";
import {
  getWeatherCodeLabel,
  getWeatherPrimaryWeather,
  hasWeatherRainPossibility,
} from "@/lib/weather/labels";
import {
  normalizeWeatherPreviewText,
  OPEN_METEO_WEATHER_PREVIEW_SAMPLES,
  WEATHER_PREVIEW_SAMPLES,
} from "@/lib/weather/weather-preview-samples";
import {
  getWeatherMainIconToneClassName,
  WEATHER_ACCESSORY_ICON_TONE_CLASS_NAME,
} from "@/lib/weather/weather-visuals";

export const metadata = buildPageMetadata("天気表示プレビュー");

function InfoChip({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "amber" | "red";
}) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "red"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${toneClassName}`}
    >
      {children}
    </span>
  );
}

function WeatherIconCell({
  iconName,
  dataAttribute,
  toneClassName,
}: {
  iconName: string | null;
  dataAttribute: string;
  toneClassName?: string;
}) {
  if (!iconName) {
    return <span className="text-xs text-slate-400">-</span>;
  }

  return (
    <div className="inline-flex flex-col items-center gap-1 text-center">
      <span
        className={`inline-flex items-center justify-center rounded-full p-2 ${toneClassName ?? "bg-slate-100 text-slate-700"}`}
        {...{ [dataAttribute]: iconName }}
      >
        <WeatherGlyph
          name={iconName as Parameters<typeof WeatherGlyph>[0]["name"]}
          className="h-4 w-4"
        />
      </span>
      <span className="font-mono text-[11px] text-slate-500">{iconName}</span>
    </div>
  );
}

export default function WeatherPreviewPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-wide text-sky-700">
              Development Preview
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              天気表示・weather_code 確認
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              このページは開発確認用です。通常ナビには出さず、現在の
              weather_code 定義、Open-Meteo WMO code 変換、legacy / fallback の
              JMA 天気文変換結果をまとめて確認します。
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">
              weather_code 一覧
            </h2>
            <p className="text-sm text-slate-600">
              実際の weather_code 定義をそのまま表示しています。各アイコン列では
              Lucide の実アイコンと icon 名を並べて確認できます。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">weather_code</th>
                  <th className="px-3 py-3">表示名</th>
                  <th className="px-3 py-3">primary_weather</th>
                  <th className="px-3 py-3">has_rain_possibility</th>
                  <th className="px-3 py-3">メインアイコン / icon 名</th>
                  <th className="px-3 py-3">補助アイコン / icon 名</th>
                  <th className="px-3 py-3">fallback_icon / icon 名</th>
                  <th className="px-3 py-3">備考</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {WEATHER_CODE_DEFINITIONS.map((definition) => (
                  <tr
                    key={definition.code}
                    className={
                      definition.code === "other"
                        ? "bg-red-50/60"
                        : definition.hasRainPossibility
                          ? "bg-amber-50/40"
                          : "bg-white"
                    }
                  >
                    <td className="px-3 py-3 font-mono text-xs text-slate-700">
                      {definition.code}
                    </td>
                    <td className="px-3 py-3">{definition.label}</td>
                    <td className="px-3 py-3">{definition.primaryWeather}</td>
                    <td className="px-3 py-3">
                      <InfoChip
                        tone={definition.hasRainPossibility ? "amber" : "slate"}
                      >
                        {definition.hasRainPossibility ? "true" : "false"}
                      </InfoChip>
                    </td>
                    <td className="px-3 py-3">
                      <WeatherIconCell
                        iconName={definition.icon}
                        dataAttribute="data-main-icon"
                        toneClassName={getWeatherMainIconToneClassName(
                          definition.code,
                        )}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <WeatherIconCell
                        iconName={definition.accessoryIcon}
                        dataAttribute="data-accessory-icon"
                        toneClassName={WEATHER_ACCESSORY_ICON_TONE_CLASS_NAME}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <WeatherIconCell
                        iconName={definition.fallbackIcon}
                        dataAttribute="data-fallback-icon"
                        toneClassName="bg-slate-100 text-slate-600"
                      />
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {definition.code === "other" ? (
                        <InfoChip tone="red">未分類 fallback</InfoChip>
                      ) : definition.hasRainPossibility ? (
                        <div className="flex flex-col gap-1">
                          <InfoChip tone="amber">傘補助あり</InfoChip>
                          <span>メインは天気、青系の傘は雨対策の補助表示</span>
                        </div>
                      ) : definition.code === "cloudy" ? (
                        <span>weather_code は cloudy、アイコン名は Cloud</span>
                      ) : definition.code === "fog" ? (
                        <span>霧は fog として分け、CloudFog を使う</span>
                      ) : definition.code === "windy" ? (
                        <span>強風は windy として分け、Wind を使う</span>
                      ) : definition.code === "snow" ? (
                        <span>単独の雪は Snowflake を優先</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">
              Open-Meteo WMO code 変換
            </h2>
            <p className="text-sm text-slate-600">
              現在の本線で使う Open-Meteo / WMO weather code が、app の
              weather_code とアイコン表示へどう寄るかを確認します。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">WMO code</th>
                  <th className="px-3 py-3">Open-Meteo上の意味</th>
                  <th className="px-3 py-3">weather_code</th>
                  <th className="px-3 py-3">表示名</th>
                  <th className="px-3 py-3">アイコン / icon 名</th>
                  <th className="px-3 py-3">has_rain_possibility</th>
                  <th className="px-3 py-3">備考</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {OPEN_METEO_WEATHER_PREVIEW_SAMPLES.map((sample) => {
                  const definition = getWeatherCodeDefinition(
                    sample.weatherCode,
                  );
                  const rainPossibility = hasWeatherRainPossibility(
                    sample.weatherCode,
                  );

                  return (
                    <tr
                      key={`${sample.wmoCode}-${sample.weatherCode}`}
                      className={
                        sample.weatherCode === "other"
                          ? "bg-red-50/60"
                          : rainPossibility
                            ? "bg-amber-50/40"
                            : "bg-white"
                      }
                    >
                      <td className="px-3 py-3 font-mono text-xs text-slate-700">
                        {sample.wmoCode}
                      </td>
                      <td className="px-3 py-3">{sample.meaning}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-700">
                        {sample.weatherCode}
                      </td>
                      <td className="px-3 py-3">
                        {getWeatherCodeLabel(sample.weatherCode)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <WeatherIconCell
                            iconName={definition.icon}
                            dataAttribute="data-sample-main-icon"
                            toneClassName={getWeatherMainIconToneClassName(
                              sample.weatherCode,
                            )}
                          />
                          {definition.accessoryIcon ? (
                            <WeatherIconCell
                              iconName={definition.accessoryIcon}
                              dataAttribute="data-sample-accessory-icon"
                              toneClassName={
                                WEATHER_ACCESSORY_ICON_TONE_CLASS_NAME
                              }
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <InfoChip tone={rainPossibility ? "amber" : "slate"}>
                            {rainPossibility ? "true" : "false"}
                          </InfoChip>
                          {sample.weatherCode === "other" ? (
                            <InfoChip tone="red">other</InfoChip>
                          ) : null}
                          <span className="text-xs text-slate-500">
                            {getWeatherPrimaryWeather(sample.weatherCode)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {sample.wmoCode === 1 ? (
                          <span>Mainly clear は sunny に寄せる</span>
                        ) : sample.wmoCode === 2 ? (
                          <span>Partly cloudy は cloudy に寄せる</span>
                        ) : sample.wmoCode === 51 ? (
                          <span>drizzle は rain に寄せる</span>
                        ) : sample.wmoCode === 77 ? (
                          <span>snow grains は snow に寄せる</span>
                        ) : sample.wmoCode === 96 || sample.wmoCode === 99 ? (
                          <span>
                            hail 付き thunderstorm も thunder に寄せる
                          </span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">
              JMA天気文 変換（legacy / fallback）
            </h2>
            <p className="text-sm text-slate-600">
              JMA forecast JSON / tsukumijima fallback
              で使う天気文の正規化確認です。Open-Meteo
              移行後は補助的な確認用途として残します。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">raw_weather_text</th>
                  <th className="px-3 py-3">表示用整形後テキスト</th>
                  <th className="px-3 py-3">weather_code</th>
                  <th className="px-3 py-3">表示名</th>
                  <th className="px-3 py-3">アイコン / icon 名</th>
                  <th className="px-3 py-3">has_rain_possibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {WEATHER_PREVIEW_SAMPLES.map((sample) => {
                  const definition = getWeatherCodeDefinition(
                    sample.weatherCode,
                  );
                  const normalizedText = normalizeWeatherPreviewText(
                    sample.rawWeatherText,
                  );
                  const rainPossibility = hasWeatherRainPossibility(
                    sample.weatherCode,
                  );

                  return (
                    <tr
                      key={`${sample.rawWeatherText}-${sample.weatherCode}`}
                      className={
                        sample.weatherCode === "other"
                          ? "bg-red-50/60"
                          : rainPossibility
                            ? "bg-amber-50/40"
                            : "bg-white"
                      }
                    >
                      <td className="px-3 py-3">{sample.rawWeatherText}</td>
                      <td className="px-3 py-3">{normalizedText}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-700">
                        {sample.weatherCode}
                      </td>
                      <td className="px-3 py-3">
                        {getWeatherCodeLabel(sample.weatherCode)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <WeatherIconCell
                            iconName={definition.icon}
                            dataAttribute="data-sample-main-icon"
                            toneClassName={getWeatherMainIconToneClassName(
                              sample.weatherCode,
                            )}
                          />
                          {definition.accessoryIcon ? (
                            <WeatherIconCell
                              iconName={definition.accessoryIcon}
                              dataAttribute="data-sample-accessory-icon"
                              toneClassName={
                                WEATHER_ACCESSORY_ICON_TONE_CLASS_NAME
                              }
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <InfoChip tone={rainPossibility ? "amber" : "slate"}>
                            {rainPossibility ? "true" : "false"}
                          </InfoChip>
                          {sample.weatherCode === "other" ? (
                            <InfoChip tone="red">other</InfoChip>
                          ) : null}
                          <span className="text-xs text-slate-500">
                            {getWeatherPrimaryWeather(sample.weatherCode)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
