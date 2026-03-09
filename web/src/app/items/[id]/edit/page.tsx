"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ITEM_CATEGORIES,
  ITEM_SHAPES,
  type ItemCategory,
} from "@/lib/master-data/item-shapes";
import {
  ITEM_COLORS,
  type ItemColorValue,
} from "@/lib/master-data/item-colors";
import ColorChip from "@/components/items/color-chip";
import type { CreateItemPayload, ItemFormColor } from "@/types/items";

const SEASON_OPTIONS = ["春", "夏", "秋", "冬", "オール"] as const;
const TPO_OPTIONS = ["仕事", "休日", "フォーマル"] as const;

type Item = {
  id: number;
  name: string | null;
  category: string;
  shape: string;
  colors: ItemFormColor[];
  seasons: string[];
  tpos: string[];
};

export default function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [itemId, setItemId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [shape, setShape] = useState("");

  const [mainColor, setMainColor] = useState<ItemColorValue | "">("");
  const [subColor, setSubColor] = useState<ItemColorValue | "">("");

  const [useCustomMainColor, setUseCustomMainColor] = useState(false);
  const [useCustomSubColor, setUseCustomSubColor] = useState(false);

  const [customMainHex, setCustomMainHex] = useState("#3B82F6");
  const [customSubHex, setCustomSubHex] = useState("#9CA3AF");

  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedTpos, setSelectedTpos] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadItem() {
      const { id } = await params;
      setItemId(Number(id));

      try {
        const res = await fetch(`/api/items/${id}`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          router.push("/items");
          return;
        }

        const data = await res.json();
        const item: Item = data.item;

        setName(item.name ?? "");
        setCategory(item.category as ItemCategory);
        setShape(item.shape);
        setSelectedSeasons(item.seasons ?? []);
        setSelectedTpos(item.tpos ?? []);

        const main = item.colors.find((c) => c.role === "main");
        const sub = item.colors.find((c) => c.role === "sub");

        if (main) {
          if (main.mode === "custom") {
            setUseCustomMainColor(true);
            setCustomMainHex(main.hex);
            setMainColor("");
          } else {
            setUseCustomMainColor(false);
            setMainColor(main.value as ItemColorValue);
          }
        }

        if (sub) {
          if (sub.mode === "custom") {
            setUseCustomSubColor(true);
            setCustomSubHex(sub.hex);
            setSubColor("");
          } else {
            setUseCustomSubColor(false);
            setSubColor(sub.value as ItemColorValue);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [params, router]);

  const shapeOptions = useMemo(() => {
    if (!category) return [];
    return ITEM_SHAPES[category];
  }, [category]);

  const selectedMainColor = useMemo(() => {
    if (useCustomMainColor) {
      return {
        label: "カスタムカラー",
        hex: customMainHex,
      };
    }

    return ITEM_COLORS.find((color) => color.value === mainColor) ?? null;
  }, [useCustomMainColor, customMainHex, mainColor]);

  const selectedSubColor = useMemo(() => {
    if (useCustomSubColor) {
      return {
        label: "カスタムカラー",
        hex: customSubHex,
      };
    }

    return ITEM_COLORS.find((color) => color.value === subColor) ?? null;
  }, [useCustomSubColor, customSubHex, subColor]);

  function handleCategoryChange(nextCategory: string) {
    setCategory(nextCategory as ItemCategory | "");
    setShape("");
  }

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

  function buildPayload(): CreateItemPayload {
    const colors: ItemFormColor[] = [];

    if (selectedMainColor) {
      colors.push({
        role: "main",
        mode: useCustomMainColor ? "custom" : "preset",
        value: useCustomMainColor ? customMainHex : mainColor,
        hex: selectedMainColor.hex,
        label: selectedMainColor.label,
      });
    }

    if (selectedSubColor) {
      colors.push({
        role: "sub",
        mode: useCustomSubColor ? "custom" : "preset",
        value: useCustomSubColor ? customSubHex : subColor,
        hex: selectedSubColor.hex,
        label: selectedSubColor.label,
      });
    }

    return {
      name,
      category,
      shape,
      colors,
      seasons: selectedSeasons,
      tpos: selectedTpos,
    };
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!category) {
      nextErrors.category = "カテゴリを選択してください。";
    }

    if (!shape) {
      nextErrors.shape = "形を選択してください。";
    }

    if (!selectedMainColor) {
      nextErrors.mainColor = "メインカラーを選択してください。";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm() || !itemId) return;

    const payload = buildPayload();

    setSubmitting(true);

    try {
      const res = await fetch(`/api/items/${itemId}`, {
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
        router.push(`/items/${itemId}`);
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
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-gray-600">読み込み中です...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <Link href="/items" className="hover:underline">
            アイテム一覧
          </Link>
          {" / "}
          <span className="text-gray-700">編集</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">アイテム管理</p>
            <h1 className="text-2xl font-bold text-gray-900">アイテム編集</h1>
          </div>

          <Link
            href={itemId ? `/items/${itemId}` : "/items"}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            詳細に戻る
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          {/* ここから下は items/new のフォーム本体をほぼそのまま流用 */}
          {/* 基本情報 */}
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
                placeholder="例：ネイビーのシャツ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                カテゴリ
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                  errors.category ? "border-red-400" : "border-gray-300"
                }`}
              >
                <option value="">選択してください</option>
                {ITEM_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-2 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="shape"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                形
              </label>
              <select
                id="shape"
                value={shape}
                onChange={(e) => setShape(e.target.value)}
                disabled={!category}
                className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                  errors.shape ? "border-red-400" : "border-gray-300"
                }`}
              >
                <option value="">
                  {category ? "選択してください" : "先にカテゴリを選択してください"}
                </option>
                {shapeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.shape && (
                <p className="mt-2 text-sm text-red-600">{errors.shape}</p>
              )}
            </div>
          </section>

          {/* 色 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">色</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label
                  htmlFor="main-color"
                  className="block text-sm font-medium text-gray-700"
                >
                  メインカラー
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={useCustomMainColor}
                    onChange={(e) => {
                      setUseCustomMainColor(e.target.checked);
                      if (e.target.checked) {
                        setMainColor("");
                      }
                    }}
                    className="h-4 w-4"
                  />
                  カスタムカラーを使う
                </label>

                {useCustomMainColor ? (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3">
                    <input
                      type="color"
                      value={customMainHex}
                      onChange={(e) => setCustomMainHex(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
                    />
                    <input
                      type="text"
                      value={customMainHex}
                      onChange={(e) => setCustomMainHex(e.target.value)}
                      className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                        errors.mainColor ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                  </div>
                ) : (
                  <select
                    id="main-color"
                    value={mainColor}
                    onChange={(e) =>
                      setMainColor(e.target.value as ItemColorValue | "")
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">選択してください</option>
                    {ITEM_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                )}

                {errors.mainColor && (
                  <p className="mt-2 text-sm text-red-600">{errors.mainColor}</p>
                )}
              </div>

              <div className="space-y-3">
                <label
                  htmlFor="sub-color"
                  className="block text-sm font-medium text-gray-700"
                >
                  サブカラー
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={useCustomSubColor}
                    onChange={(e) => {
                      setUseCustomSubColor(e.target.checked);
                      if (e.target.checked) {
                        setSubColor("");
                      }
                    }}
                    className="h-4 w-4"
                  />
                  カスタムカラーを使う
                </label>

                {useCustomSubColor ? (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3">
                    <input
                      type="color"
                      value={customSubHex}
                      onChange={(e) => setCustomSubHex(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
                    />
                    <input
                      type="text"
                      value={customSubHex}
                      onChange={(e) => setCustomSubHex(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                ) : (
                  <select
                    id="sub-color"
                    value={subColor}
                    onChange={(e) =>
                      setSubColor(e.target.value as ItemColorValue | "")
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">未選択</option>
                    {ITEM_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {(selectedMainColor || selectedSubColor) && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-sm font-medium text-gray-700">
                  選択中の色
                </p>

                <div className="flex flex-wrap gap-2">
                  {selectedMainColor && (
                    <ColorChip
                      label={selectedMainColor.label}
                      hex={selectedMainColor.hex}
                      tone="main"
                    />
                  )}
                  {selectedSubColor && (
                    <ColorChip
                      label={selectedSubColor.label}
                      hex={selectedSubColor.hex}
                      tone="sub"
                    />
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 季節・TPO */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">季節・TPO</h2>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">季節</p>
              <p className="mt-2 text-xs text-gray-500">
                未選択の場合はオールシーズン扱いになります。
              </p>
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

              {selectedSeasons.length > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  選択中: {selectedSeasons.join(" / ")}
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">TPO</p>
              <p className="mt-2 text-xs text-gray-500">
                未選択の場合はすべてのシーンで使用可能として扱います。
              </p>
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

              {selectedTpos.length > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  選択中: {selectedTpos.join(" / ")}
                </p>
              )}
            </div>
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "更新中..." : "更新する"}
            </button>

            <Link
              href={itemId ? `/items/${itemId}` : "/items"}
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
