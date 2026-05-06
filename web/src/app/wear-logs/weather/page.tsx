"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormPageHeader } from "@/components/shared/form-page-header";
import WeatherRecordSummary from "@/components/weather/weather-record-summary";
import { ApiClientError } from "@/lib/api/client";
import { formatLocalDateYmd } from "@/lib/date/local-date";
import {
  flattenValidationErrors,
  getUserFacingSubmitErrorMessage,
} from "@/lib/api/error-message";
import { fetchUserWeatherLocations } from "@/lib/api/settings";
import {
  createWeatherRecord,
  deleteWeatherRecord,
  fetchWeatherForecast,
  fetchWeatherObserved,
  fetchWeatherRecordsByDate,
  updateWeatherRecord,
} from "@/lib/api/weather";
import { formatJapaneseDate, getWeatherCodeLabel } from "@/lib/weather/labels";
import { WEATHER_CODE_DEFINITIONS } from "@/lib/weather/weather-code-definitions";
import type { UserWeatherLocationRecord } from "@/types/settings";
import type {
  WeatherCode,
  WeatherForecast,
  WeatherObserved,
  WeatherRecord,
  WeatherRecordUpsertPayload,
  WeatherTimeBlockWeather,
} from "@/types/weather";

const WEATHER_OPTIONS: WeatherCode[] = WEATHER_CODE_DEFINITIONS.map(
  (definition) => definition.code,
);

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

type WeatherDateKind = "future" | "today" | "past";

function formatDateInTimeZoneYmd(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format date");
  }

  return `${year}-${month}-${day}`;
}

function getWeatherDateKind(
  weatherDate: string | null,
  timeZone = "Asia/Tokyo",
): WeatherDateKind | null {
  if (!weatherDate) {
    return null;
  }

  const today = formatDateInTimeZoneYmd(new Date(), timeZone);

  if (weatherDate > today) {
    return "future";
  }

  if (weatherDate < today) {
    return "past";
  }

  return "today";
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

function findSavedLocationRecord(
  records: WeatherRecord[],
  locationId: number | null,
) {
  if (locationId === null) {
    return null;
  }

  return records.find((record) => record.location_id === locationId) ?? null;
}

function hasOpenMeteoCoordinates(location: UserWeatherLocationRecord | null) {
  return location?.latitude !== null && location?.longitude !== null;
}

function hasIncompleteOpenMeteoCoordinates(
  location: UserWeatherLocationRecord | null,
) {
  const hasLatitude = location?.latitude !== null;
  const hasLongitude = location?.longitude !== null;

  return hasLatitude !== hasLongitude;
}

function getForecastDisabledReason(location: UserWeatherLocationRecord | null) {
  if (location === null) {
    return "地域を選択すると天気を取得できます。";
  }

  if (hasOpenMeteoCoordinates(location)) {
    return null;
  }

  if (hasIncompleteOpenMeteoCoordinates(location)) {
    return "位置情報の設定が不完全です。地域設定を確認してください。";
  }

  return "位置情報を設定すると、天気を取得できます。";
}

function getObservedDisabledReason(location: UserWeatherLocationRecord | null) {
  if (location === null) {
    return "地域を選択すると実績を取得できます。";
  }

  if (hasOpenMeteoCoordinates(location)) {
    return null;
  }

  if (hasIncompleteOpenMeteoCoordinates(location)) {
    return "位置情報の設定が不完全です。地域設定を確認してください。";
  }

  return "位置情報を設定すると、実績を取得できます。";
}

function getDateBasedFetchGuidance(dateKind: WeatherDateKind | null) {
  if (dateKind === "future") {
    return "未来日のため、実績データはまだ取得できません。";
  }

  if (dateKind === "today") {
    return "今日の実績は未確定の値を含む場合があります。必要に応じて翌日以降に再取得してください。";
  }

  if (dateKind === "past") {
    return "過去日は実績データの取得を推奨します。";
  }

  return null;
}

function WearLogWeatherPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date");
  const returnTo = searchParams.get("returnTo");
  const validDate = isValidDate(date) ? date : null;
  const returnHref = buildReturnHref(
    validDate ?? formatLocalDateYmd(),
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
  const [weatherCode, setWeatherCode] = useState<WeatherCode>("sunny");
  const [temperatureHigh, setTemperatureHigh] = useState("");
  const [temperatureLow, setTemperatureLow] = useState("");
  const [memo, setMemo] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [fetchingForecast, setFetchingForecast] = useState(false);
  const [fetchingObserved, setFetchingObserved] = useState(false);
  const [sourceType, setSourceType] = useState<
    "manual" | "forecast_api" | "historical_api"
  >("manual");
  const [sourceName, setSourceName] = useState("manual");
  const [sourceFetchedAt, setSourceFetchedAt] = useState<string | null>(null);
  const locationsRef = useRef<UserWeatherLocationRecord[]>([]);
  const locationModeRef = useRef<"saved" | "temporary">("saved");
  const [forecastRawTelop, setForecastRawTelop] = useState<string | null>(null);
  const [forecastSourceName, setForecastSourceName] = useState<string | null>(
    null,
  );
  const [, setForecastRawWeatherCode] = useState<number | null>(null);
  const [forecastPrecipitation, setForecastPrecipitation] = useState<
    number | null
  >(null);
  const [forecastRainSum, setForecastRainSum] = useState<number | null>(null);
  const [forecastSnowfallSum, setForecastSnowfallSum] = useState<number | null>(
    null,
  );
  const [forecastTimeBlockWeather, setForecastTimeBlockWeather] =
    useState<WeatherTimeBlockWeather | null>(null);
  const [forecastHasRainInTimeBlocks, setForecastHasRainInTimeBlocks] =
    useState(false);
  const [observedTimeBlockWeather, setObservedTimeBlockWeather] =
    useState<WeatherTimeBlockWeather | null>(null);
  const [observedHasRainInTimeBlocks, setObservedHasRainInTimeBlocks] =
    useState(false);
  const [observedSourceName, setObservedSourceName] = useState<string | null>(
    null,
  );
  const [, setObservedRawWeatherCode] = useState<number | null>(null);
  const [observedPrecipitation, setObservedPrecipitation] = useState<
    number | null
  >(null);
  const [observedRainSum, setObservedRainSum] = useState<number | null>(null);
  const [observedSnowfallSum, setObservedSnowfallSum] = useState<number | null>(
    null,
  );
  const [observedPrecipitationHours, setObservedPrecipitationHours] = useState<
    number | null
  >(null);

  const selectedRecord = useMemo(
    () =>
      editingRecordId === null
        ? null
        : (records.find((record) => record.id === editingRecordId) ?? null),
    [editingRecordId, records],
  );

  const selectedLocation = useMemo(
    () =>
      selectedLocationId === null
        ? null
        : (locations.find((location) => location.id === selectedLocationId) ??
          null),
    [locations, selectedLocationId],
  );
  const selectedSavedLocationRecord = useMemo(
    () => findSavedLocationRecord(records, selectedLocationId),
    [records, selectedLocationId],
  );
  const activeRecord = useMemo(() => {
    if (locationMode === "saved") {
      return selectedSavedLocationRecord;
    }

    return selectedRecord;
  }, [locationMode, selectedRecord, selectedSavedLocationRecord]);
  const weatherDateKind = useMemo(
    () => getWeatherDateKind(validDate),
    [validDate],
  );

  const forecastButtonDisabledReason = useMemo(() => {
    if (locationMode === "temporary") {
      return "今回だけの地域では天気取得は使えません。";
    }

    if (weatherDateKind === "past") {
      return "過去日は実績データの取得を推奨します。";
    }

    return getForecastDisabledReason(selectedLocation);
  }, [locationMode, selectedLocation, weatherDateKind]);

  const observedButtonDisabledReason = useMemo(() => {
    if (locationMode === "temporary") {
      return "今回だけの地域では実績取得は使えません。";
    }

    if (weatherDateKind === "future") {
      return "未来日のため、実績データはまだ取得できません。";
    }

    return getObservedDisabledReason(selectedLocation);
  }, [locationMode, selectedLocation, weatherDateKind]);

  const canFetchForecast =
    validDate !== null && forecastButtonDisabledReason === null;
  const canFetchObserved =
    validDate !== null && observedButtonDisabledReason === null;
  const showMissingForecastTemperatureMessage =
    forecastSourceName !== null &&
    temperatureHigh.trim() === "" &&
    temperatureLow.trim() === "";
  const showOpenMeteoForecastSummary =
    forecastSourceName === "open_meteo_jma_forecast";
  const hasForecastPrecipitationDetails =
    forecastPrecipitation !== null ||
    forecastRainSum !== null ||
    forecastSnowfallSum !== null;
  const hasForecastTimeBlockWeather = Boolean(
    forecastTimeBlockWeather?.morning ??
    forecastTimeBlockWeather?.daytime ??
    forecastTimeBlockWeather?.night,
  );
  const showOpenMeteoObservedSummary =
    observedSourceName === "open_meteo_historical";
  const hasObservedTimeBlockWeather = Boolean(
    observedTimeBlockWeather?.morning ??
    observedTimeBlockWeather?.daytime ??
    observedTimeBlockWeather?.night,
  );
  const hasObservedPrecipitationDetails =
    observedPrecipitation !== null ||
    observedRainSum !== null ||
    observedSnowfallSum !== null ||
    observedPrecipitationHours !== null;
  const dateBasedFetchGuidance = getDateBasedFetchGuidance(weatherDateKind);
  const forecastIsPrimary =
    weatherDateKind === "future" || weatherDateKind === "today";
  const observedIsPrimary = weatherDateKind === "past";

  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  useEffect(() => {
    locationModeRef.current = locationMode;
  }, [locationMode]);

  const resetDraft = useCallback(
    (
      nextLocations?: UserWeatherLocationRecord[],
      nextMode?: "saved" | "temporary",
    ) => {
      const resolvedLocations = nextLocations ?? locationsRef.current;
      const resolvedMode = nextMode ?? locationModeRef.current;

      setEditingRecordId(null);
      setWeatherCode("sunny");
      setTemperatureHigh("");
      setTemperatureLow("");
      setMemo("");
      setSaveTemporaryLocation(false);
      setSourceType("manual");
      setSourceName("manual");
      setSourceFetchedAt(null);
      setForecastRawTelop(null);
      setForecastSourceName(null);
      setForecastRawWeatherCode(null);
      setForecastPrecipitation(null);
      setForecastRainSum(null);
      setForecastSnowfallSum(null);
      setForecastTimeBlockWeather(null);
      setForecastHasRainInTimeBlocks(false);
      setObservedSourceName(null);
      setObservedTimeBlockWeather(null);
      setObservedHasRainInTimeBlocks(false);
      setObservedRawWeatherCode(null);
      setObservedPrecipitation(null);
      setObservedRainSum(null);
      setObservedSnowfallSum(null);
      setObservedPrecipitationHours(null);

      if (resolvedMode === "temporary") {
        setTemporaryLocationName("");
      } else {
        const defaultLocation =
          resolvedLocations.find((location) => location.is_default) ??
          resolvedLocations[0] ??
          null;
        setSelectedLocationId(defaultLocation?.id ?? null);
      }
    },
    [],
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
    setWeatherCode(record.weather_code);
    setTemperatureHigh(
      record.temperature_high === null ? "" : String(record.temperature_high),
    );
    setTemperatureLow(
      record.temperature_low === null ? "" : String(record.temperature_low),
    );
    setMemo(record.memo ?? "");
    setSourceType(record.source_type);
    setSourceName(record.source_name);
    setSourceFetchedAt(record.source_fetched_at);
    setForecastRawTelop(null);
    setForecastSourceName(null);
    setForecastRawWeatherCode(null);
    setForecastPrecipitation(null);
    setForecastRainSum(null);
    setForecastSnowfallSum(null);
    setForecastTimeBlockWeather(null);
    setForecastHasRainInTimeBlocks(false);
    setObservedSourceName(null);
    setObservedTimeBlockWeather(null);
    setObservedHasRainInTimeBlocks(false);
    setObservedRawWeatherCode(null);
    setObservedPrecipitation(null);
    setObservedRainSum(null);
    setObservedSnowfallSum(null);
    setObservedPrecipitationHours(null);
  }, []);

  const applyForecastToForm = useCallback((forecast: WeatherForecast) => {
    setWeatherCode(forecast.weather_code);
    setTemperatureHigh(
      forecast.temperature_high === null
        ? ""
        : String(forecast.temperature_high),
    );
    setTemperatureLow(
      forecast.temperature_low === null ? "" : String(forecast.temperature_low),
    );
    setSourceType(forecast.source_type);
    setSourceName(forecast.source_name);
    setSourceFetchedAt(forecast.source_fetched_at);
    setForecastRawTelop(forecast.raw_telop);
    setForecastSourceName(forecast.source_name);
    setForecastRawWeatherCode(forecast.raw_weather_code);
    setForecastPrecipitation(forecast.precipitation);
    setForecastRainSum(forecast.rain_sum);
    setForecastSnowfallSum(forecast.snowfall_sum);
    setForecastTimeBlockWeather(forecast.time_block_weather ?? null);
    setForecastHasRainInTimeBlocks(forecast.has_rain_in_time_blocks ?? false);
    setObservedSourceName(null);
    setObservedTimeBlockWeather(null);
    setObservedHasRainInTimeBlocks(false);
    setObservedRawWeatherCode(null);
    setObservedPrecipitation(null);
    setObservedRainSum(null);
    setObservedSnowfallSum(null);
    setObservedPrecipitationHours(null);
  }, []);

  const applyObservedToForm = useCallback((observed: WeatherObserved) => {
    setWeatherCode(observed.weather_code);
    setTemperatureHigh(
      observed.temperature_high === null
        ? ""
        : String(observed.temperature_high),
    );
    setTemperatureLow(
      observed.temperature_low === null ? "" : String(observed.temperature_low),
    );
    setSourceType(observed.source_type);
    setSourceName(observed.source_name);
    setSourceFetchedAt(observed.source_fetched_at);
    setForecastRawTelop(null);
    setForecastSourceName(null);
    setForecastRawWeatherCode(null);
    setForecastPrecipitation(null);
    setForecastRainSum(null);
    setForecastSnowfallSum(null);
    setForecastTimeBlockWeather(null);
    setForecastHasRainInTimeBlocks(false);
    setObservedSourceName(observed.source_name);
    setObservedTimeBlockWeather(observed.time_block_weather ?? null);
    setObservedHasRainInTimeBlocks(observed.has_rain_in_time_blocks ?? false);
    setObservedRawWeatherCode(observed.raw_weather_code);
    setObservedPrecipitation(observed.precipitation);
    setObservedRainSum(observed.rain_sum);
    setObservedSnowfallSum(observed.snowfall_sum);
    setObservedPrecipitationHours(observed.precipitation_hours);
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
    const nextRecords = recordsResponse.weatherRecords;
    setLocations(nextLocations);
    setRecords(nextRecords);

    const defaultLocation =
      nextLocations.find((location) => location.is_default) ??
      nextLocations[0] ??
      null;
    const nextSelectedLocationId = defaultLocation?.id ?? null;
    const matchedRecord = findSavedLocationRecord(
      nextRecords,
      nextSelectedLocationId,
    );

    if (matchedRecord) {
      applyRecordToForm(matchedRecord);
      return;
    }

    if (defaultLocation === null) {
      setLocationMode("temporary");
      resetDraft(nextLocations, "temporary");
      return;
    }

    setLocationMode("saved");
    resetDraft(nextLocations, "saved");
    setSelectedLocationId(nextSelectedLocationId);
  }, [applyRecordToForm, resetDraft, validDate]);

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

    setSaveMessage(null);
    setFetchMessage(null);
    setPageError(null);
    setSaving(true);

    const payload: WeatherRecordUpsertPayload = {
      weather_date: validDate,
      location_id: locationMode === "saved" ? selectedLocationId : null,
      location_name:
        locationMode === "temporary" ? normalizedTemporaryLocationName : null,
      save_location:
        locationMode === "temporary" ? saveTemporaryLocation : undefined,
      weather_code: weatherCode,
      temperature_high: normalizeTemperature(temperatureHigh),
      temperature_low: normalizeTemperature(temperatureLow),
      memo: memo.trim() === "" ? null : memo.trim(),
      source_type: sourceType,
      source_name: sourceName,
      source_fetched_at: sourceFetchedAt,
    };

    try {
      if (activeRecord) {
        await updateWeatherRecord(activeRecord.id, payload);
        setSaveMessage("天気情報を更新しました。");
      } else {
        await createWeatherRecord(payload);
        setSaveMessage("天気情報を登録しました。");
      }

      const nextLocationsResponse = await fetchUserWeatherLocations();
      const nextRecordsResponse = await fetchWeatherRecordsByDate(validDate);
      const nextLocations = sortLocations(nextLocationsResponse.locations);
      const nextRecords = nextRecordsResponse.weatherRecords;
      const preferredRecord =
        locationMode === "saved"
          ? findSavedLocationRecord(nextRecords, selectedLocationId)
          : activeRecord === null
            ? null
            : (nextRecords.find((record) => record.id === activeRecord.id) ??
              null);

      setLocations(nextLocations);
      setRecords(nextRecords);

      if (preferredRecord) {
        applyRecordToForm(preferredRecord);
      } else {
        resetDraft(nextLocations);
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        setPageError(
          getFirstValidationMessage(error.data, [
            "location_id",
            "location_name",
            "weather_code",
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

    setSaveMessage(null);
    setFetchMessage(null);
    setPageError(null);
    setDeletingId(record.id);

    try {
      await deleteWeatherRecord(record.id);
      setSaveMessage("天気情報を削除しました。");
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

  async function handleFetchForecast() {
    if (
      !validDate ||
      !canFetchForecast ||
      selectedLocationId === null ||
      fetchingForecast
    ) {
      return;
    }

    setSaveMessage(null);
    setFetchMessage(null);
    setPageError(null);
    setFetchingForecast(true);

    try {
      const response = await fetchWeatherForecast({
        weather_date: validDate,
        location_id: selectedLocationId,
      });

      applyForecastToForm(response.forecast);
      setFetchMessage(
        "予報データを取得しました。内容を確認して保存してください。",
      );
    } catch (error) {
      if (error instanceof ApiClientError) {
        setPageError(
          getFirstValidationMessage(error.data, [
            "location_id",
            "weather_date",
          ]) ??
            getUserFacingSubmitErrorMessage(
              error.data,
              "天気情報を取得できませんでした。手入力で登録できます。",
            ),
        );
      } else {
        setPageError("天気情報を取得できませんでした。手入力で登録できます。");
      }
    } finally {
      setFetchingForecast(false);
    }
  }

  async function handleFetchObserved() {
    if (
      !validDate ||
      !canFetchObserved ||
      selectedLocationId === null ||
      fetchingObserved
    ) {
      return;
    }

    setSaveMessage(null);
    setFetchMessage(null);
    setPageError(null);
    setFetchingObserved(true);

    try {
      const response = await fetchWeatherObserved({
        weather_date: validDate,
        location_id: selectedLocationId,
      });

      applyObservedToForm(response.observed);
      setFetchMessage(
        "実績データを取得しました。内容を確認して保存してください。",
      );
    } catch (error) {
      if (error instanceof ApiClientError) {
        setPageError(
          getFirstValidationMessage(error.data, [
            "location_id",
            "weather_date",
          ]) ??
            getUserFacingSubmitErrorMessage(
              error.data,
              "実績データを取得できませんでした。時間をおいて再度お試しください。",
            ),
        );
      } else {
        setPageError(
          "実績データを取得できませんでした。時間をおいて再度お試しください。",
        );
      }
    } finally {
      setFetchingObserved(false);
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
          description="日付ごとの天気を地域別に登録できます。取得結果をフォームに反映してから保存することもできます。"
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
                    {activeRecord ? "天気を更新" : "天気を登録"}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    {activeRecord
                      ? "選択中の地域に登録済みの天気を更新できます。"
                      : "同じ日付でも、地域ごとに別の天気を登録できます。"}
                  </p>
                </div>
                <Link
                  href="/settings/weather-locations"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  地域設定へ
                </Link>
              </div>

              {saveMessage ? (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {saveMessage}
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

                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">
                        天気データを取得
                      </p>
                      <p className="text-sm text-gray-600">
                        保存済み地域の設定を使って、予報または実績をフォームに反映できます。取得しても自動保存はされません。
                      </p>
                      <div className="flex flex-col gap-2 text-xs text-gray-500 md:flex-row md:gap-4">
                        <p>予報: これからの天気を取得します。</p>
                        <p>実績: 過去日の履歴データを取得します。</p>
                      </div>
                      {dateBasedFetchGuidance ? (
                        <p className="text-xs text-gray-600">
                          {dateBasedFetchGuidance}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 md:flex-row md:flex-wrap">
                      <button
                        type="button"
                        onClick={() => void handleFetchForecast()}
                        disabled={!canFetchForecast || fetchingForecast}
                        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${
                          forecastIsPrimary
                            ? "border border-sky-600 bg-sky-600 text-white hover:bg-sky-700 disabled:border-sky-200 disabled:bg-sky-100 disabled:text-sky-400"
                            : "border border-sky-200 bg-white text-sky-700 hover:bg-sky-50 disabled:border-sky-100 disabled:text-sky-300"
                        }`}
                      >
                        {fetchingForecast ? "取得中…" : "予報を取得"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleFetchObserved()}
                        disabled={!canFetchObserved || fetchingObserved}
                        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${
                          observedIsPrimary
                            ? "border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 disabled:border-emerald-200 disabled:bg-emerald-100 disabled:text-emerald-400"
                            : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 disabled:border-emerald-100 disabled:text-emerald-300"
                        }`}
                      >
                        {fetchingObserved ? "取得中…" : "実績を取得"}
                      </button>
                    </div>
                    {fetchMessage ? (
                      <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {fetchMessage}
                      </p>
                    ) : null}
                    <div className="mt-3 space-y-2 text-xs">
                      {forecastButtonDisabledReason ? (
                        <p className="text-sky-900/70">
                          予報取得: {forecastButtonDisabledReason}
                          {locationMode === "saved" &&
                          selectedLocationId !== null ? (
                            <>
                              {" "}
                              <Link
                                href="/settings/weather-locations"
                                className="font-medium text-sky-700 underline"
                              >
                                地域設定へ
                              </Link>
                            </>
                          ) : null}
                        </p>
                      ) : null}
                      {observedButtonDisabledReason ? (
                        <p className="text-emerald-900/70">
                          実績取得: {observedButtonDisabledReason}
                          {locationMode === "saved" &&
                          selectedLocationId !== null ? (
                            <>
                              {" "}
                              <Link
                                href="/settings/weather-locations"
                                className="font-medium text-emerald-700 underline"
                              >
                                地域設定へ
                              </Link>
                            </>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                  </div>

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
                          <p className="mt-2 text-xs text-gray-500">
                            予報区域を設定すると、天気を取得できます。
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
                      value={weatherCode}
                      onChange={(event) =>
                        setWeatherCode(event.target.value as WeatherCode)
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    >
                      {WEATHER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {getWeatherCodeLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {forecastRawTelop ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p>
                      取得した予報表記:{" "}
                      <span className="font-medium">{forecastRawTelop}</span>
                    </p>
                    {weatherCode === "other" ? (
                      <p className="mt-1 text-amber-800">
                        この表記は現在の weather_code
                        に変換できなかったため、「その他」として反映しています。
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {showOpenMeteoForecastSummary ? (
                  <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-slate-900">
                    <p className="text-sm font-medium text-sky-900">
                      取得した予報
                    </p>
                    <div className="mt-2 space-y-1">
                      <p>
                        代表天気:{" "}
                        <span className="font-medium">
                          {getWeatherCodeLabel(weatherCode)}
                        </span>
                      </p>
                      {hasForecastTimeBlockWeather ? (
                        <p className="leading-6">
                          時間帯: 朝{" "}
                          <span className="font-medium">
                            {forecastTimeBlockWeather?.morning
                              ? getWeatherCodeLabel(
                                  forecastTimeBlockWeather.morning,
                                )
                              : "未取得"}
                          </span>
                          {" / "}昼{" "}
                          <span className="font-medium">
                            {forecastTimeBlockWeather?.daytime
                              ? getWeatherCodeLabel(
                                  forecastTimeBlockWeather.daytime,
                                )
                              : "未取得"}
                          </span>
                          {" / "}夜{" "}
                          <span className="font-medium">
                            {forecastTimeBlockWeather?.night
                              ? getWeatherCodeLabel(
                                  forecastTimeBlockWeather.night,
                                )
                              : "未取得"}
                          </span>
                        </p>
                      ) : null}
                      {forecastHasRainInTimeBlocks ? (
                        <p className="text-xs text-sky-800">
                          雨の可能性があります
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      取得元: Open-Meteo Forecast
                    </p>
                  </div>
                ) : null}

                {hasForecastPrecipitationDetails ? (
                  <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-slate-800">
                    <p className="font-medium text-slate-900">降水参考</p>
                    <p className="mt-1 leading-6">
                      降水量{" "}
                      <span className="font-medium">
                        {forecastPrecipitation === null
                          ? "未取得"
                          : `${forecastPrecipitation} mm`}
                      </span>
                      {" / "}雨量{" "}
                      <span className="font-medium">
                        {forecastRainSum === null
                          ? "未取得"
                          : `${forecastRainSum} mm`}
                      </span>
                      {" / "}降雪量{" "}
                      <span className="font-medium">
                        {forecastSnowfallSum === null
                          ? "未取得"
                          : `${forecastSnowfallSum} cm`}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      参考値です。保存はまだ行いません。
                    </p>
                  </div>
                ) : null}

                {showOpenMeteoObservedSummary ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-slate-900">
                    <p className="text-sm font-medium text-emerald-900">
                      取得した実績
                    </p>
                    <div className="mt-2 space-y-1">
                      <p>
                        代表天気:{" "}
                        <span className="font-medium">
                          {getWeatherCodeLabel(weatherCode)}
                        </span>
                      </p>
                      {hasObservedTimeBlockWeather ? (
                        <p className="leading-6">
                          時間帯: 朝{" "}
                          <span className="font-medium">
                            {observedTimeBlockWeather?.morning
                              ? getWeatherCodeLabel(
                                  observedTimeBlockWeather.morning,
                                )
                              : "未取得"}
                          </span>
                          {" / "}昼{" "}
                          <span className="font-medium">
                            {observedTimeBlockWeather?.daytime
                              ? getWeatherCodeLabel(
                                  observedTimeBlockWeather.daytime,
                                )
                              : "未取得"}
                          </span>
                          {" / "}夜{" "}
                          <span className="font-medium">
                            {observedTimeBlockWeather?.night
                              ? getWeatherCodeLabel(
                                  observedTimeBlockWeather.night,
                                )
                              : "未取得"}
                          </span>
                        </p>
                      ) : null}
                      {observedHasRainInTimeBlocks ? (
                        <p className="text-xs text-emerald-800">
                          雨の可能性があります
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      取得元: Open-Meteo Historical
                    </p>
                  </div>
                ) : null}

                {hasObservedPrecipitationDetails ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-slate-800">
                    <p className="font-medium text-slate-900">降水参考</p>
                    <p className="mt-1 leading-6">
                      降水量{" "}
                      <span className="font-medium">
                        {observedPrecipitation === null
                          ? "未取得"
                          : `${observedPrecipitation} mm`}
                      </span>
                      {" / "}雨量{" "}
                      <span className="font-medium">
                        {observedRainSum === null
                          ? "未取得"
                          : `${observedRainSum} mm`}
                      </span>
                      {" / "}降雪量{" "}
                      <span className="font-medium">
                        {observedSnowfallSum === null
                          ? "未取得"
                          : `${observedSnowfallSum} cm`}
                      </span>
                      {" / "}降水時間{" "}
                      <span className="font-medium">
                        {observedPrecipitationHours === null
                          ? "未取得"
                          : `${observedPrecipitationHours} 時間`}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      参考値です。保存はまだ行いません。
                    </p>
                  </div>
                ) : null}

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

                {showMissingForecastTemperatureMessage ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    気温は取得できませんでした。必要に応じて手入力してください。
                  </p>
                ) : null}

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
                    {activeRecord ? "天気を更新" : "天気を登録"}
                  </button>

                  {activeRecord ? (
                    <>
                      <button
                        type="button"
                        disabled={deletingId === activeRecord.id}
                        onClick={() => void handleDelete(activeRecord)}
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
                        activeRecord?.id === record.id
                          ? "border-blue-300 bg-blue-50/60"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {record.location_name}
                          </p>
                          <WeatherRecordSummary record={record} />
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
                          {activeRecord?.id === record.id
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
