"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isItemVisibleByCategorySettings } from "@/lib/api/categories";
import { fetchCategoryVisibilitySettings } from "@/lib/api/settings";
import type { CreateOutfitPayload } from "@/types/outfits";

const SEASON_OPTIONS = ["春", "夏", "秋", "冬", "オール"] as const;
const TPO_OPTIONS = ["仕事", "休日", "フォーマル"] as const;

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

export default function NewOutfitPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");

  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedTpos, setSelectedTpos] = useState<string[]>([]);

  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitPreview, setSubmitPreview] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadItems() {
      setLoadingItems(true);

      try {
        const [res, settings] = await Promise.all([
          fetch("/api/items", {
            headers: {
              Accept: "application/json",
            },
          }),
          fetchCategoryVisibilitySettings(),
        ]);

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setSubmitError(data?.message ?? "アイテム一覧の取得に失敗しました。");
          return;
        }

        const visibleCategoryIds = settings.visibleCategoryIds;
        const nextItems = (data?.items ?? []).filter((item: Item) =>
          isItemVisibleByCategorySettings(item, visibleCategoryIds),
        );

        setItems(nextItems);
      } catch {
        setSubmitError("アイテム一覧の取得に失敗しました。");
      } finally {
        setLoadingItems(false);
      }
    }

    loadItems();
  }, [router]);

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

  function handleTpoToggle(tpo: string) {
    setSelectedTpos((prev) => {
      if (prev.includes(tpo)) {
        return prev.filter((item) => item !== tpo);
      }

      return [...prev, tpo];
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
      tpos: selectedTpos,
      items: selectedItemIds.map((itemId, index) => ({
        item_id: itemId,
        sort_order: index,
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
    setSubmitPreview("");

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
          const firstError = Object.values(data.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            setSubmitError(String(firstError[0]));
          } else {
            setSubmitError("コーディネートの登録に失敗しました。");
          }
        } else {
          setSubmitError(data?.message ?? "コーディネートの登録に失敗しました。");
        }
        return;
      }

      setSubmitPreview(JSON.stringify(data, null, 2));
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
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:underline">
          ホーム
        </Link>
        {" / "}
        <Link href="/outfits" className="hover:underline">
          コーディネート一覧
        </Link>
        {" / "}
        <span className="text-gray-700">新規登録</span>
      </nav>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">コーディネート管理</p>
            <h1 className="text-2xl font-bold text-gray-900">コーディネート登録</h1>
          </div>

          <Link
            href="/outfits"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            一覧に戻る
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>

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
                {TPO_OPTIONS.map((tpo) => {
                  const checked = selectedTpos.includes(tpo);

                  return (
                    <label
                      key={tpo}
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
                        onChange={() => handleTpoToggle(tpo)}
                      />
                      {tpo}
                    </label>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">アイテム選択</h2>

              <span className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                選択中 {selectedItemIds.length} 件
              </span>
            </div>

            {selectedItemIds.length === 0 && !loadingItems && items.length > 0 && (
              <p className="text-sm text-gray-500">
                コーディネートに含めるアイテムを1つ以上選択してください。
              </p>
            )}

            {loadingItems ? (
              <p className="text-sm text-gray-600">アイテムを読み込み中です...</p>
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
                      {index + 1}. {item.name || "名称未設定"} ({item.category} / {item.shape})
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

          {submitPreview && (
            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-800">
                送信プレビュー
              </h2>
              <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                {submitPreview}
              </pre>
            </section>
          )}
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
