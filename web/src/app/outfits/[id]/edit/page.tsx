"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import FieldLabel from "@/components/forms/field-label";
import { FormPageHeader } from "@/components/shared/form-page-header";
import { isItemVisibleByCategorySettings } from "@/lib/api/categories";
import {
  fetchCategoryVisibilitySettings,
  fetchUserTpos,
} from "@/lib/api/settings";
import type { CreateOutfitPayload } from "@/types/outfits";
import type { ItemRecord } from "@/types/items";
import { SEASON_OPTIONS } from "@/lib/master-data/item-attributes";
import type { UserTpoRecord } from "@/types/settings";

type Item = ItemRecord;

type OutfitItem = {
  id: number;
  item_id: number;
  sort_order: number;
  item: Item;
};

type Outfit = {
  id: number;
  name: string | null;
  memo: string | null;
  seasons: string[];
  tpos: string[];
  tpo_ids?: number[];
  outfit_items?: OutfitItem[];
  outfitItems?: OutfitItem[];
};

export default function EditOutfitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [outfitId, setOutfitId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);

  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");

  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedTpoIds, setSelectedTpoIds] = useState<number[]>([]);
  const [tpoOptions, setTpoOptions] = useState<UserTpoRecord[]>([]);

  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      const { id } = await params;
      setOutfitId(Number(id));

      try {
        const [outfitRes, itemsRes, settings, tpoResponse] = await Promise.all([
          fetch(`/api/outfits/${id}`, {
            headers: { Accept: "application/json" },
          }),
          fetch("/api/items", {
            headers: { Accept: "application/json" },
          }),
          fetchCategoryVisibilitySettings().catch(() => null),
          fetchUserTpos(true).catch(() => ({ tpos: [] as UserTpoRecord[] })),
        ]);

        if (outfitRes.status === 401 || itemsRes.status === 401) {
          router.push("/login");
          return;
        }

        if (!outfitRes.ok) {
          router.push("/outfits");
          return;
        }

        const outfitData = await outfitRes.json();
        const itemsData = await itemsRes.json().catch(() => ({ items: [] }));

        const outfit: Outfit = outfitData.outfit;
        const allItems: Item[] = itemsData.items ?? [];

        const outfitItems = (outfit.outfitItems ?? outfit.outfit_items ?? [])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order);

        setName(outfit.name ?? "");
        setMemo(outfit.memo ?? "");
        setSelectedSeasons(outfit.seasons ?? []);
        setSelectedTpoIds(outfit.tpo_ids ?? []);
        const selectedInactiveTpos = (outfit.tpo_ids ?? []).map(
          (tpoId, index) => ({
            id: tpoId,
            name: outfit.tpos?.[index] ?? `TPO ${tpoId}`,
            sortOrder: 10_000 + index,
            isActive: false,
            isPreset: false,
          }),
        );
        setTpoOptions(
          [...tpoResponse.tpos, ...selectedInactiveTpos].reduce<
            UserTpoRecord[]
          >((carry, tpo) => {
            if (carry.some((current) => current.id === tpo.id)) {
              return carry;
            }

            return [...carry, tpo];
          }, []),
        );
        setSelectedItemIds(outfitItems.map((item) => item.item_id));

        const selectedIds = outfitItems.map((item) => item.item_id);
        const selectedItemsFromOutfit = outfitItems.map((item) => item.item);
        const visibleCategoryIds = settings?.visibleCategoryIds;
        const visibleItems = visibleCategoryIds
          ? allItems.filter(
              (item) =>
                selectedIds.includes(item.id) ||
                isItemVisibleByCategorySettings(item, visibleCategoryIds),
            )
          : allItems;

        const nextItems = [...selectedItemsFromOutfit, ...visibleItems].reduce<
          Item[]
        >((carry, item) => {
          if (carry.some((current) => current.id === item.id)) {
            return carry;
          }

          return [...carry, item];
        }, []);

        setItems(nextItems);
      } finally {
        setLoading(false);
        setLoadingItems(false);
      }
    }

    loadInitialData();
  }, [params, router]);

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

  const candidateItems = useMemo(() => {
    return items.filter(
      (item) => item.status === "active" || selectedItemIds.includes(item.id),
    );
  }, [items, selectedItemIds]);

  const hasDisposedSelectedItems = useMemo(() => {
    return selectedItems.some((item) => item.status === "disposed");
  }, [selectedItems]);

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

    if (hasDisposedSelectedItems) {
      nextErrors.items =
        "手放し済みのアイテムを含むため、このままでは保存できません。";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm() || !outfitId) return;

    const payload = buildPayload();

    setSubmitting(true);

    try {
      const res = await fetch(`/api/outfits/${outfitId}`, {
        method: "PUT",
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
          const firstError = Object.values(data.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            setSubmitError(String(firstError[0]));
          } else {
            setSubmitError("更新に失敗しました。");
          }
        } else {
          setSubmitError(data?.message ?? "更新に失敗しました。");
        }
        return;
      }

      setSubmitSuccess("更新に成功しました。");

      setTimeout(() => {
        router.push(`/outfits/${outfitId}`);
        router.refresh();
      }, 800);
    } catch {
      setSubmitError("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6 md:p-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-gray-600">読み込み中です...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <FormPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "コーディネート一覧", href: "/outfits" },
            ...(outfitId
              ? [{ label: "詳細", href: `/outfits/${outfitId}` }]
              : []),
            { label: "編集" },
          ]}
          eyebrow="コーディネート管理"
          title="コーディネート編集"
          description="登録済みのコーディネート内容を見直して更新します。"
          actions={
            <Link
              href={outfitId ? `/outfits/${outfitId}` : "/outfits"}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              詳細に戻る
            </Link>
          }
        />

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
            <p className="text-sm text-gray-500">
              「必須」が付いた項目は更新に必要です。
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
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
                          ? tpo.isActive
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-amber-400 bg-amber-50 text-amber-800"
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
                      {!tpo.isActive ? "（無効）" : ""}
                    </label>
                  );
                })}
                {tpoOptions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    有効な TPO はまだありません。設定から追加できます。
                  </p>
                ) : null}
              </div>
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

            {loadingItems ? (
              <p className="text-sm text-gray-600">
                アイテムを読み込み中です...
              </p>
            ) : candidateItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                登録済みアイテムがありません。先にアイテムを登録してください。
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {candidateItems.map((item) => {
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
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {item.name || "名称未設定"}
                            </p>
                            {item.status === "disposed" && (
                              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                                手放し済み
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {item.category} / {item.shape}
                          </p>
                          {item.status === "disposed" && (
                            <p className="mt-2 text-sm text-amber-800">
                              このアイテムは現在の候補には使えません
                            </p>
                          )}

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

            {hasDisposedSelectedItems && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                手放し済みのアイテムを含むため、このままでは保存できません。
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
                      {item.status === "disposed" ? " / 手放し済み" : ""}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting || loadingItems || hasDisposedSelectedItems}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "更新中..." : "更新する"}
            </button>

            <Link
              href={outfitId ? `/outfits/${outfitId}` : "/outfits"}
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
