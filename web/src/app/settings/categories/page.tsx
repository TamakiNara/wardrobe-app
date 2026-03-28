"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import { collectAllCategoryIds } from "@/lib/master-data/category-presets";
import { fetchItems } from "@/lib/api/items";
import { fetchCategoryGroups, findVisibleCategoryIdForItem } from "@/lib/api/categories";
import {
  fetchCategoryVisibilitySettings,
  updateCategoryVisibilitySettings,
} from "@/lib/api/settings";
import type { CategoryGroupRecord } from "@/types/categories";
import type { ItemRecord } from "@/types/items";

function buildVisibilityFromIds(
  groups: CategoryGroupRecord[],
  visibleCategoryIds: string[],
) {
  const visibleIdSet = new Set(visibleCategoryIds);

  return Object.fromEntries(
    groups.flatMap((group) =>
      group.categories.map((category) => [category.id, visibleIdSet.has(category.id)]),
    ),
  ) as Record<string, boolean>;
}

function collectVisibleCategoryIds(visibility: Record<string, boolean>) {
  return Object.entries(visibility)
    .filter(([, enabled]) => enabled)
    .map(([categoryId]) => categoryId)
    .sort();
}

function buildRegisteredItemCountByCategoryId(items: ItemRecord[]) {
  const counts: Record<string, number> = {};

  for (const item of items) {
    const categoryId = findVisibleCategoryIdForItem(item.category, item.shape);
    if (!categoryId) continue;
    counts[categoryId] = (counts[categoryId] ?? 0) + 1;
  }

  return counts;
}

function getRegisteredItemCountForGroup(
  group: CategoryGroupRecord,
  counts: Record<string, number>,
) {
  return group.categories.reduce(
    (total, category) => total + (counts[category.id] ?? 0),
    0,
  );
}

function getRegisteredItemCountForCategory(
  categoryId: string,
  counts: Record<string, number>,
) {
  return counts[categoryId] ?? 0;
}

function getGroupState(
  group: CategoryGroupRecord,
  visibility: Record<string, boolean>,
) {
  const enabledCount = group.categories.filter(
    (category) => visibility[category.id] !== false,
  ).length;

  if (enabledCount === 0) return "off";
  if (enabledCount === group.categories.length) return "on";
  return "partial";
}

function SettingsCategoriesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState<CategoryGroupRecord[]>([]);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [savedVisibleCategoryIds, setSavedVisibleCategoryIds] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [registeredItems, setRegisteredItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [requiresInitialSave, setRequiresInitialSave] = useState(false);

  const isOnboardingCustom =
    searchParams.get("mode") === "onboarding" &&
    searchParams.get("preset") === "custom";

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchCategoryGroups(),
      fetchCategoryVisibilitySettings(),
      fetchItems().catch((error) => {
        if (error instanceof ApiClientError && error.status === 401) {
          throw error;
        }
        return [] as ItemRecord[];
      }),
    ])
      .then(([fetchedGroups, settings, fetchedItems]) => {
        if (!active) return;

        const allCategoryIds = collectAllCategoryIds(fetchedGroups);
        const initialVisibleCategoryIds = isOnboardingCustom
          ? allCategoryIds
          : settings.visibleCategoryIds;
        const initialVisibility = buildVisibilityFromIds(
          fetchedGroups,
          initialVisibleCategoryIds,
        );

        setGroups(fetchedGroups);
        setVisibility(initialVisibility);
        setSavedVisibleCategoryIds(
          isOnboardingCustom ? [] : [...settings.visibleCategoryIds].sort(),
        );
        setRequiresInitialSave(isOnboardingCustom);
        setExpandedGroups(
          Object.fromEntries(
            fetchedGroups.map((group) => [group.id, true]),
          ) as Record<string, boolean>,
        );
        setRegisteredItems(fetchedItems);
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiClientError && error.status === 401) {
          router.push("/login");
          return;
        }
        setLoadError("カテゴリ設定を読み込めませんでした。時間をおいて再度お試しください。");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOnboardingCustom, router]);

  const currentVisibleCategoryIds = useMemo(
    () => collectVisibleCategoryIds(visibility),
    [visibility],
  );

  const hasChanges = useMemo(() => {
    return currentVisibleCategoryIds.join("|") !== savedVisibleCategoryIds.join("|");
  }, [currentVisibleCategoryIds, savedVisibleCategoryIds]);

  const hasSaveAction = hasChanges || requiresInitialSave;
  const saveButtonLabel = saving
    ? "保存中..."
    : isOnboardingCustom
      ? "保存してはじめる"
      : hasChanges
        ? "表示設定を保存"
        : "変更なし";
  const saveButtonDisabled = loading || saving || !hasSaveAction;

  useEffect(() => {
    if (!hasSaveAction || saving) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasSaveAction, saving]);

  const registeredItemCountByCategoryId = useMemo(
    () => buildRegisteredItemCountByCategoryId(registeredItems),
    [registeredItems],
  );

  function confirmGroupVisibilityChange(
    group: CategoryGroupRecord,
    enabled: boolean,
  ) {
    const alreadyMatched = group.categories.every(
      (category) => (visibility[category.id] !== false) === enabled,
    );

    if (alreadyMatched || enabled) {
      return true;
    }

    const itemCount = getRegisteredItemCountForGroup(
      group,
      registeredItemCountByCategoryId,
    );

    if (itemCount === 0) {
      return true;
    }

    const message = [
      `${group.name}をすべてOFFにしますか？`,
      `現在${itemCount}アイテムがこの大分類に登録されています。`,
      "非表示にしてもデータは削除されません。\n変更後は「表示設定を保存」を押してください。",
    ].join("\n\n");

    return window.confirm(message);
  }

  function confirmCategoryVisibilityChange(categoryId: string) {
    const itemCount = getRegisteredItemCountForCategory(
      categoryId,
      registeredItemCountByCategoryId,
    );

    if (itemCount === 0) {
      return true;
    }

    const categoryName =
      groups
        .flatMap((group) => group.categories)
        .find((category) => category.id === categoryId)?.name ?? categoryId;
    const message = [
      `${categoryName}をOFFにしますか？`,
      `現在${itemCount}アイテムがこのカテゴリに登録されています。`,
      "非表示にしてもデータは削除されません。\n変更後は「表示設定を保存」を押してください。",
    ].join("\n\n");

    return window.confirm(message);
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  }

  function setGroupVisibility(group: CategoryGroupRecord, enabled: boolean) {
    if (!confirmGroupVisibilityChange(group, enabled)) {
      return;
    }

    setSaveMessage(null);
    setSaveError(null);
    setVisibility((current) => {
      const next = { ...current };
      for (const category of group.categories) {
        next[category.id] = enabled;
      }
      return next;
    });
  }

  function toggleCategory(categoryId: string) {
    const willEnable = visibility[categoryId] === false;
    if (!willEnable && !confirmCategoryVisibilityChange(categoryId)) {
      return;
    }

    setSaveMessage(null);
    setSaveError(null);
    setVisibility((current) => ({
      ...current,
      [categoryId]: !(current[categoryId] !== false),
    }));
  }

  async function handleSave() {
    if (saveButtonDisabled) return;

    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const response = await updateCategoryVisibilitySettings({
        visibleCategoryIds: currentVisibleCategoryIds,
      });
      const normalizedIds = [...response.visibleCategoryIds].sort();
      setSavedVisibleCategoryIds(normalizedIds);
      setVisibility(buildVisibilityFromIds(groups, normalizedIds));
      setRequiresInitialSave(false);

      if (isOnboardingCustom) {
        router.push("/");
        return;
      }

      setSaveMessage("カテゴリ表示設定を保存しました。");
    } catch {
      setSaveError("設定を保存できませんでした。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <Link href="/settings" className="hover:underline">
            設定
          </Link>
          {" / "}
          <span className="text-gray-700">カテゴリ設定</span>
        </nav>

        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-gray-500">設定</p>
              <h1 className="text-2xl font-bold text-gray-900">カテゴリ設定</h1>
              <p className="mt-2 text-sm text-gray-600">
                ON にしたカテゴリのみ、登録や選択時に表示されます。
              </p>
            </div>

            <Link
              href="/settings"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              設定へ戻る
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">カテゴリ表示設定</h2>
              <p className="mt-2 text-sm text-gray-600">
                大分類ごとに表示カテゴリを調整できます。
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              {saveMessage ? (
                <p className="text-sm text-emerald-700">{saveMessage}</p>
              ) : null}
              {saveError ? (
                <p className="text-sm text-red-600">{saveError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleSave}
                disabled={saveButtonDisabled}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saveButtonLabel}
              </button>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-gray-600">カテゴリを読み込み中です...</p>
          ) : loadError ? (
            <p className="mt-6 text-sm text-red-600">{loadError}</p>
          ) : (
            <div className="mt-6 space-y-4">
              {groups.map((group) => {
                const state = getGroupState(group, visibility);
                const enabledCount = group.categories.filter(
                  (category) => visibility[category.id] !== false,
                ).length;
                const isExpanded = expandedGroups[group.id] ?? true;

                return (
                  <section
                    key={group.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              state === "on"
                                ? "bg-emerald-100 text-emerald-700"
                                : state === "partial"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {state === "on"
                              ? "ON"
                              : state === "partial"
                                ? "一部ON"
                                : "OFF"}
                          </span>
                          <div>
                            <p className="text-base font-semibold text-gray-900">
                              {group.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              表示中：{enabledCount} / {group.categories.length}件
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setGroupVisibility(group, true)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                        >
                          すべてON
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroupVisibility(group, false)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                        >
                          すべてOFF
                        </button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {group.categories.map((category) => {
                          const checked = visibility[category.id] !== false;

                          return (
                            <label
                              key={category.id}
                              className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {category.name}
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCategory(category.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                );
              })}

              <div className="flex justify-end border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveButtonDisabled}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {saveButtonLabel}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function SettingsCategoriesPage() {
  return (
    <Suspense>
      <SettingsCategoriesPageContent />
    </Suspense>
  );
}
