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
  buildForecastAreaOptionsWithFallback,
  findForecastAreaByCode,
  formatForecastAreaOptionLabel,
  groupForecastAreasByPrefecture,
} from "@/lib/weather/forecast-areas";
import {
  createUserWeatherLocation,
  deleteUserWeatherLocation,
  fetchUserWeatherLocations,
  updateUserWeatherLocation,
} from "@/lib/api/settings";
import type { UserWeatherLocationRecord } from "@/types/settings";

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
    if (a.is_default !== b.is_default) {
      return a.is_default ? -1 : 1;
    }

    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }

    return a.id - b.id;
  });
}

function SettingsWeatherLocationsPageContent() {
  const EditIcon = settingsActionIcons.edit;
  const router = useRouter();
  const [locations, setLocations] = useState<UserWeatherLocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newForecastAreaCode, setNewForecastAreaCode] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editForecastAreaCode, setEditForecastAreaCode] = useState("");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
  const forecastAreaOptions = useMemo(
    () =>
      buildForecastAreaOptionsWithFallback([
        newForecastAreaCode,
        editForecastAreaCode,
        ...locations.map((location) => location.forecast_area_code),
      ]),
    [editForecastAreaCode, locations, newForecastAreaCode],
  );
  const forecastAreaGroups = useMemo(
    () => groupForecastAreasByPrefecture(forecastAreaOptions),
    [forecastAreaOptions],
  );
  const successMessage = formMessage ?? listMessage;
  const errorMessage = formError ?? listError;

  function resetMessages() {
    setFormMessage(null);
    setFormError(null);
    setListMessage(null);
    setListError(null);
  }

  async function refreshLocations() {
    await loadLocations();
  }

  async function handleCreateLocation() {
    if (adding) return;

    resetMessages();
    setAdding(true);

    try {
      await createUserWeatherLocation({
        name: newName,
        forecast_area_code:
          newForecastAreaCode.trim() === "" ? null : newForecastAreaCode,
        is_default: newIsDefault,
      });
      await refreshLocations();
      setNewName("");
      setNewForecastAreaCode("");
      setNewIsDefault(false);
      setFormMessage("地域を追加しました。");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFormError(
          getFirstValidationMessage(error.data, ["name"]) ??
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
    setEditForecastAreaCode(location.forecast_area_code ?? "");
    setEditIsDefault(location.is_default);
  }

  async function handleUpdateLocation(locationId: number) {
    if (updatingId !== null) return;

    resetMessages();
    setUpdatingId(locationId);

    try {
      await updateUserWeatherLocation(locationId, {
        name: editName,
        forecast_area_code:
          editForecastAreaCode.trim() === "" ? null : editForecastAreaCode,
        is_default: editIsDefault,
      });
      await refreshLocations();
      setEditingId(null);
      setListMessage("地域設定を更新しました。");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setListError(
          getFirstValidationMessage(error.data, ["name"]) ??
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
    if (updatingId !== null || location.is_default) return;

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
    if (deletingId !== null) return;

    const confirmed = window.confirm(
      `「${location.name}」を削除しますか？既に天気記録で使っている地域は削除できません。`,
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

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <SettingsBreadcrumbs currentLabel="天気の地域設定" />

        <SettingsPageHeader
          title="天気の地域設定"
          description="天気登録で使う地域と予報区域を管理します。よく使う地域やデフォルト地域をここで設定できます。"
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
              地域順は手動で並べ替えず、表示順とデフォルト設定で管理します。
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

            <div>
              <label
                htmlFor="new-weather-location-forecast-area"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                予報区域
              </label>
              <select
                id="new-weather-location-forecast-area"
                value={newForecastAreaCode}
                onChange={(event) => setNewForecastAreaCode(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">未設定</option>
                {forecastAreaGroups.map((group) => (
                  <optgroup key={group.prefecture} label={group.prefecture}>
                    {group.areas.map((area) => (
                      <option key={area.code} value={area.code}>
                        {formatForecastAreaOptionLabel(area)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                天気予報APIで使う地域を選びます。
              </p>
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
              登録済み地域
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              デフォルト地域は天気登録画面で初期選択されます。
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
              {sortedLocations.map((location) => {
                const isEditing = editingId === location.id;

                return (
                  <article
                    key={location.id}
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

                          <div>
                            <label
                              htmlFor={`edit-weather-location-forecast-area-${location.id}`}
                              className="mb-1 block text-sm font-medium text-gray-700"
                            >
                              予報区域
                            </label>
                            <select
                              id={`edit-weather-location-forecast-area-${location.id}`}
                              value={editForecastAreaCode}
                              onChange={(event) =>
                                setEditForecastAreaCode(event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                              <option value="">未設定</option>
                              {forecastAreaGroups.map((group) => (
                                <optgroup
                                  key={group.prefecture}
                                  label={group.prefecture}
                                >
                                  {group.areas.map((area) => (
                                    <option key={area.code} value={area.code}>
                                      {formatForecastAreaOptionLabel(area)}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                            <p className="mt-2 text-xs text-gray-500">
                              天気を取得するときに使う地域です。
                            </p>
                          </div>
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
                            予報区域:{" "}
                            {location.forecast_area_code
                              ? formatForecastAreaOptionLabel(
                                  findForecastAreaByCode(
                                    location.forecast_area_code,
                                  ) ?? {
                                    code: location.forecast_area_code,
                                    label: "設定済みのコード",
                                    prefecture: "その他",
                                  },
                                )
                              : "未設定"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {!location.is_default ? (
                            <button
                              type="button"
                              onClick={() => handleMakeDefault(location)}
                              disabled={updatingId === location.id}
                              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                            >
                              デフォルトにする
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => startEditingLocation(location)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                          >
                            <EditIcon className="h-4 w-4" />
                            編集
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLocation(location)}
                            disabled={deletingId === location.id}
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
