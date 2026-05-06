"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import {
  flattenValidationErrors,
  getUserFacingSubmitErrorMessage,
} from "@/lib/api/error-message";
import { SettingsBreadcrumbs } from "@/components/settings/settings-breadcrumbs";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { settingsActionIcons } from "@/lib/icons/settings-icons";
import {
  buildJmaForecastAreaOptionsWithFallback,
  findJmaForecastAreaByRegionCode,
} from "@/lib/weather/jma-forecast-areas";
import {
  createUserWeatherLocation,
  deleteUserWeatherLocation,
  fetchUserWeatherLocations,
  reorderUserWeatherLocations,
  searchWeatherLocationGeocode,
  updateUserWeatherLocation,
} from "@/lib/api/settings";
import type {
  UserWeatherLocationRecord,
  WeatherLocationGeocodeResult,
} from "@/types/settings";

function getFirstValidationMessage(data: unknown, keys: string[]) {
  const errors = flattenValidationErrors(data);

  for (const key of keys) {
    if (errors[key]) {
      return errors[key];
    }
  }

  return null;
}

function sortLocations(locations: UserWeatherLocationRecord[]) {
  return [...locations].sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }

    return a.id - b.id;
  });
}

function formatCoordinateField(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "";
  }

  return String(value);
}

function buildCoordinatePayload(
  latitudeText: string,
  longitudeText: string,
  timezoneText: string,
) {
  const normalizedLatitude = latitudeText.trim();
  const normalizedLongitude = longitudeText.trim();
  const normalizedTimezone = timezoneText.trim();

  return {
    latitude:
      normalizedLatitude === "" ? null : Number.parseFloat(normalizedLatitude),
    longitude:
      normalizedLongitude === ""
        ? null
        : Number.parseFloat(normalizedLongitude),
    timezone: normalizedTimezone === "" ? null : normalizedTimezone,
  };
}

function buildGeocodeResultLabel(result: WeatherLocationGeocodeResult) {
  return [result.name, result.admin1, result.country]
    .filter((value) => value && value.trim() !== "")
    .join(" / ");
}

function buildGeocodeResultKey(result: WeatherLocationGeocodeResult) {
  return `${result.name}-${result.latitude}-${result.longitude}-${result.timezone ?? ""}`;
}

function hasLegacyCodeFields(location: UserWeatherLocationRecord) {
  return Boolean(
    location.forecast_area_code ||
    location.jma_forecast_region_code ||
    location.jma_forecast_office_code,
  );
}

function SettingsWeatherLocationsPageContent() {
  const EditIcon = settingsActionIcons.edit;
  const MoveUpIcon = settingsActionIcons.moveUp;
  const MoveDownIcon = settingsActionIcons.moveDown;
  const router = useRouter();
  const [locations, setLocations] = useState<UserWeatherLocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newJmaRegionCode, setNewJmaRegionCode] = useState("");
  const [newLatitude, setNewLatitude] = useState("");
  const [newLongitude, setNewLongitude] = useState("");
  const [newTimezone, setNewTimezone] = useState("Asia/Tokyo");
  const [newGeocodeQuery, setNewGeocodeQuery] = useState("");
  const [newGeocodeResults, setNewGeocodeResults] = useState<
    WeatherLocationGeocodeResult[]
  >([]);
  const [newGeocodeError, setNewGeocodeError] = useState<string | null>(null);
  const [newGeocodeSearched, setNewGeocodeSearched] = useState(false);
  const [searchingNewGeocode, setSearchingNewGeocode] = useState(false);
  const [newSelectedGeocodeKey, setNewSelectedGeocodeKey] = useState<
    string | null
  >(null);
  const [newGeocodeMessage, setNewGeocodeMessage] = useState<string | null>(
    null,
  );
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editJmaRegionCode, setEditJmaRegionCode] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");
  const [editTimezone, setEditTimezone] = useState("Asia/Tokyo");
  const [editGeocodeQuery, setEditGeocodeQuery] = useState("");
  const [editGeocodeResults, setEditGeocodeResults] = useState<
    WeatherLocationGeocodeResult[]
  >([]);
  const [editGeocodeError, setEditGeocodeError] = useState<string | null>(null);
  const [editGeocodeSearched, setEditGeocodeSearched] = useState(false);
  const [searchingEditGeocode, setSearchingEditGeocode] = useState(false);
  const [editSelectedGeocodeKey, setEditSelectedGeocodeKey] = useState<
    string | null
  >(null);
  const [editGeocodeMessage, setEditGeocodeMessage] = useState<string | null>(
    null,
  );
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [showEditLegacyFields, setShowEditLegacyFields] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [expandedLegacyDetails, setExpandedLegacyDetails] = useState<
    Record<number, boolean>
  >({});

  const loadLocations = useCallback(async () => {
    const response = await fetchUserWeatherLocations();
    setLocations(response.locations);
  }, []);

  useEffect(() => {
    let active = true;

    loadLocations()
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiClientError && error.status === 401) {
          router.push("/login");
          return;
        }

        setLoadError(
          "天気の地域設定を読み込めませんでした。時間をおいて再度お試しください。",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadLocations, router]);

  const sortedLocations = useMemo(() => sortLocations(locations), [locations]);
  const jmaForecastAreaOptions = useMemo(
    () =>
      buildJmaForecastAreaOptionsWithFallback([
        {
          region_code: newJmaRegionCode,
        },
        {
          region_code: editJmaRegionCode,
        },
        ...locations.map((location) => ({
          region_code: location.jma_forecast_region_code,
          office_code: location.jma_forecast_office_code,
        })),
      ]),
    [editJmaRegionCode, locations, newJmaRegionCode],
  );
  const successMessage = formMessage ?? listMessage;
  const errorMessage = formError ?? listError;
  const isListActionPending =
    updatingId !== null || deletingId !== null || reorderingId !== null;

  function resetMessages() {
    setFormMessage(null);
    setFormError(null);
    setListMessage(null);
    setListError(null);
  }

  function applyGeocodeSelection(
    result: WeatherLocationGeocodeResult,
    options: {
      currentName: string;
      setName: (value: string) => void;
      setLatitude: (value: string) => void;
      setLongitude: (value: string) => void;
      setTimezone: (value: string) => void;
      setSelectedKey: (value: string) => void;
      setMessage: (value: string) => void;
    },
  ) {
    if (options.currentName.trim() === "") {
      options.setName(result.name);
    }

    options.setLatitude(String(result.latitude));
    options.setLongitude(String(result.longitude));
    options.setTimezone(result.timezone ?? "Asia/Tokyo");
    options.setSelectedKey(buildGeocodeResultKey(result));
    options.setMessage(
      `${buildGeocodeResultLabel(result)} を位置情報に反映しました。緯度・経度・タイムゾーンを更新しています。`,
    );
  }

  async function handleNewGeocodeSearch() {
    if (searchingNewGeocode) return;

    setNewGeocodeError(null);
    setNewGeocodeSearched(false);
    setNewGeocodeMessage(null);
    setSearchingNewGeocode(true);

    try {
      const response = await searchWeatherLocationGeocode(newGeocodeQuery);
      setNewGeocodeResults(response.results);
      setNewGeocodeSearched(true);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setNewGeocodeError(
          getFirstValidationMessage(error.data, ["query"]) ??
            getUserFacingSubmitErrorMessage(
              error.data,
              "地域候補の検索に失敗しました。時間をおいて再度お試しください。",
            ),
        );
      } else {
        setNewGeocodeError(
          "地域候補の検索に失敗しました。時間をおいて再度お試しください。",
        );
      }

      setNewGeocodeResults([]);
      setNewGeocodeSearched(true);
    } finally {
      setSearchingNewGeocode(false);
    }
  }

  async function handleEditGeocodeSearch() {
    if (searchingEditGeocode) return;

    setEditGeocodeError(null);
    setEditGeocodeSearched(false);
    setEditGeocodeMessage(null);
    setSearchingEditGeocode(true);

    try {
      const response = await searchWeatherLocationGeocode(editGeocodeQuery);
      setEditGeocodeResults(response.results);
      setEditGeocodeSearched(true);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setEditGeocodeError(
          getFirstValidationMessage(error.data, ["query"]) ??
            getUserFacingSubmitErrorMessage(
              error.data,
              "地域候補の検索に失敗しました。時間をおいて再度お試しください。",
            ),
        );
      } else {
        setEditGeocodeError(
          "地域候補の検索に失敗しました。時間をおいて再度お試しください。",
        );
      }

      setEditGeocodeResults([]);
      setEditGeocodeSearched(true);
    } finally {
      setSearchingEditGeocode(false);
    }
  }

  async function refreshLocations() {
    await loadLocations();
  }

  function buildJmaSelectionPayload(regionCode: string) {
    const normalizedRegionCode = regionCode.trim();

    if (normalizedRegionCode === "") {
      return {
        jma_forecast_region_code: null,
        jma_forecast_office_code: null,
      };
    }

    const selectedArea =
      jmaForecastAreaOptions.find(
        (area) => area.region_code === normalizedRegionCode,
      ) ?? findJmaForecastAreaByRegionCode(normalizedRegionCode);

    return {
      jma_forecast_region_code: normalizedRegionCode,
      jma_forecast_office_code: selectedArea?.office_code ?? null,
    };
  }

  async function handleCreateLocation() {
    if (adding) return;

    resetMessages();
    setAdding(true);

    try {
      await createUserWeatherLocation({
        name: newName,
        ...buildJmaSelectionPayload(newJmaRegionCode),
        ...buildCoordinatePayload(newLatitude, newLongitude, newTimezone),
        is_default: newIsDefault,
      });
      await refreshLocations();
      setNewName("");
      setNewJmaRegionCode("");
      setNewLatitude("");
      setNewLongitude("");
      setNewTimezone("Asia/Tokyo");
      setNewGeocodeQuery("");
      setNewGeocodeResults([]);
      setNewGeocodeError(null);
      setNewGeocodeSearched(false);
      setNewSelectedGeocodeKey(null);
      setNewGeocodeMessage(null);
      setNewIsDefault(false);
      setFormMessage("地域を追加しました。");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFormError(
          getFirstValidationMessage(error.data, [
            "name",
            "jma_forecast_region_code",
            "jma_forecast_office_code",
            "latitude",
            "longitude",
            "timezone",
          ]) ??
            getUserFacingSubmitErrorMessage(
              error.data,
              "地域の追加に失敗しました。時間をおいて再度お試しください。",
            ),
        );
      } else {
        setFormError(
          "地域の追加に失敗しました。時間をおいて再度お試しください。",
        );
      }
    } finally {
      setAdding(false);
    }
  }

  function startEditingLocation(location: UserWeatherLocationRecord) {
    resetMessages();
    setEditingId(location.id);
    setEditName(location.name);
    setEditJmaRegionCode(location.jma_forecast_region_code ?? "");
    setEditLatitude(formatCoordinateField(location.latitude));
    setEditLongitude(formatCoordinateField(location.longitude));
    setEditTimezone(location.timezone ?? "Asia/Tokyo");
    setEditGeocodeQuery(location.name);
    setEditGeocodeResults([]);
    setEditGeocodeError(null);
    setEditGeocodeSearched(false);
    setEditSelectedGeocodeKey(null);
    setEditGeocodeMessage(null);
    setEditIsDefault(location.is_default);
    setShowEditLegacyFields(false);
  }

  function toggleLegacyDetails(locationId: number) {
    setExpandedLegacyDetails((current) => ({
      ...current,
      [locationId]: !current[locationId],
    }));
  }

  async function handleUpdateLocation(locationId: number) {
    if (updatingId !== null) return;

    resetMessages();
    setUpdatingId(locationId);

    try {
      await updateUserWeatherLocation(locationId, {
        name: editName,
        ...buildJmaSelectionPayload(editJmaRegionCode),
        ...buildCoordinatePayload(editLatitude, editLongitude, editTimezone),
        is_default: editIsDefault,
      });
      await refreshLocations();
      setEditingId(null);
      setListMessage("地域設定を更新しました。");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setListError(
          getFirstValidationMessage(error.data, [
            "name",
            "jma_forecast_region_code",
            "jma_forecast_office_code",
            "latitude",
            "longitude",
            "timezone",
          ]) ??
            getUserFacingSubmitErrorMessage(
              error.data,
              "地域設定の更新に失敗しました。時間をおいて再度お試しください。",
            ),
        );
      } else {
        setListError(
          "地域設定の更新に失敗しました。時間をおいて再度お試しください。",
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMakeDefault(location: UserWeatherLocationRecord) {
    if (isListActionPending || location.is_default) return;

    resetMessages();
    setUpdatingId(location.id);

    try {
      await updateUserWeatherLocation(location.id, {
        is_default: true,
      });
      await refreshLocations();
      setListMessage("デフォルト地域を更新しました。");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setListError(
          getUserFacingSubmitErrorMessage(
            error.data,
            "デフォルト地域の更新に失敗しました。時間をおいて再度お試しください。",
          ),
        );
      } else {
        setListError(
          "デフォルト地域の更新に失敗しました。時間をおいて再度お試しください。",
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteLocation(location: UserWeatherLocationRecord) {
    if (deletingId !== null || reorderingId !== null) return;

    const confirmed = window.confirm(
      `「${location.name}」を削除しますか？既存の天気記録で使っている地域は削除できません。`,
    );

    if (!confirmed) return;

    resetMessages();
    setDeletingId(location.id);

    try {
      await deleteUserWeatherLocation(location.id);
      await refreshLocations();
      setListMessage("地域を削除しました。");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setListError(
          getFirstValidationMessage(error.data, ["location"]) ??
            getUserFacingSubmitErrorMessage(
              error.data,
              "地域の削除に失敗しました。時間をおいて再度お試しください。",
            ),
        );
      } else {
        setListError(
          "地域の削除に失敗しました。時間をおいて再度お試しください。",
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMoveLocation(
    locationId: number,
    direction: "up" | "down",
  ) {
    if (reorderingId !== null) return;

    const currentIndex = sortedLocations.findIndex(
      (location) => location.id === locationId,
    );

    if (currentIndex < 0) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sortedLocations.length) {
      return;
    }

    const nextLocationIds = sortedLocations.map((location) => location.id);
    [nextLocationIds[currentIndex], nextLocationIds[targetIndex]] = [
      nextLocationIds[targetIndex],
      nextLocationIds[currentIndex],
    ];

    resetMessages();
    setReorderingId(locationId);

    try {
      await reorderUserWeatherLocations({
        location_ids: nextLocationIds,
      });
      await refreshLocations();
      setListMessage("地域の表示順を更新しました。");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setListError(
          getFirstValidationMessage(error.data, ["location_ids"]) ??
            getUserFacingSubmitErrorMessage(
              error.data,
              "地域の並び替えに失敗しました。時間をおいて再度お試しください。",
            ),
        );
      } else {
        setListError(
          "地域の並び替えに失敗しました。時間をおいて再度お試しください。",
        );
      }
    } finally {
      setReorderingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <SettingsBreadcrumbs currentLabel="天気の地域設定" />

        <SettingsPageHeader
          title="天気の地域設定"
          description="天気取得で使う地域名や位置情報を管理します。よく使う地域やデフォルト地域をここで設定できます。"
          backHref="/settings"
        />

        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <SettingsCard>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">地域を追加</h2>
            <p className="mt-2 text-sm text-gray-600">
              地域名は自分が分かりやすい名前です。位置情報を設定すると、より正確に天気を取得しやすくなります。
            </p>
            <p className="mt-1 text-sm text-gray-600">
              市区町村名と予報区域名は一致しない場合があります。
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="new-weather-location-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                地域名
              </label>
              <input
                id="new-weather-location-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="例: 川口"
              />
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-blue-900">
                  地域を検索
                </h3>
                <p className="text-xs text-blue-800">
                  地域名から候補を検索して、緯度・経度・タイムゾーンを自動反映できます。
                </p>
                <p className="text-xs text-blue-800">
                  Geocoding API
                  が失敗した場合でも、下の欄で手入力を続けられます。
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  id="new-weather-location-geocode-query"
                  value={newGeocodeQuery}
                  onChange={(event) => setNewGeocodeQuery(event.target.value)}
                  className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="例: 川口"
                />
                <button
                  type="button"
                  onClick={handleNewGeocodeSearch}
                  disabled={searchingNewGeocode}
                  className="inline-flex min-w-28 items-center justify-center rounded-lg border border-blue-300 bg-white px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                >
                  {searchingNewGeocode ? "検索中..." : "検索"}
                </button>
              </div>

              {newGeocodeError ? (
                <p className="mt-3 text-sm text-red-700">{newGeocodeError}</p>
              ) : null}

              {newGeocodeMessage ? (
                <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {newGeocodeMessage}
                </p>
              ) : null}

              {newGeocodeSearched &&
              newGeocodeResults.length === 0 &&
              !newGeocodeError ? (
                <p className="mt-3 text-sm text-blue-900">
                  候補が見つかりませんでした。
                </p>
              ) : null}

              {newGeocodeResults.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {newGeocodeResults.map((result) => {
                    const resultKey = buildGeocodeResultKey(result);
                    const isSelected = newSelectedGeocodeKey === resultKey;

                    return (
                      <div
                        key={resultKey}
                        className={`rounded-lg px-4 py-3 ${
                          isSelected
                            ? "border border-emerald-300 bg-emerald-50/70"
                            : "border border-blue-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-gray-900">
                            {buildGeocodeResultLabel(result)}
                          </p>
                          {isSelected ? (
                            <span className="inline-flex rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-xs font-medium text-emerald-700">
                              選択済み
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-gray-600">
                          緯度 {result.latitude} / 経度 {result.longitude} /{" "}
                          {result.timezone ?? "timezone 未設定"}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            applyGeocodeSelection(result, {
                              currentName: newName,
                              setName: setNewName,
                              setLatitude: setNewLatitude,
                              setLongitude: setNewLongitude,
                              setTimezone: setNewTimezone,
                              setSelectedKey: setNewSelectedGeocodeKey,
                              setMessage: setNewGeocodeMessage,
                            })
                          }
                          className={`mt-3 inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                            isSelected
                              ? "border border-emerald-300 bg-emerald-100 text-emerald-700"
                              : "border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          {isSelected ? "選択中" : "この地点を使う"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900">
                  Open-Meteo 用の位置情報
                </h3>
                <p className="text-xs text-slate-600">
                  Open-Meteo で天気を取得するための位置情報です。
                </p>
                <p className="text-xs text-slate-600">
                  日本国内では通常 Asia/Tokyo を使います。
                </p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="new-weather-location-latitude"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    緯度
                  </label>
                  <input
                    id="new-weather-location-latitude"
                    value={newLatitude}
                    onChange={(event) => setNewLatitude(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="例: 35.8617"
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-weather-location-longitude"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    経度
                  </label>
                  <input
                    id="new-weather-location-longitude"
                    value={newLongitude}
                    onChange={(event) => setNewLongitude(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="例: 139.6455"
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-weather-location-timezone"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    タイムゾーン
                  </label>
                  <input
                    id="new-weather-location-timezone"
                    value={newTimezone}
                    onChange={(event) => setNewTimezone(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Asia/Tokyo"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={newIsDefault}
                onChange={(event) => setNewIsDefault(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              デフォルト地域にする
            </label>

            <button
              type="button"
              onClick={handleCreateLocation}
              disabled={adding}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {adding ? "追加中..." : "地域を追加"}
            </button>
          </div>
        </SettingsCard>

        <SettingsCard>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              登録済みの地域
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              デフォルト地域は天気登録画面で初期表示されます。
            </p>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-gray-600">読み込み中です...</p>
          ) : loadError ? (
            <p className="mt-6 text-sm text-red-600">{loadError}</p>
          ) : sortedLocations.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5">
              <p className="text-sm font-medium text-gray-900">
                まだ地域が登録されていません
              </p>
              <p className="mt-2 text-sm text-gray-600">
                よく使う地域を追加すると、天気登録画面で選びやすくなります。
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-gray-500">
                上にある地域ほど一覧で先に表示され、カレンダーの代表天気でも優先されます。デフォルト地域が最優先され、同条件では表示順が上の地域を優先します。
              </p>
              {sortedLocations.map((location, index) => {
                const isEditing = editingId === location.id;
                const selectedArea = findJmaForecastAreaByRegionCode(
                  location.jma_forecast_region_code,
                );

                return (
                  <article
                    key={location.id}
                    data-testid={`weather-location-card-${location.id}`}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4"
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor={`edit-weather-location-name-${location.id}`}
                              className="mb-1 block text-sm font-medium text-gray-700"
                            >
                              地域名
                            </label>
                            <input
                              id={`edit-weather-location-name-${location.id}`}
                              value={editName}
                              onChange={(event) =>
                                setEditName(event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div className="rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-4">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold text-blue-900">
                                地域を検索
                              </h4>
                              <p className="text-xs text-blue-800">
                                地域名から候補を検索して、緯度・経度・タイムゾーンを自動反映できます。
                              </p>
                            </div>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                              <input
                                id={`edit-weather-location-geocode-query-${location.id}`}
                                value={editGeocodeQuery}
                                onChange={(event) =>
                                  setEditGeocodeQuery(event.target.value)
                                }
                                className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="例: 川口"
                              />
                              <button
                                type="button"
                                onClick={handleEditGeocodeSearch}
                                disabled={searchingEditGeocode}
                                className="inline-flex min-w-28 items-center justify-center rounded-lg border border-blue-300 bg-white px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                              >
                                {searchingEditGeocode ? "検索中..." : "検索"}
                              </button>
                            </div>

                            {editGeocodeError ? (
                              <p className="mt-3 text-sm text-red-700">
                                {editGeocodeError}
                              </p>
                            ) : null}

                            {editGeocodeMessage ? (
                              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                {editGeocodeMessage}
                              </p>
                            ) : null}

                            {editGeocodeSearched &&
                            editGeocodeResults.length === 0 &&
                            !editGeocodeError ? (
                              <p className="mt-3 text-sm text-blue-900">
                                候補が見つかりませんでした。
                              </p>
                            ) : null}

                            {editGeocodeResults.length > 0 ? (
                              <div className="mt-4 space-y-3">
                                {editGeocodeResults.map((result) => {
                                  const resultKey =
                                    buildGeocodeResultKey(result);
                                  const isSelected =
                                    editSelectedGeocodeKey === resultKey;

                                  return (
                                    <div
                                      key={resultKey}
                                      className={`rounded-lg px-4 py-3 ${
                                        isSelected
                                          ? "border border-emerald-300 bg-emerald-50/70"
                                          : "border border-blue-200 bg-white"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-medium text-gray-900">
                                          {buildGeocodeResultLabel(result)}
                                        </p>
                                        {isSelected ? (
                                          <span className="inline-flex rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-xs font-medium text-emerald-700">
                                            選択済み
                                          </span>
                                        ) : null}
                                      </div>
                                      <p className="mt-1 text-xs text-gray-600">
                                        緯度 {result.latitude} / 経度{" "}
                                        {result.longitude} /{" "}
                                        {result.timezone ?? "timezone 未設定"}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          applyGeocodeSelection(result, {
                                            currentName: editName,
                                            setName: setEditName,
                                            setLatitude: setEditLatitude,
                                            setLongitude: setEditLongitude,
                                            setTimezone: setEditTimezone,
                                            setSelectedKey:
                                              setEditSelectedGeocodeKey,
                                            setMessage: setEditGeocodeMessage,
                                          })
                                        }
                                        className={`mt-3 inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                                          isSelected
                                            ? "border border-emerald-300 bg-emerald-100 text-emerald-700"
                                            : "border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                        }`}
                                      >
                                        {isSelected
                                          ? "選択中"
                                          : "この地点を使う"}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold text-slate-900">
                                Open-Meteo 用の位置情報
                              </h4>
                              <p className="text-xs text-slate-600">
                                Open-Meteo で天気を取得するための位置情報です。
                              </p>
                              <p className="text-xs text-slate-600">
                                日本国内では通常 Asia/Tokyo を使います。
                              </p>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                              <div>
                                <label
                                  htmlFor={`edit-weather-location-latitude-${location.id}`}
                                  className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                  緯度
                                </label>
                                <input
                                  id={`edit-weather-location-latitude-${location.id}`}
                                  value={editLatitude}
                                  onChange={(event) =>
                                    setEditLatitude(event.target.value)
                                  }
                                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                  placeholder="例: 35.8617"
                                  inputMode="decimal"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor={`edit-weather-location-longitude-${location.id}`}
                                  className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                  経度
                                </label>
                                <input
                                  id={`edit-weather-location-longitude-${location.id}`}
                                  value={editLongitude}
                                  onChange={(event) =>
                                    setEditLongitude(event.target.value)
                                  }
                                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                  placeholder="例: 139.6455"
                                  inputMode="decimal"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor={`edit-weather-location-timezone-${location.id}`}
                                  className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                  タイムゾーン
                                </label>
                                <input
                                  id={`edit-weather-location-timezone-${location.id}`}
                                  value={editTimezone}
                                  onChange={(event) =>
                                    setEditTimezone(event.target.value)
                                  }
                                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                  placeholder="Asia/Tokyo"
                                />
                              </div>
                            </div>
                          </div>

                          {hasLegacyCodeFields(location) ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-slate-700">
                                    補助コードが保存されています
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    現在の天気取得では位置情報を使います。補助コードは旧データ互換のため保持しています。
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  data-testid={`edit-weather-location-legacy-toggle-${location.id}`}
                                  onClick={() =>
                                    setShowEditLegacyFields(
                                      (current) => !current,
                                    )
                                  }
                                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  {showEditLegacyFields
                                    ? "詳細を閉じる"
                                    : "詳細を表示"}
                                </button>
                              </div>

                              {showEditLegacyFields ? (
                                <div
                                  data-testid={`edit-weather-location-legacy-fields-${location.id}`}
                                  className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600"
                                >
                                  <p>
                                    JMA予報区域:{" "}
                                    {selectedArea?.display_name ?? "未設定"}
                                  </p>
                                  <p className="mt-1">
                                    JMA取得用コード:{" "}
                                    {location.jma_forecast_region_code &&
                                    location.jma_forecast_office_code
                                      ? `${location.jma_forecast_region_code} / ${location.jma_forecast_office_code}`
                                      : "未設定"}
                                  </p>
                                  <p className="mt-1">
                                    旧予報コード:{" "}
                                    {location.forecast_area_code ?? "未設定"}
                                  </p>
                                  <p className="mt-2 text-slate-500">
                                    現在の新規 forecast
                                    取得には使いません。旧データ互換や履歴保持のため保持しています。
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={editIsDefault}
                            onChange={(event) =>
                              setEditIsDefault(event.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          デフォルト地域にする
                        </label>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateLocation(location.id)}
                            disabled={updatingId === location.id}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            {updatingId === location.id ? "更新中..." : "更新"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-medium text-gray-900">
                              {location.name}
                            </h3>
                            {location.is_default ? (
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                デフォルト
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            座標:{" "}
                            {location.latitude !== null &&
                            location.longitude !== null
                              ? `${location.latitude}, ${location.longitude}`
                              : "未設定"}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            タイムゾーン: {location.timezone ?? "未設定"}
                          </p>
                          {hasLegacyCodeFields(location) ? (
                            <div className="mt-2 space-y-2">
                              <p className="text-xs text-slate-500">
                                補助コードが保存されています
                              </p>
                              <button
                                type="button"
                                data-testid={`weather-location-legacy-toggle-${location.id}`}
                                onClick={() => toggleLegacyDetails(location.id)}
                                className="text-xs font-medium text-slate-600 underline-offset-2 transition hover:text-slate-800 hover:underline"
                              >
                                {expandedLegacyDetails[location.id]
                                  ? "詳細を閉じる"
                                  : "詳細を表示"}
                              </button>
                              {expandedLegacyDetails[location.id] ? (
                                <div
                                  data-testid={`weather-location-legacy-details-${location.id}`}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600"
                                >
                                  <p>
                                    JMA予報区域:{" "}
                                    {selectedArea?.display_name ?? "未設定"}
                                  </p>
                                  <p className="mt-1">
                                    JMA取得用コード:{" "}
                                    {location.jma_forecast_region_code &&
                                    location.jma_forecast_office_code
                                      ? `${location.jma_forecast_region_code} / ${location.jma_forecast_office_code}`
                                      : "未設定"}
                                  </p>
                                  <p className="mt-1">
                                    旧予報コード:{" "}
                                    {location.forecast_area_code ?? "未設定"}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleMoveLocation(location.id, "up")
                            }
                            disabled={index === 0 || isListActionPending}
                            aria-label={`${location.name} を上へ移動`}
                            data-testid={`weather-location-move-up-${location.id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                          >
                            <MoveUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleMoveLocation(location.id, "down")
                            }
                            disabled={
                              index === sortedLocations.length - 1 ||
                              isListActionPending
                            }
                            aria-label={`${location.name} を下へ移動`}
                            data-testid={`weather-location-move-down-${location.id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                          >
                            <MoveDownIcon className="h-4 w-4" />
                          </button>
                          {!location.is_default ? (
                            <button
                              type="button"
                              onClick={() => handleMakeDefault(location)}
                              disabled={isListActionPending}
                              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                            >
                              デフォルトにする
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => startEditingLocation(location)}
                            disabled={isListActionPending}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                          >
                            <EditIcon className="h-4 w-4" />
                            編集
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLocation(location)}
                            disabled={
                              deletingId === location.id ||
                              reorderingId !== null
                            }
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                          >
                            {deletingId === location.id ? "削除中..." : "削除"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </SettingsCard>
      </div>
    </main>
  );
}

export default function SettingsWeatherLocationsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsWeatherLocationsPageContent />
    </Suspense>
  );
}
