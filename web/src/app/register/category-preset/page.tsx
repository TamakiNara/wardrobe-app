"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import { fetchCategoryGroups } from "@/lib/api/categories";
import {
  fetchCategoryVisibilitySettings,
  updateCategoryVisibilitySettings,
} from "@/lib/api/settings";
import {
  buildVisibleCategoryIdsForPreset,
  CATEGORY_PRESET_OPTIONS,
  type CategoryPresetValue,
} from "@/lib/master-data/category-presets";
import type { CategoryGroupRecord } from "@/types/categories";

export default function CategoryPresetSelectionPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<CategoryGroupRecord[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<CategoryPresetValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchCategoryGroups(),
      fetchCategoryVisibilitySettings(),
    ])
      .then(([fetchedGroups]) => {
        if (!active) return;
        setGroups(fetchedGroups);
      })
      .catch((caughtError) => {
        if (!active) return;
        if (caughtError instanceof ApiClientError && caughtError.status === 401) {
          router.push("/login");
          return;
        }
        setError("カテゴリプリセットの読み込みに失敗しました。時間をおいて再度お試しください。");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const canProceed = useMemo(
    () => !loading && !submitting && selectedPreset !== null,
    [loading, submitting, selectedPreset],
  );

  async function handleNext() {
    if (!selectedPreset) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      if (selectedPreset === "custom") {
        router.push("/settings/categories?mode=onboarding&preset=custom");
        return;
      }

      const visibleCategoryIds = buildVisibleCategoryIdsForPreset(
        groups,
        selectedPreset,
      );

      await updateCategoryVisibilitySettings({ visibleCategoryIds });
      router.push("/");
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError && caughtError.status === 401) {
        router.push("/login");
        return;
      }
      setError("カテゴリプリセットの保存に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            カテゴリプリセットを選択
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            使用するカテゴリの初期設定を選びます。
            <br />
            カテゴリはあとから設定画面で変更できます。
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {CATEGORY_PRESET_OPTIONS.map((preset) => {
            const selected = selectedPreset === preset.value;

            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => setSelectedPreset(preset.value)}
                className={`flex h-full flex-col rounded-2xl border p-6 text-left shadow-sm transition ${
                  selected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                }`}
              >
                <p className="text-sm font-semibold text-blue-600">{preset.label}</p>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {"次へ"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
