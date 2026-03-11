"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ItemColor = {
  role: "main" | "sub";
  mode: "preset" | "custom";
  value: string;
  hex: string;
  label: string;
};

type Item = {
  id: number;
  name: string | null;
  category: string;
  shape: string;
  colors: ItemColor[];
  seasons: string[];
  tpos: string[];
};

type ItemsListProps = {
  items: Item[];
};

const SEASON_OPTIONS = ["春", "夏", "秋", "冬", "オール"] as const;
const TPO_OPTIONS = ["仕事", "休日", "フォーマル"] as const;

export default function ItemsList({ items }: ItemsListProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");
  const [tpoFilter, setTpoFilter] = useState("");

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.category))).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const seasons = item.seasons ?? [];
      const tpos = item.tpos ?? [];

      const isAllSeason = seasons.length === 0 || seasons.includes("オール");

      const matchCategory = categoryFilter
        ? item.category === categoryFilter
        : true;

      const matchSeason = seasonFilter
        ? seasonFilter === "オール"
          ? isAllSeason
          : seasons.includes(seasonFilter) || isAllSeason
        : true;

      const matchTpo = tpoFilter ? tpos.includes(tpoFilter) : true;

      return matchCategory && matchSeason && matchTpo;
    });
  }, [items, categoryFilter, seasonFilter, tpoFilter]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              カテゴリ
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">すべて</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              季節
            </label>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">すべて</option>
              {SEASON_OPTIONS.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              TPO
            </label>
            <select
              value={tpoFilter}
              onChange={(e) => setTpoFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">すべて</option>
              {TPO_OPTIONS.map((tpo) => (
                <option key={tpo} value={tpo}>
                  {tpo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            表示件数: {filteredItems.length} / {items.length}
          </p>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter("");
              setSeasonFilter("");
              setTpoFilter("");
            }}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            絞り込みをクリア
          </button>
        </div>
      </section>

      {filteredItems.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            条件に一致するアイテムがありません
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            条件を変更するか、絞り込みをクリアしてください。
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const mainColor = item.colors.find((c) => c.role === "main");
            const subColor = item.colors.find((c) => c.role === "sub");

            return (
              <Link href={`/items/${item.id}`} key={item.id}>
                <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <ShapeIcon
                      shape={item.shape}
                      mainColor={mainColor?.hex ?? "#CBD5E1"}
                      subColor={subColor?.hex}
                      className="h-20 w-20 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {item.name || "名称未設定"}
                      </h2>

                      <p className="mt-2 text-sm text-gray-600">
                        {item.category} / {item.shape}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {mainColor && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-sm">
                            <span
                              className="h-4 w-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: mainColor.hex }}
                            />
                            {mainColor.label}
                          </span>
                        )}
                        {subColor && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm">
                            <span
                              className="h-4 w-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: subColor.hex }}
                            />
                            {subColor.label}
                          </span>
                        )}
                      </div>

                      <p className="mt-4 text-sm text-gray-600">
                        季節: {item.seasons?.length ? item.seasons.join(" / ") : "未設定"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        TPO: {item.tpos?.length ? item.tpos.join(" / ") : "未設定"}
                      </p>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
