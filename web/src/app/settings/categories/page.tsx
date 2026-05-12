"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import { SettingsBreadcrumbs } from "@/components/settings/settings-breadcrumbs";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { collectAllCategoryIds } from "@/lib/master-data/category-presets";
import { fetchItems } from "@/lib/api/items";
import {
  fetchCategoryGroups,
  findVisibleCategoryIdForItem,
} from "@/lib/api/categories";
import {
  fetchCategoryVisibilitySettings,
  updateCategoryVisibilitySettings,
} from "@/lib/api/settings";
import type { CategoryGroupRecord } from "@/types/categories";
import type { ItemRecord } from "@/types/items";

type PendingVisibilityChange =
  | {
      type: "group";
      groupId: string;
      groupName: string;
    }
  | {
      type: "category";
      categoryId: string;
      categoryName: string;
    };

function buildVisibilityFromIds(
  groups: CategoryGroupRecord[],
  visibleCategoryIds: string[],
) {
  const visibleIdSet = new Set(visibleCategoryIds);

  return Object.fromEntries(
    groups.flatMap((group) =>
      group.categories.map((category) => [
        category.id,
        visibleIdSet.has(category.id),
      ]),
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
    const categoryId = findVisibleCategoryIdForItem(
      item.category,
      item.shape,
      item.subcategory,
    );
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
  const [savedVisibleCategoryIds, setSavedVisibleCategoryIds] = useState<
    string[]
  >([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [registeredItems, setRegisteredItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [requiresInitialSave, setRequiresInitialSave] = useState(false);
  const [pendingVisibilityChange, setPendingVisibilityChange] =
    useState<PendingVisibilityChange | null>(null);

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
        setLoadError(
          "カテゴリ設定を読み込めませんでした。時間をおいて再度お試しください。",
        );
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
    return (
      currentVisibleCategoryIds.join("|") !== savedVisibleCategoryIds.join("|")
    );
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

  function toggleGroup(groupId: string) {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  }

  function clearMessages() {
    setSaveMessage(null);
    setSaveError(null);
  }

  function closePendingVisibilityChange() {
    setPendingVisibilityChange(null);
  }

  function applyGroupVisibility(group: CategoryGroupRecord, enabled: boolean) {
    clearMessages();
    setPendingVisibilityChange(null);
    setVisibility((current) => {
      const next = { ...current };
      for (const category of group.categories) {
        next[category.id] = enabled;
      }
      return next;
    });
  }

  function applyCategoryVisibility(categoryId: string, enabled: boolean) {
    clearMessages();
    setPendingVisibilityChange(null);
    setVisibility((current) => ({
      ...current,
      [categoryId]: enabled,
    }));
  }

  function requestGroupVisibilityChange(
    group: CategoryGroupRecord,
    enabled: boolean,
  ) {
    const alreadyMatched = group.categories.every(
      (category) => (visibility[category.id] !== false) === enabled,
    );

    if (alreadyMatched) {
      return;
    }

    if (enabled) {
      applyGroupVisibility(group, true);
      return;
    }

    const itemCount = getRegisteredItemCountForGroup(
      group,
      registeredItemCountByCategoryId,
    );

    if (itemCount === 0) {
      applyGroupVisibility(group, false);
      return;
    }

    clearMessages();
    setPendingVisibilityChange({
      type: "group",
      groupId: group.id,
      groupName: group.name,
    });
  }

  function requestCategoryVisibilityChange(categoryId: string) {
    const willEnable = visibility[categoryId] === false;

    if (willEnable) {
      applyCategoryVisibility(categoryId, true);
      return;
    }

    const itemCount = getRegisteredItemCountForCategory(
      categoryId,
      registeredItemCountByCategoryId,
    );

    if (itemCount === 0) {
      applyCategoryVisibility(categoryId, false);
      return;
    }

    const categoryName =
      groups
        .flatMap((group) => group.categories)
        .find((category) => category.id === categoryId)?.name ?? categoryId;

    clearMessages();
    setPendingVisibilityChange({
      type: "category",
      categoryId,
      categoryName,
    });
  }

  function confirmPendingVisibilityChange() {
    if (!pendingVisibilityChange) {
      return;
    }

    if (pendingVisibilityChange.type === "group") {
      const targetGroup = groups.find(
        (group) => group.id === pendingVisibilityChange.groupId,
      );

      if (!targetGroup) {
        setPendingVisibilityChange(null);
        return;
      }

      applyGroupVisibility(targetGroup, false);
      return;
    }

    applyCategoryVisibility(pendingVisibilityChange.categoryId, false);
  }

  function setGroupVisibility(group: CategoryGroupRecord, enabled: boolean) {
    requestGroupVisibilityChange(group, enabled);
  }

  function toggleCategory(categoryId: string) {
    requestCategoryVisibilityChange(categoryId);
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
      setSaveError(
        "設定を保存できませんでした。時間をおいて再度お試しください。",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <SettingsBreadcrumbs currentLabel="カテゴリ設定" />

        <SettingsPageHeader
          title="カテゴリ設定"
          description="ON にしたカテゴリのみ、登録や選択時に表示されます。"
          backHref="/settings"
        />

        <SettingsCard>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                カテゴリ表示設定
              </h2>
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
            <p className="mt-6 text-sm text-gray-600">
              カテゴリを読み込み中です...
            </p>
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
                              表示中：{enabledCount} / {group.categories.length}
                              件
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

                    {pendingVisibilityChange?.type === "group" &&
                    pendingVisibilityChange.groupId === group.id ? (
                      <div
                        role="alertdialog"
                        aria-labelledby={`category-group-confirm-title-${group.id}`}
                        aria-describedby={`category-group-confirm-body-${group.id}`}
                        className="mt-4 rounded-xl border border-amber-200 bg-white p-4 shadow-sm"
                      >
                        <h3
                          id={`category-group-confirm-title-${group.id}`}
                          className="text-sm font-semibold text-slate-900"
                        >
                          この大分類を非表示にしますか？
                        </h3>
                        <div
                          id={`category-group-confirm-body-${group.id}`}
                          className="mt-2 space-y-1 text-sm text-slate-700"
                        >
                          <p>
                            {pendingVisibilityChange.groupName}
                            に含まれるカテゴリも表示対象から外れます。
                          </p>
                          <p>登録済みのアイテム自体は削除されません。</p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={closePendingVisibilityChange}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            onClick={confirmPendingVisibilityChange}
                            className="rounded-lg border border-amber-200 bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                          >
                            非表示にする
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {isExpanded ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {group.categories.map((category) => {
                          const checked = visibility[category.id] !== false;

                          return (
                            <div
                              key={category.id}
                              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                            >
                              <label className="flex cursor-pointer items-center justify-between">
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

                              {pendingVisibilityChange?.type === "category" &&
                              pendingVisibilityChange.categoryId ===
                                category.id ? (
                                <div
                                  role="alertdialog"
                                  aria-labelledby={`category-confirm-title-${category.id}`}
                                  aria-describedby={`category-confirm-body-${category.id}`}
                                  className="mt-3 rounded-xl border border-amber-200 bg-white p-4 shadow-sm"
                                >
                                  <h3
                                    id={`category-confirm-title-${category.id}`}
                                    className="text-sm font-semibold text-slate-900"
                                  >
                                    このカテゴリを非表示にしますか？
                                  </h3>
                                  <div
                                    id={`category-confirm-body-${category.id}`}
                                    className="mt-2 space-y-1 text-sm text-slate-700"
                                  >
                                    <p>
                                      {pendingVisibilityChange.categoryName}
                                      は登録画面や一覧の表示対象から外れます。
                                    </p>
                                    <p>
                                      登録済みのアイテム自体は削除されません。
                                    </p>
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={closePendingVisibilityChange}
                                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                      キャンセル
                                    </button>
                                    <button
                                      type="button"
                                      onClick={confirmPendingVisibilityChange}
                                      className="rounded-lg border border-amber-200 bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                                    >
                                      非表示にする
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
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
        </SettingsCard>
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
