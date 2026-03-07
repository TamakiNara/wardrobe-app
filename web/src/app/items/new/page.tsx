"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

const SEASON_OPTIONS = ["春", "夏", "秋", "冬", "オール"] as const;
const TPO_OPTIONS = ["仕事", "休日", "フォーマル"] as const;

export default function NewItemPage() {
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [shape, setShape] = useState("");
  const [mainColor, setMainColor] = useState<ItemColorValue | "">("");
  const [subColor, setSubColor] = useState<ItemColorValue | "">("");

  const shapeOptions = useMemo(() => {
    if (!category) return [];
    return ITEM_SHAPES[category];
  }, [category]);

  const selectedMainColor = ITEM_COLORS.find((color) => color.value === mainColor);
  const selectedSubColor = ITEM_COLORS.find((color) => color.value === subColor);

  function handleCategoryChange(nextCategory: string) {
    setCategory(nextCategory as ItemCategory | "");
    setShape("");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">アイテム管理</p>
            <h1 className="text-2xl font-bold text-gray-900">アイテム登録</h1>
          </div>

          <Link
            href="/items"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            一覧に戻る
          </Link>
        </div>

        <form className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">選択してください</option>
                {ITEM_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">色</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="main-color"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  メインカラー
                </label>
                <select
                  id="main-color"
                  value={mainColor}
                  onChange={(e) => setMainColor(e.target.value as ItemColorValue | "")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">選択してください</option>
                  {ITEM_COLORS.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="sub-color"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  サブカラー
                </label>
                <select
                  id="sub-color"
                  value={subColor}
                  onChange={(e) => setSubColor(e.target.value as ItemColorValue | "")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">未選択</option>
                  {ITEM_COLORS.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
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

                {mainColor && subColor && mainColor === subColor && (
                  <p className="mt-3 text-sm text-amber-600">
                    メインカラーとサブカラーが同じです。意図した選択か確認してください。
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">季節・TPO</h2>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">季節</p>
              <div className="flex flex-wrap gap-3">
                {SEASON_OPTIONS.map((season) => (
                  <label
                    key={season}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <input type="checkbox" className="h-4 w-4" />
                    {season}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">TPO</p>
              <div className="flex flex-wrap gap-3">
                {TPO_OPTIONS.map((tpo) => (
                  <label
                    key={tpo}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <input type="checkbox" className="h-4 w-4" />
                    {tpo}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              登録する
            </button>

            <Link
              href="/items"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
