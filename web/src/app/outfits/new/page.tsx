"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FieldLabel from "@/components/forms/field-label";
import { FormPageHeader } from "@/components/shared/form-page-header";
import {
  flattenValidationErrors,
  getUserFacingSubmitErrorMessage,
} from "@/lib/api/error-message";
import { isItemVisibleByCategorySettings } from "@/lib/api/categories";
import {
  fetchCategoryVisibilitySettings,
  fetchUserTpos,
} from "@/lib/api/settings";
import {
  clearOutfitDuplicatePayload,
  loadOutfitDuplicatePayload,
  mapOutfitDuplicatePayloadToDraft,
  type DuplicateUnavailableItem,
} from "@/lib/outfits/duplicate";
import type { CreateOutfitPayload } from "@/types/outfits";
import { SEASON_OPTIONS } from "@/lib/master-data/item-attributes";
import type { UserTpoRecord } from "@/types/settings";

type Item = {
  id: number;
  name: string | null;
  category: string;
  shape: string;
  colors: {
    role: "main" | "sub";
    mode: "preset" | "custom";
    value: string;
    hex: string;
    label: string;
  }[];
  seasons: string[];
  tpos: string[];
};

const OUTFIT_ITEMS_LOAD_ERROR_MESSAGE =
  "アイテム一覧の取得に失敗しました。時間をおいて再度お試しください。";
const OUTFIT_CREATE_ERROR_MESSAGE =
  "コーディネートの登録に失敗しました。時間をおいて再度お試しください。";

export default function NewOutfitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasAppliedDuplicateDraftRef = useRef(false);

  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");

  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedTpoIds, setSelectedTpoIds] = useState<number[]>([]);
  const [tpoOptions, setTpoOptions] = useState<UserTpoRecord[]>([]);

  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [duplicateUnavailableItems, setDuplicateUnavailableItems] = useState<
    DuplicateUnavailableItem[]
  >([]);

  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [initializationSuccess, setInitializationSuccess] = useState<
    string | null
  >(null);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadItems() {
      setLoadingItems(true);

      try {
        const [res, settings, tpoResponse] = await Promise.all([
          fetch("/api/items", {
            headers: {
              Accept: "application/json",
            },
          }),
          fetchCategoryVisibilitySettings().catch(() => null),
          fetchUserTpos(true).catch(() => ({ tpos: [] as UserTpoRecord[] })),
        ]);

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setSubmitError(
            getUserFacingSubmitErrorMessage(
              data,
              OUTFIT_ITEMS_LOAD_ERROR_MESSAGE,
            ),
          );
          return;
        }

        const visibleCategoryIds = settings?.visibleCategoryIds;
        const nextItems = visibleCategoryIds
          ? (data?.items ?? []).filter((item: Item) =>
              isItemVisibleByCategorySettings(item, visibleCategoryIds),
            )
          : (data?.items ?? []);

        setItems(nextItems);
        setTpoOptions(tpoResponse.tpos);
      } catch {
        setSubmitError("アイテム一覧の取得に失敗しました。");
      } finally {
        setLoadingItems(false);
      }
    }

    loadItems();
  }, [router]);

  useEffect(() => {
    if (searchParams.get("source") !== "duplicate") {
      return;
    }

    if (hasAppliedDuplicateDraftRef.current) {
      return;
    }

    hasAppliedDuplicateDraftRef.current = true;

    const payload = loadOutfitDuplicatePayload();
    clearOutfitDuplicatePayload();
    router.replace("/outfits/new");
    setInitializationError(null);
    setInitializationSuccess(null);

    if (!payload) {
      setInitializationError(
        "複製の初期値を読み込めませんでした。通常の新規作成として続けてください。",
      );
      return;
    }

    const draft = mapOutfitDuplicatePayloadToDraft(payload);

    setName(draft.name);
    setMemo(draft.memo);
    setSelectedSeasons(draft.seasons);
    setSelectedTpoIds(draft.tpoIds);
    setTpoOptions((current) =>
      [
        ...current,
        ...draft.tpoIds.map((tpoId, index) => ({
          id: tpoId,
          name: draft.tpos[index] ?? `TPO ${tpoId}`,
          sortOrder: 10_000 + index,
          isActive: false,
          isPreset: false,
        })),
      ].reduce<UserTpoRecord[]>((carry, tpo) => {
        if (carry.some((currentTpo) => currentTpo.id === tpo.id)) {
          return carry;
        }

        return [...carry, tpo];
      }, []),
    );
    setSelectedItemIds(draft.selectedItemIds);
    setDuplicateUnavailableItems(draft.unavailableItems);
    setErrors({});
    setInitializationSuccess("複製元の内容を初期値として読み込みました。");
  }, [router, searchParams]);

  function handleSeasonToggle(season: string) {
    setSelectedSeasons((prev) => {
      const isSelected = prev.includes(season);

      if (season === "オール") {
        return isSelected ? [] : ["オール"];
      }

      const withoutAll = prev.filter((item) => item !== "オール");

      if (isSelected) {
        return withoutAll.filter((item) => item !== season);
      }

      return [...withoutAll, season];
    });
  }

  function handleTpoToggle(tpoId: number) {
    setSelectedTpoIds((prev) => {
      if (prev.includes(tpoId)) {
        return prev.filter((item) => item !== tpoId);
      }

      return [...prev, tpoId];
    });
  }

  function handleItemToggle(itemId: number) {
    setSelectedItemIds((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }

      return [...prev, itemId];
    });
  }

  const selectedItems = useMemo(() => {
    return selectedItemIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is Item => Boolean(item));
  }, [selectedItemIds, items]);

  function buildPayload(): CreateOutfitPayload {
    return {
      name,
      memo,
      seasons: selectedSeasons,
      tpo_ids: selectedTpoIds,
      items: selectedItemIds.map((itemId, index) => ({
        item_id: itemId,
        sort_order: index + 1,
      })),
    };
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (selectedItemIds.length === 0) {
      nextErrors.items = "アイテムを1つ以上選択してください。";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm()) return;

    const payload = buildPayload();

    setSubmitting(true);

    try {
      const res = await fetch("/api/outfits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        setSubmitError("セッションが切れました。再度ログインしてください。");

        setTimeout(() => {
          router.push("/login");
        }, 800);

        return;
      }

      if (!res.ok) {
        if (data?.errors) {
          const nextErrors = flattenValidationErrors(data);
          setErrors(nextErrors);

          if (Object.keys(nextErrors).length === 0) {
            setSubmitError(OUTFIT_CREATE_ERROR_MESSAGE);
          }
        } else {
          setSubmitError(
            getUserFacingSubmitErrorMessage(data, OUTFIT_CREATE_ERROR_MESSAGE),
          );
        }
        return;
      }

      setSubmitSuccess("コーディネートの登録に成功しました。");

      setTimeout(() => {
        router.push("/outfits");
        router.refresh();
      }, 800);
    } catch {
      setSubmitError("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <FormPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "コーディネート一覧", href: "/outfits" },
            { label: "新規登録" },
          ]}
          eyebrow="コーディネート管理"
          title="コーディネート登録"
          description="組み合わせるアイテムや季節・TPOを選んで、新しいコーディネートを登録します。"
          actions={
            <Link
              href="/outfits"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              一覧に戻る
            </Link>
          }
        />

        {initializationError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {initializationError}
          </div>
        )}

        {initializationSuccess && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {initializationSuccess}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
            <p className="text-sm text-gray-500">
              「必須」が付いた項目は登録に必要です。
            </p>

            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                名前
              </label>
              <input
                id="name"
                type="text"
                placeholder="未入力でも登録できます"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-lg bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:ring-2 ${
                  errors.name
                    ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="memo"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                メモ
              </label>
              <textarea
                id="memo"
                rows={3}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className={`w-full rounded-lg bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 ${
                  errors.memo
                    ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />
              {errors.memo && (
                <p className="mt-2 text-sm text-red-600">{errors.memo}</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">季節・TPO</h2>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">季節</p>
              <div className="flex flex-wrap gap-3">
                {SEASON_OPTIONS.map((season) => {
                  const checked = selectedSeasons.includes(season);

                  return (
                    <label
                      key={season}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        checked
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => handleSeasonToggle(season)}
                      />
                      {season}
                    </label>
                  );
                })}
              </div>
              {errors.seasons && (
                <p className="mt-2 text-sm text-red-600">{errors.seasons}</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">TPO</p>
              <div className="flex flex-wrap gap-3">
                {tpoOptions.map((tpo) => {
                  const checked = selectedTpoIds.includes(tpo.id);

                  return (
                    <label
                      key={tpo.id}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        checked
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => handleTpoToggle(tpo.id)}
                      />
                      {tpo.name}
                    </label>
                  );
                })}
                {tpoOptions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    有効な TPO はまだありません。設定から追加できます。
                  </p>
                ) : null}
              </div>
              {errors.tpo_ids && (
                <p className="mt-2 text-sm text-red-600">{errors.tpo_ids}</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <FieldLabel
                as="div"
                label="アイテム選択"
                required
                className="text-lg font-semibold text-gray-900"
              />

              <span className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                選択中 {selectedItemIds.length} 件
              </span>
            </div>

            {duplicateUnavailableItems.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-800">
                  元のコーディネートで使われていた一部アイテムは現在利用できないため、初期選択から外しました。
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {duplicateUnavailableItems.map((item) => (
                    <li key={`${item.itemId}-${item.sortOrder}`}>
                      {item.sortOrder}番目のアイテム: {item.note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedItemIds.length === 0 &&
              !loadingItems &&
              items.length > 0 && (
                <p className="text-sm text-gray-500">
                  コーディネートに含めるアイテムを1つ以上選択してください。
                </p>
              )}

            {loadingItems ? (
              <p className="text-sm text-gray-600">
                アイテムを読み込み中です...
              </p>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                登録済みアイテムがありません。先にアイテムを登録してください。
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((item) => {
                  const checked = selectedItemIds.includes(item.id);
                  const mainColor = item.colors.find((c) => c.role === "main");

                  return (
                    <label
                      key={item.id}
                      className={`rounded-xl border p-4 transition ${
                        checked
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={checked}
                          onChange={() => handleItemToggle(item.id)}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">
                            {item.name || "名称未設定"}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {item.category} / {item.shape}
                          </p>

                          {mainColor && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-sm">
                              <span
                                className="h-4 w-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: mainColor.hex }}
                              />
                              {mainColor.label}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {errors.items && (
              <p className="mt-2 text-sm text-red-600">{errors.items}</p>
            )}

            {selectedItems.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-sm font-medium text-gray-700">
                  選択中の順序
                </p>
                <ol className="space-y-2 text-sm text-gray-700">
                  {selectedItems.map((item, index) => (
                    <li key={item.id}>
                      {index + 1}. {item.name || "名称未設定"} ({item.category}{" "}
                      / {item.shape})
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting || loadingItems}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "送信中..." : "登録する"}
            </button>

            <Link
              href="/outfits"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              キャンセル
            </Link>
          </div>
        </form>

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {submitSuccess}
          </div>
        )}
      </div>
    </main>
  );
}
