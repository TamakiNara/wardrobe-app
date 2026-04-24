"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import { SettingsBreadcrumbs } from "@/components/settings/settings-breadcrumbs";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import {
  fetchUserPreferences,
  updateUserPreferences,
} from "@/lib/api/settings";
import {
  DEFAULT_SKIN_TONE_PRESET,
  findSkinTonePresetOption,
  SKIN_TONE_PRESET_OPTIONS,
} from "@/lib/master-data/skin-tone-presets";
import type { UserPreferences } from "@/types/settings";

function SettingsPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({
    currentSeason: null,
    defaultWearLogStatus: null,
    calendarWeekStart: null,
    skinTonePreset: DEFAULT_SKIN_TONE_PRESET,
  });
  const [savedPreferences, setSavedPreferences] = useState<UserPreferences>({
    currentSeason: null,
    defaultWearLogStatus: null,
    calendarWeekStart: null,
    skinTonePreset: DEFAULT_SKIN_TONE_PRESET,
  });
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesSaveMessage, setPreferencesSaveMessage] = useState<
    string | null
  >(null);
  const [preferencesSaveError, setPreferencesSaveError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    fetchUserPreferences()
      .then((response) => {
        if (!active) return;
        setPreferences(response.preferences);
        setSavedPreferences(response.preferences);
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiClientError && error.status === 401) {
          router.push("/login");
          return;
        }
        setPreferencesSaveError(
          "表示・初期値設定を読み込めませんでした。時間をおいて再度お試しください。",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const hasPreferenceChanges = useMemo(() => {
    return (
      preferences.currentSeason !== savedPreferences.currentSeason ||
      preferences.defaultWearLogStatus !==
        savedPreferences.defaultWearLogStatus ||
      preferences.calendarWeekStart !== savedPreferences.calendarWeekStart ||
      preferences.skinTonePreset !== savedPreferences.skinTonePreset
    );
  }, [preferences, savedPreferences]);

  const selectedSkinTone = findSkinTonePresetOption(preferences.skinTonePreset);

  const preferencesButtonDisabled =
    loading || preferencesSaving || !hasPreferenceChanges;
  const preferencesButtonLabel = preferencesSaving
    ? "表示・初期値設定を保存中..."
    : "表示・初期値設定を保存";

  async function handleSavePreferences() {
    if (preferencesButtonDisabled) return;

    setPreferencesSaving(true);
    setPreferencesSaveMessage(null);
    setPreferencesSaveError(null);

    try {
      const response = await updateUserPreferences(preferences);
      setPreferences(response.preferences);
      setSavedPreferences(response.preferences);
      setPreferencesSaveMessage("表示・初期値設定を保存しました。");
    } catch {
      setPreferencesSaveError(
        "表示・初期値設定を保存できませんでした。時間をおいて再度お試しください。",
      );
    } finally {
      setPreferencesSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <SettingsBreadcrumbs currentLabel="設定" />

        <SettingsPageHeader
          title="設定"
          description={
            <>
              各種設定を変更できます。
              <br />
              表示内容や利用方法に関する設定は、ここから調整できます。
            </>
          }
        />

        <SettingsCard>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                表示・初期値設定
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                一覧の絞り込みと、着用履歴登録時の初期値を設定できます。
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              {preferencesSaveMessage ? (
                <p className="text-sm text-emerald-700">
                  {preferencesSaveMessage}
                </p>
              ) : null}
              {preferencesSaveError ? (
                <p className="text-sm text-red-600">{preferencesSaveError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={preferencesButtonDisabled}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {preferencesButtonLabel}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="preferences-current-season"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                現在の季節
              </label>
              <select
                id="preferences-current-season"
                value={preferences.currentSeason ?? ""}
                onChange={(event) => {
                  setPreferencesSaveMessage(null);
                  setPreferencesSaveError(null);
                  setPreferences((current) => ({
                    ...current,
                    currentSeason: (event.target.value ||
                      null) as UserPreferences["currentSeason"],
                  }));
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">未設定</option>
                <option value="spring">春</option>
                <option value="summer">夏</option>
                <option value="autumn">秋</option>
                <option value="winter">冬</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                アイテム一覧 / コーディネート一覧で絞り込む季節です。
              </p>
            </div>

            <div>
              <label
                htmlFor="preferences-default-wear-log-status"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                着用履歴のステータス初期値
              </label>
              <select
                id="preferences-default-wear-log-status"
                value={preferences.defaultWearLogStatus ?? ""}
                onChange={(event) => {
                  setPreferencesSaveMessage(null);
                  setPreferencesSaveError(null);
                  setPreferences((current) => ({
                    ...current,
                    defaultWearLogStatus: (event.target.value ||
                      null) as UserPreferences["defaultWearLogStatus"],
                  }));
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">未設定</option>
                <option value="planned">予定</option>
                <option value="worn">着用済み</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                着用履歴の新規登録画面でのみ初期値として使います。
              </p>
            </div>

            <div>
              <label
                htmlFor="preferences-calendar-week-start"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                カレンダーの週始まり
              </label>
              <select
                id="preferences-calendar-week-start"
                value={
                  preferences.calendarWeekStart === "sunday" ? "sunday" : ""
                }
                onChange={(event) => {
                  setPreferencesSaveMessage(null);
                  setPreferencesSaveError(null);
                  setPreferences((current) => ({
                    ...current,
                    calendarWeekStart: (event.target.value === "sunday"
                      ? "sunday"
                      : null) as UserPreferences["calendarWeekStart"],
                  }));
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">月曜始まり</option>
                <option value="sunday">日曜始まり</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                着用履歴カレンダーの曜日並びに使います。未設定時は月曜始まりです。
              </p>
            </div>

            <div className="md:col-span-3">
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  サムネイル色味
                </label>
                <p className="text-xs text-gray-500">
                  item サムネイルの色味表示に使います。
                </p>
                <p className="text-sm text-gray-700">
                  選択中:{" "}
                  <span className="font-medium">{selectedSkinTone.label}</span>
                </p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 sm:max-w-md">
                {SKIN_TONE_PRESET_OPTIONS.map((option) => {
                  const isSelected =
                    preferences.skinTonePreset === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      title={option.label}
                      aria-label={`サムネイル色味: ${option.label}`}
                      onClick={() => {
                        setPreferencesSaveMessage(null);
                        setPreferencesSaveError(null);
                        setPreferences((current) => ({
                          ...current,
                          skinTonePreset: option.value,
                        }));
                      }}
                      className={`relative flex h-16 items-center justify-center rounded-xl border bg-white transition ${
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-100"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <span
                        className="h-10 w-10 rounded-lg border border-gray-200"
                        style={{ backgroundColor: option.hex }}
                      />
                      {isSelected ? (
                        <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SettingsCard>

        <section className="grid gap-4 md:grid-cols-3">
          <SettingsCard>
            <h2 className="text-lg font-semibold text-gray-900">
              カテゴリ設定
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              表示に使うカテゴリを調整できます。
            </p>
            <div className="mt-4">
              <Link
                href="/settings/categories"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                カテゴリ設定へ
              </Link>
            </div>
          </SettingsCard>

          <SettingsCard>
            <h2 className="text-lg font-semibold text-gray-900">TPO 設定</h2>
            <p className="mt-2 text-sm text-gray-600">
              アイテムとコーディネートで使う TPO 候補を調整できます。
            </p>
            <div className="mt-4">
              <Link
                href="/settings/tpos"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                TPO 設定へ
              </Link>
            </div>
          </SettingsCard>

          <SettingsCard>
            <h2 className="text-lg font-semibold text-gray-900">
              ブランド管理設定
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              アイテム入力で使うブランド候補を調整できます。
            </p>
            <div className="mt-4">
              <Link
                href="/settings/brands"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                ブランド管理設定へ
              </Link>
            </div>
          </SettingsCard>

          <SettingsCard>
            <h2 className="text-lg font-semibold text-gray-900">
              インポート・エクスポート
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              アイテム・購入検討・コーディネート・着用履歴のバックアップと復元を行います。
            </p>
            <div className="mt-4">
              <Link
                href="/settings/import-export"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                インポート・エクスポートへ
              </Link>
            </div>
          </SettingsCard>
        </section>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsPageContent />
    </Suspense>
  );
}
