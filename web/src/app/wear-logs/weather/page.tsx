"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { FormPageHeader } from "@/components/shared/form-page-header";
import { ApiClientError } from "@/lib/api/client";
import {
  flattenValidationErrors,
  getUserFacingSubmitErrorMessage,
} from "@/lib/api/error-message";
import { fetchUserWeatherLocations } from "@/lib/api/settings";
import {
  createWeatherRecord,
  deleteWeatherRecord,
  fetchWeatherRecordsByDate,
  updateWeatherRecord,
} from "@/lib/api/weather";
import {
  buildWeatherRecordConditionSummary,
  formatJapaneseDate,
  getWeatherConditionLabel,
} from "@/lib/weather/labels";
import type { UserWeatherLocationRecord } from "@/types/settings";
import type {
  WeatherCondition,
  WeatherRecord,
  WeatherRecordUpsertPayload,
} from "@/types/weather";

const WEATHER_OPTIONS: WeatherCondition[] = [
  "sunny",
  "cloudy",
  "rain",
  "snow",
  "other",
];

function isValidDate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeTemperature(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeLocationName(value: string): string {
  return value.trim();
}

function getFirstValidationMessage(data: unknown, keys: string[]) {
  const errors = flattenValidationErrors(data);

  for (const key of keys) {
    if (errors[key]) {
      return errors[key];
    }
  }

  return null;
}

function buildReturnHref(date: string, returnTo: string | null) {
  if (returnTo) {
    return returnTo;
  }

  return `/wear-logs?month=${date.slice(0, 7)}`;
}

function formatWeatherPageTitle(date: string) {
  return `${formatJapaneseDate(date)}の天気`;
}

function sortLocations(locations: UserWeatherLocationRecord[]) {
  return [...locations].sort((a, b) => {
    if (a.is_default !== b.is_default) {
      return a.is_default ? -1 : 1;
    }
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }

    return a.id - b.id;
  });
}

function WearLogWeatherPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date");
  const returnTo = searchParams.get("returnTo");
  const validDate = isValidDate(date) ? date : null;
  const returnHref = buildReturnHref(
    validDate ?? new Date().toISOString().slice(0, 10),
    returnTo,
  );

  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<UserWeatherLocationRecord[]>([]);
  const [records, setRecords] = useState<WeatherRecord[]>([]);
  const [locationMode, setLocationMode] = useState<"saved" | "temporary">(
    "saved",
  );
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  );
  const [temporaryLocationName, setTemporaryLocationName] = useState("");
  const [saveTemporaryLocation, setSaveTemporaryLocation] = useState(false);
  const [weatherCondition, setWeatherCondition] =
    useState<WeatherCondition>("sunny");
  const [temperatureHigh, setTemperatureHigh] = useState("");
  const [temperatureLow, setTemperatureLow] = useState("");
  const [memo, setMemo] = useState("");
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const selectedRecord = useMemo(
    () =>
      editingRecordId === null
        ? null
        : (records.find((record) => record.id === editingRecordId) ?? null),
    [editingRecordId, records],
  );

  const resetDraft = useCallback(
    (
      nextLocations: UserWeatherLocationRecord[] = locations,
      nextMode: "saved" | "temporary" = locationMode,
    ) => {
      setEditingRecordId(null);
      setWeatherCondition("sunny");
      setTemperatureHigh("");
      setTemperatureLow("");
      setMemo("");
      setSaveTemporaryLocation(false);

      if (nextMode === "temporary") {
        setTemporaryLocationName("");
      } else {
        const defaultLocation =
          nextLocations.find((location) => location.is_default) ??
          nextLocations[0] ??
          null;
        setSelectedLocationId(defaultLocation?.id ?? null);
      }
    },
    [locationMode, locations],
  );

  const applyRecordToForm = useCallback((record: WeatherRecord) => {
    setEditingRecordId(record.id);
    if (record.location_id !== null) {
      setLocationMode("saved");
      setSelectedLocationId(record.location_id);
      setTemporaryLocationName("");
    } else {
      setLocationMode("temporary");
      setSelectedLocationId(null);
      setTemporaryLocationName(record.location_name);
    }

    setSaveTemporaryLocation(false);
    setWeatherCondition(record.weather_condition);
    setTemperatureHigh(
      record.temperature_high === null ? "" : String(record.temperature_high),
    );
    setTemperatureLow(
      record.temperature_low === null ? "" : String(record.temperature_low),
    );
    setMemo(record.memo ?? "");
  }, []);

  const loadPage = useCallback(async () => {
    if (!validDate) {
      setPageError("天気を登録する日付が不正です。");
      setLoading(false);
      return;
    }

    const [locationsResponse, recordsResponse] = await Promise.all([
      fetchUserWeatherLocations(),
      fetchWeatherRecordsByDate(validDate),
    ]);

    const nextLocations = sortLocations(locationsResponse.locations);
    setLocations(nextLocations);
    setRecords(recordsResponse.weatherRecords);

    const defaultLocation =
      nextLocations.find((location) => location.is_default) ??
      nextLocations[0] ??
      null;

    setSelectedLocationId((current) => {
      if (
        current !== null &&
        nextLocations.some((location) => location.id === current)
      ) {
        return current;
      }

      return defaultLocation?.id ?? null;
    });

    if (defaultLocation === null) {
      setLocationMode("temporary");
    }
  }, [validDate]);

  useEffect(() => {
    let active = true;

    loadPage()
      .catch((error) => {
        if (!active) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          router.push("/login");
          return;
        }

        setPageError(
          "天気情報を読み込めませんでした。時間をおいて再度お試しください。",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loadPage, router]);

  async function handleSubmit() {
    const normalizedTemporaryLocationName = normalizeLocationName(
      temporaryLocationName,
    );

    if (
      !validDate ||
      saving ||
      (locationMode === "saved" && selectedLocationId === null) ||
      (locationMode === "temporary" && normalizedTemporaryLocationName === "")
    ) {
      return;
    }

    setPageMessage(null);
    setPageError(null);
    setSaving(true);

    const payload: WeatherRecordUpsertPayload = {
      weather_date: validDate,
      location_id: locationMode === "saved" ? selectedLocationId : null,
      location_name:
        locationMode === "temporary" ? normalizedTemporaryLocationName : null,
      save_location:
        locationMode === "temporary" ? saveTemporaryLocation : undefined,
      weather_condition: weatherCondition,
      temperature_high: normalizeTemperature(temperatureHigh),
      temperature_low: normalizeTemperature(temperatureLow),
      memo: memo.trim() === "" ? null : memo.trim(),
    };

    try {
      if (selectedRecord) {
        await updateWeatherRecord(selectedRecord.id, payload);
        setPageMessage("天気情報を更新しました。");
      } else {
        await createWeatherRecord(payload);
        setPageMessage("天気情報を登録しました。");
      }

      const nextLocationsResponse = await fetchUserWeatherLocations();
      const nextRecordsResponse = await fetchWeatherRecordsByDate(validDate);
      const nextLocations = sortLocations(nextLocationsResponse.locations);

      setLocations(nextLocations);
      setRecords(nextRecordsResponse.weatherRecords);
      resetDraft(nextLocations);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setPageError(
          getFirstValidationMessage(error.data, [
            "location_id",
            "location_name",
            "weather_condition",
            "temperature_high",
            "temperature_low",
            "memo",
          ]) ??
            getUserFacingSubmitErrorMessage(
              error.data,
              "天気情報の保存に失敗しました。時間をおいて再度お試しください。",
            ),
        );
      } else {
        setPageError(
          "天気情報の保存に失敗しました。時間をおいて再度お試しください。",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record: WeatherRecord) {
    if (deletingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `「${record.location_name}」の天気を削除しますか？`,
    );

    if (!confirmed) {
      return;
    }

    setPageMessage(null);
    setPageError(null);
    setDeletingId(record.id);

    try {
      await deleteWeatherRecord(record.id);
      setPageMessage("天気情報を削除しました。");
      const nextLocations = sortLocations(locations);
      setRecords((current) =>
        current.filter((currentRecord) => currentRecord.id !== record.id),
      );
      resetDraft(nextLocations);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setPageError(
          getUserFacingSubmitErrorMessage(
            error.data,
            "天気情報の削除に失敗しました。時間をおいて再度お試しください。",
          ),
        );
      } else {
        setPageError(
          "天気情報の削除に失敗しました。時間をおいて再度お試しください。",
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <FormPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "着用履歴一覧", href: returnHref },
            { label: validDate ? formatWeatherPageTitle(validDate) : "天気" },
          ]}
          eyebrow="天気登録"
          title={validDate ? formatWeatherPageTitle(validDate) : "天気"}
          description="日付ごとの天気を地域別に手入力で登録します。"
          actions={
            <Link
              href={returnHref}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              カレンダーに戻る
            </Link>
          }
        />

        {loading ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">読み込み中です…</p>
          </section>
        ) : pageError && !validDate ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm text-red-700">{pageError}</p>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    天気を登録
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    同じ日付に複数地域の天気を登録できます。
                  </p>
                </div>
                <Link
                  href="/settings/weather-locations"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  地域設定へ
                </Link>
              </div>

              {pageMessage ? (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {pageMessage}
                </p>
              ) : null}

              {pageError && validDate ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {pageError}
                </p>
              ) : null}

              <form
                className="mt-5 space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSubmit();
                }}
              >
                <div className="space-y-3">
                  <span className="text-sm font-medium text-gray-700">
                    地域
                  </span>

                  <p className="text-sm text-gray-600">
                    普段使う地域は保存できます。旅行先などは今回だけ入力できます。
                  </p>

                  <div className="space-y-0">
                    <div
                      role="tablist"
                      aria-label="地域の選択方法"
                      className="relative z-10 -mb-px flex items-end gap-2 pl-4"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={locationMode === "saved"}
                        onClick={() => {
                          setLocationMode("saved");
                          setTemporaryLocationName("");
                          setSaveTemporaryLocation(false);
                          resetDraft(locations, "saved");
                        }}
                        className={`relative rounded-t-xl border px-4 py-3 text-left text-sm transition ${
                          locationMode === "saved"
                            ? "z-10 border-gray-300 border-b-white bg-white text-blue-950"
                            : "border-gray-300 bg-gray-50 text-gray-600 hover:bg-white/70"
                        }`}
                      >
                        <span className="block font-medium">
                          登録済みの地域
                        </span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={locationMode === "temporary"}
                        onClick={() => {
                          setLocationMode("temporary");
                          setSelectedLocationId(null);
                          setEditingRecordId(null);
                          resetDraft(locations, "temporary");
                        }}
                        className={`relative rounded-t-xl border px-4 py-3 text-left text-sm transition ${
                          locationMode === "temporary"
                            ? "z-10 border-gray-300 border-b-white bg-white text-blue-950"
                            : "border-gray-300 bg-gray-50 text-gray-600 hover:bg-white/70"
                        }`}
                      >
                        <span className="block font-medium">
                          今回だけの地域
                        </span>
                      </button>
                    </div>

                    {locationMode === "saved" ? (
                      locations.length > 0 ? (
                        <div
                          role="tabpanel"
                          className="rounded-2xl border border-gray-300 bg-white px-4 py-4"
                        >
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">
                              地域を選択
                            </span>
                            <select
                              id="weather-location"
                              value={selectedLocationId ?? ""}
                              onChange={(event) => {
                                const nextLocationId =
                                  Number(event.target.value) || null;
                                const matchedRecord =
                                  nextLocationId === null
                                    ? null
                                    : (records.find(
                                        (record) =>
                                          record.location_id === nextLocationId,
                                      ) ?? null);

                                setSelectedLocationId(nextLocationId);
                                if (matchedRecord) {
                                  applyRecordToForm(matchedRecord);
                                } else {
                                  resetDraft(locations);
                                  setSelectedLocationId(nextLocationId);
                                }
                              }}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                            >
                              {locations.map((location) => (
                                <option key={location.id} value={location.id}>
                                  {location.name}
                                  {location.is_default ? "（デフォルト）" : ""}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-gray-300 bg-white px-4 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            登録済みの地域がありません。
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            よく使う地域は地域設定から追加できます。
                          </p>
                          <Link
                            href="/settings/weather-locations"
                            className="mt-3 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            地域設定を開く
                          </Link>
                        </div>
                      )
                    ) : (
                      <div
                        role="tabpanel"
                        className="space-y-3 rounded-2xl border border-gray-300 bg-white px-4 py-4"
                      >
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-gray-700">
                            地域名
                          </span>
                          <input
                            id="temporary-weather-location"
                            value={temporaryLocationName}
                            onChange={(event) =>
                              setTemporaryLocationName(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                            placeholder="例: 秋田市 / 東京23区 / 横浜"
                          />
                        </label>
                        <div className="space-y-1 border-t border-gray-200 pt-4">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={saveTemporaryLocation}
                              onChange={(event) =>
                                setSaveTemporaryLocation(event.target.checked)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            次回からも使う
                          </label>
                          <p className="pl-6 text-xs text-gray-500">
                            オンにすると、次回から「登録済みの地域」で選べます。
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">
                      天気
                    </span>
                    <select
                      id="weather-condition"
                      value={weatherCondition}
                      onChange={(event) =>
                        setWeatherCondition(
                          event.target.value as WeatherCondition,
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    >
                      {WEATHER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {getWeatherConditionLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">
                      最高気温
                    </span>
                    <div className="relative">
                      <input
                        id="temperature-high"
                        type="number"
                        value={temperatureHigh}
                        onChange={(event) =>
                          setTemperatureHigh(event.target.value)
                        }
                        inputMode="decimal"
                        step="1"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900"
                        placeholder="例: 22"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                        ℃
                      </span>
                    </div>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">
                      最低気温
                    </span>
                    <div className="relative">
                      <input
                        id="temperature-low"
                        type="number"
                        value={temperatureLow}
                        onChange={(event) =>
                          setTemperatureLow(event.target.value)
                        }
                        inputMode="decimal"
                        step="1"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900"
                        placeholder="例: 13"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                        ℃
                      </span>
                    </div>
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">
                    メモ
                  </span>
                  <textarea
                    id="weather-memo"
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    placeholder="日差しが強かった、夕方は風があった、など"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      (locationMode === "saved" &&
                        selectedLocationId === null) ||
                      (locationMode === "temporary" &&
                        normalizeLocationName(temporaryLocationName) === "")
                    }
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {selectedRecord ? "天気を更新" : "天気を登録"}
                  </button>

                  {selectedRecord ? (
                    <>
                      <button
                        type="button"
                        disabled={deletingId === selectedRecord.id}
                        onClick={() => void handleDelete(selectedRecord)}
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        削除
                      </button>
                      <button
                        type="button"
                        onClick={() => resetDraft()}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        新しい天気を入力
                      </button>
                    </>
                  ) : null}
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  登録済みの天気
                </h2>
                {validDate ? (
                  <span className="text-sm text-gray-500">
                    {formatJapaneseDate(validDate)}
                  </span>
                ) : null}
              </div>

              {records.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className={`rounded-xl border px-4 py-3 ${
                        selectedRecord?.id === record.id
                          ? "border-blue-300 bg-blue-50/60"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {record.location_name}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {buildWeatherRecordConditionSummary(record)}
                          </p>
                          {(record.memo ?? "").trim() !== "" ? (
                            <p className="mt-1 text-sm text-gray-600">
                              メモ: {record.memo}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => applyRecordToForm(record)}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {selectedRecord?.id === record.id
                            ? "編集中"
                            : "この天気を編集"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-600">
                  まだ天気は登録されていません。
                </p>
              )}
            </section>

            {locations.length > 0 ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  登録済み地域
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {locations.map((location) => (
                    <span
                      key={location.id}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
                    >
                      {location.name}
                      {location.is_default ? "（デフォルト）" : ""}
                      {location.forecast_area_code
                        ? ` / ${location.forecast_area_code}`
                        : ""}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

export default function WearLogWeatherPage() {
  return (
    <Suspense fallback={null}>
      <WearLogWeatherPageContent />
    </Suspense>
  );
}
