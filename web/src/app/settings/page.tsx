"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import { collectAllCategoryIds } from "@/lib/master-data/category-presets";
import { fetchItems } from "@/lib/api/items";
import { fetchCategoryGroups, findVisibleCategoryIdForItem } from "@/lib/api/categories";
import {
  createUserBrand,
  fetchCategoryVisibilitySettings,
  fetchUserPreferences,
  fetchUserBrands,
  updateUserBrand,
  updateCategoryVisibilitySettings,
  updateUserPreferences,
} from "@/lib/api/settings";
import type { CategoryGroupRecord } from "@/types/categories";
import type { ItemRecord } from "@/types/items";
import type { UserBrandRecord, UserPreferences } from "@/types/settings";

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

function SettingsPageContent() {
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
  const [preferences, setPreferences] = useState<UserPreferences>({
    currentSeason: null,
    defaultWearLogStatus: null,
  });
  const [savedPreferences, setSavedPreferences] = useState<UserPreferences>({
    currentSeason: null,
    defaultWearLogStatus: null,
  });
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesSaveMessage, setPreferencesSaveMessage] = useState<string | null>(null);
  const [preferencesSaveError, setPreferencesSaveError] = useState<string | null>(null);
  const [brands, setBrands] = useState<UserBrandRecord[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsLoadError, setBrandsLoadError] = useState<string | null>(null);
  const [brandSaveMessage, setBrandSaveMessage] = useState<string | null>(null);
  const [brandSaveError, setBrandSaveError] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandKana, setNewBrandKana] = useState("");
  const [brandKeyword, setBrandKeyword] = useState("");
  const [showInactiveBrands, setShowInactiveBrands] = useState(false);
  const [addingBrand, setAddingBrand] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editBrandName, setEditBrandName] = useState("");
  const [editBrandKana, setEditBrandKana] = useState("");
  const [editBrandIsActive, setEditBrandIsActive] = useState(true);
  const [updatingBrandId, setUpdatingBrandId] = useState<number | null>(null);

  const isOnboardingCustom =
    searchParams.get("mode") === "onboarding" &&
    searchParams.get("preset") === "custom";

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchCategoryGroups(),
      fetchCategoryVisibilitySettings(),
      fetchUserPreferences(),
      fetchItems().catch((error) => {
        if (error instanceof ApiClientError && error.status === 401) {
          throw error;
        }
        return [] as ItemRecord[];
      }),
    ])
      .then(([fetchedGroups, settings, preferencesResponse, fetchedItems]) => {
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
        setPreferences(preferencesResponse.preferences);
        setSavedPreferences(preferencesResponse.preferences);
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

  useEffect(() => {
    let active = true;

    fetchUserBrands(brandKeyword.trim() || undefined, false)
      .then((response) => {
        if (!active) return;
        setBrands(response.brands);
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiClientError && error.status === 401) {
          router.push("/login");
          return;
        }
        setBrandsLoadError("ブランド候補を読み込めませんでした。時間をおいて再度お試しください。");
      })
      .finally(() => {
        if (!active) return;
        setBrandsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [brandKeyword, router]);

  const currentVisibleCategoryIds = useMemo(
    () => collectVisibleCategoryIds(visibility),
    [visibility],
  );

  const hasChanges = useMemo(() => {
    return currentVisibleCategoryIds.join("|") !== savedVisibleCategoryIds.join("|");
  }, [currentVisibleCategoryIds, savedVisibleCategoryIds]);

  const hasSaveAction = hasChanges || requiresInitialSave;
  const saveButtonLabel = saving
    ? "\u4fdd\u5b58\u4e2d..."
    : isOnboardingCustom
      ? "\u4fdd\u5b58\u3057\u3066\u306f\u3058\u3081\u308b"
      : hasChanges
        ? "\u8868\u793a\u8a2d\u5b9a\u3092\u4fdd\u5b58"
        : "\u5909\u66f4\u306a\u3057";
  const saveButtonDisabled = loading || saving || !hasSaveAction;
  const hasPreferenceChanges = useMemo(() => {
    return (
      preferences.currentSeason !== savedPreferences.currentSeason ||
      preferences.defaultWearLogStatus !== savedPreferences.defaultWearLogStatus
    );
  }, [preferences, savedPreferences]);
  const preferencesButtonDisabled = loading || preferencesSaving || !hasPreferenceChanges;
  const preferencesButtonLabel = preferencesSaving
    ? "個人設定を保存中..."
    : "個人設定を保存";

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

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }, [brands]);

  const activeBrands = useMemo(
    () => sortedBrands.filter((brand) => brand.is_active),
    [sortedBrands],
  );

  const inactiveBrands = useMemo(
    () => sortedBrands.filter((brand) => !brand.is_active),
    [sortedBrands],
  );

  const hasBrandKeyword = brandKeyword.trim().length > 0;

  function formatBrandUpdatedAt(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "日時不明";
    }

    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }


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
      "非表示にしてもデータは削除されません。" +
        "\n" +
        "変更後は「表示設定を保存」を押してください。",
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
      "非表示にしてもデータは削除されません。" +
        "\n" +
        "変更後は「表示設定を保存」を押してください。",
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

  function resetBrandMessages() {
    setBrandSaveMessage(null);
    setBrandSaveError(null);
  }

  async function refreshBrands() {
    const response = await fetchUserBrands(brandKeyword.trim() || undefined, false);
    setBrands(response.brands);
  }

  async function handleCreateBrand() {
    if (addingBrand) return;

    resetBrandMessages();
    setAddingBrand(true);

    try {
      await createUserBrand({
        name: newBrandName,
        kana: newBrandKana.trim() || null,
        is_active: true,
      });
      await refreshBrands();
      setNewBrandName("");
      setNewBrandKana("");
      setBrandSaveMessage("ブランド候補を追加しました。");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setBrandSaveError(
          error.data?.errors?.name?.[0] ??
            error.data?.errors?.kana?.[0] ??
            error.message,
        );
      } else {
        setBrandSaveError("ブランド候補を追加できませんでした。時間をおいて再度お試しください。");
      }
    } finally {
      setAddingBrand(false);
    }
  }

  function startEditingBrand(brand: UserBrandRecord) {
    resetBrandMessages();
    setEditingBrandId(brand.id);
    setEditBrandName(brand.name);
    setEditBrandKana(brand.kana ?? "");
    setEditBrandIsActive(brand.is_active);
  }

  async function handleUpdateBrand(brandId: number) {
    if (updatingBrandId !== null) return;

    resetBrandMessages();
    setUpdatingBrandId(brandId);

    try {
      await updateUserBrand(brandId, {
        name: editBrandName,
        kana: editBrandKana.trim() || null,
        is_active: editBrandIsActive,
      });
      await refreshBrands();
      setEditingBrandId(null);
      setBrandSaveMessage("ブランド候補を更新しました。");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setBrandSaveError(
          error.data?.errors?.name?.[0] ??
            error.data?.errors?.kana?.[0] ??
            error.message,
        );
      } else {
        setBrandSaveError("ブランド候補を更新できませんでした。時間をおいて再度お試しください。");
      }
    } finally {
      setUpdatingBrandId(null);
    }
  }

  async function handleToggleBrandActive(brand: UserBrandRecord) {
    if (updatingBrandId !== null) return;

    resetBrandMessages();
    setUpdatingBrandId(brand.id);

    try {
      await updateUserBrand(brand.id, {
        is_active: !brand.is_active,
      });
      await refreshBrands();
      setBrandSaveMessage(
        !brand.is_active
          ? "ブランド候補を有効にしました。"
          : "ブランド候補を無効にしました。",
      );
    } catch (error) {
      if (error instanceof ApiClientError) {
        setBrandSaveError(error.message);
      } else {
        setBrandSaveError("ブランド候補の状態を更新できませんでした。時間をおいて再度お試しください。");
      }
    } finally {
      setUpdatingBrandId(null);
    }
  }

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
      setPreferencesSaveError("表示・初期値設定を保存できませんでした。時間をおいて再度お試しください。");
    } finally {
      setPreferencesSaving(false);
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
          <span className="text-gray-700">設定</span>
        </nav>

        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">設定</h1>
            <p className="mt-2 text-sm text-gray-600">
              各種設定を変更できます。
              <br />
              表示内容や利用方法に関する項目は、ここから調整できます。
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">カテゴリ表示設定</h2>
              <p className="mt-2 text-sm text-gray-600">
                ONにしたカテゴリのみ、登録や選択時に表示されます。
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

                    {isExpanded && (
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
                    )}
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

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">表示・初期値設定</h2>
              <p className="mt-2 text-sm text-gray-600">
                一覧の絞り込みと、着用履歴登録時の初期値を設定できます。
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              {preferencesSaveMessage ? (
                <p className="text-sm text-emerald-700">{preferencesSaveMessage}</p>
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

          <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                    currentSeason: (event.target.value || null) as UserPreferences["currentSeason"],
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
                アイテム一覧 / コーディネート一覧で指定の季節で絞り込んで表示します。
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
                    defaultWearLogStatus: (event.target.value || null) as UserPreferences["defaultWearLogStatus"],
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
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ブランド候補設定</h2>
              <p className="mt-2 text-sm text-gray-600">
                アイテム入力で使うブランド候補を管理できます。既存 item のブランド名は自動更新しません。
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              {brandSaveMessage ? (
                <p className="text-sm text-emerald-700">{brandSaveMessage}</p>
              ) : null}
              {brandSaveError ? (
                <p className="text-sm text-red-600">{brandSaveError}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-base font-semibold text-gray-900">ブランド候補を追加</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-[2fr_2fr_auto]">
              <div>
                <label htmlFor="new-brand-name" className="mb-1 block text-sm font-medium text-gray-700">
                  ブランド名
                </label>
                <input
                  id="new-brand-name"
                  type="text"
                  value={newBrandName}
                  onChange={(event) => setNewBrandName(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="new-brand-kana" className="mb-1 block text-sm font-medium text-gray-700">
                  読み仮名
                </label>
                <input
                  id="new-brand-kana"
                  type="text"
                  value={newBrandKana}
                  onChange={(event) => setNewBrandKana(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCreateBrand}
                  disabled={addingBrand}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {addingBrand ? "追加中..." : "追加する"}
                </button>
              </div>
            </div>
          </div>

          {brandsLoading ? (
            <p className="mt-6 text-sm text-gray-600">ブランド候補を読み込み中です...</p>
          ) : brandsLoadError ? (
            <p className="mt-6 text-sm text-red-600">{brandsLoadError}</p>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="flex-1">
                    <label
                      htmlFor="brand-keyword"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      キーワードで絞り込む
                    </label>
                    <input
                      id="brand-keyword"
                      type="text"
                      value={brandKeyword}
                      onChange={(event) => setBrandKeyword(event.target.value)}
                      placeholder="ブランド名または読み仮名で検索"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      ブランド名・読み仮名のどちらでも探せます。
                    </p>
                  </div>
                  <label className="inline-flex h-[50px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 md:self-start md:mt-6">
                    <input
                      type="checkbox"
                      checked={showInactiveBrands}
                      onChange={(event) => setShowInactiveBrands(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    無効候補も表示する
                  </label>
                </div>
              </div>

              {sortedBrands.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  {hasBrandKeyword
                    ? "条件に合うブランド候補はありません。"
                    : "ブランド候補はまだありません。"}
                </p>
              ) : (
                <>
                  {activeBrands.length > 0 ? (
                    activeBrands.map((brand) => {
                      const isEditing = editingBrandId === brand.id;
                      const isUpdating = updatingBrandId === brand.id;

                      return (
                        <section
                          key={brand.id}
                          className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-base font-semibold text-gray-900">{brand.name}</p>
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  有効
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                読み仮名: {brand.kana ?? "未設定"}
                              </p>
                              <p className="text-xs text-gray-500">
                                更新日時: {formatBrandUpdatedAt(brand.updated_at)}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleBrandActive(brand)}
                                disabled={isUpdating}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                無効にする
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditingBrand(brand)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                              >
                                編集する
                              </button>
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="mt-4 grid gap-4 md:grid-cols-[2fr_2fr_auto_auto]">
                              <div>
                                <label htmlFor={`brand-name-${brand.id}`} className="mb-1 block text-sm font-medium text-gray-700">
                                  ブランド名
                                </label>
                                <input
                                  id={`brand-name-${brand.id}`}
                                  type="text"
                                  value={editBrandName}
                                  onChange={(event) => setEditBrandName(event.target.value)}
                                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                              </div>
                              <div>
                                <label htmlFor={`brand-kana-${brand.id}`} className="mb-1 block text-sm font-medium text-gray-700">
                                  読み仮名
                                </label>
                                <input
                                  id={`brand-kana-${brand.id}`}
                                  type="text"
                                  value={editBrandKana}
                                  onChange={(event) => setEditBrandKana(event.target.value)}
                                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                              </div>
                              <label className="inline-flex h-[50px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 md:self-end">
                                <input
                                  type="checkbox"
                                  checked={editBrandIsActive}
                                  onChange={(event) => setEditBrandIsActive(event.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                有効
                              </label>
                              <div className="flex gap-2 md:self-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingBrandId(null)}
                                  className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 transition hover:bg-gray-100"
                                >
                                  キャンセル
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBrand(brand.id)}
                                  disabled={isUpdating}
                                  className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                >
                                  {isUpdating ? "更新中..." : "更新する"}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </section>
                      );
                    })
                  ) : (
                    <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      有効なブランド候補はありません。
                    </p>
                  )}

                  {inactiveBrands.length > 0 ? (
                    <section className="rounded-2xl border border-gray-200 bg-white p-4">
                      <button
                        type="button"
                        onClick={() => setShowInactiveBrands((current) => !current)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            無効候補
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {inactiveBrands.length}件
                            {showInactiveBrands
                              ? " を表示中です。"
                              : " あります。必要なときだけ表示できます。"}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          {showInactiveBrands ? "閉じる" : "表示する"}
                        </span>
                      </button>

                      {showInactiveBrands ? (
                        <div className="mt-4 space-y-3">
                          {inactiveBrands.map((brand) => {
                            const isEditing = editingBrandId === brand.id;
                            const isUpdating = updatingBrandId === brand.id;

                            return (
                              <section
                                key={brand.id}
                                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                              >
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-base font-semibold text-gray-900">{brand.name}</p>
                                      <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                                        無効
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      読み仮名: {brand.kana ?? "未設定"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      更新日時: {formatBrandUpdatedAt(brand.updated_at)}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleBrandActive(brand)}
                                      disabled={isUpdating}
                                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                      有効にする
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => startEditingBrand(brand)}
                                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                                    >
                                      編集する
                                    </button>
                                  </div>
                                </div>

                                {isEditing ? (
                                  <div className="mt-4 grid gap-4 md:grid-cols-[2fr_2fr_auto_auto]">
                                    <div>
                                      <label htmlFor={`brand-name-${brand.id}`} className="mb-1 block text-sm font-medium text-gray-700">
                                        ブランド名
                                      </label>
                                      <input
                                        id={`brand-name-${brand.id}`}
                                        type="text"
                                        value={editBrandName}
                                        onChange={(event) => setEditBrandName(event.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                      />
                                    </div>
                                    <div>
                                      <label htmlFor={`brand-kana-${brand.id}`} className="mb-1 block text-sm font-medium text-gray-700">
                                        読み仮名
                                      </label>
                                      <input
                                        id={`brand-kana-${brand.id}`}
                                        type="text"
                                        value={editBrandKana}
                                        onChange={(event) => setEditBrandKana(event.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                      />
                                    </div>
                                    <label className="inline-flex h-[50px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 md:self-end">
                                      <input
                                        type="checkbox"
                                        checked={editBrandIsActive}
                                        onChange={(event) => setEditBrandIsActive(event.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      有効
                                    </label>
                                    <div className="flex gap-2 md:self-end">
                                      <button
                                        type="button"
                                        onClick={() => setEditingBrandId(null)}
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 transition hover:bg-gray-100"
                                      >
                                        キャンセル
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateBrand(brand.id)}
                                        disabled={isUpdating}
                                        className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                      >
                                        {isUpdating ? "更新中..." : "更新する"}
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </section>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>
                  ) : null}
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}
