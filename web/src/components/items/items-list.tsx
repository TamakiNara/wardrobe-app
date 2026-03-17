"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TopsPreviewSvg from "@/components/items/preview-svg/tops-preview-svg";
import {
  ITEM_CATEGORIES,
  findItemCategoryLabel,
  findItemShapeLabel,
} from "@/lib/master-data/item-shapes";
import { buildSupportedCategoryOptions, fetchCategoryGroups } from "@/lib/api/categories";
import { fetchCategoryVisibilitySettings } from "@/lib/api/settings";
import type { CategoryOption } from "@/types/categories";

type ItemsListProps = {
  items: ItemRecord[];
};

function PreviewThumb({
  item,
  mainColorHex,
  subColorHex,
}: {
  item: ItemRecord;
  mainColorHex?: string;
  subColorHex?: string;
}) {
  const topsSpec = item.spec?.tops;

  if (item.category === "tops" && topsSpec?.shape) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">
        <TopsPreviewSvg
          shape={topsSpec.shape}
          sleeve={topsSpec.sleeve ?? undefined}
          neck={topsSpec.neck ?? undefined}
          design={topsSpec.design ?? undefined}
          fit={topsSpec.fit ?? undefined}
          mainColor={mainColorHex}
          subColor={subColorHex}
        />
      </div>
    );
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">
      <div
        className="h-12 w-12 rounded-2xl border border-gray-300"
        style={{ backgroundColor: mainColorHex ?? "#E5E7EB" }}
      />
    </div>
  );
}

export default function ItemsList({ items }: ItemsListProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [apiCategoryOptions, setApiCategoryOptions] = useState<CategoryOption[]>(ITEM_CATEGORIES);
  const [seasonFilter, setSeasonFilter] = useState("");
  const [tpoFilter, setTpoFilter] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchCategoryGroups(),
      fetchCategoryVisibilitySettings(),
    ])
      .then(([groups, settings]) => {
        if (!active) return;
        const nextOptions = buildSupportedCategoryOptions(
          groups,
          settings.visibleCategoryIds,
        );
        setApiCategoryOptions(nextOptions);
      })
      .catch(() => {
        // 一覧の絞り込みは取得失敗時に固定 master data へフォールバックする
      });

    return () => {
      active = false;
    };
  }, []);

  const categoryOptions = useMemo(() => {
    return apiCategoryOptions.filter((category) =>
      items.some((item) => item.category === category.value),
    );
  }, [apiCategoryOptions, items]);


  const seasonOptions = useMemo(() => {
    return Array.from(
      new Set(items.flatMap((item) => item.seasons ?? [])),
    ).sort();
  }, [items]);

  const tpoOptions = useMemo(() => {
    return Array.from(new Set(items.flatMap((item) => item.tpos ?? []))).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const seasons = item.seasons ?? [];
      const tpos = item.tpos ?? [];

      const matchCategory = categoryFilter
        ? item.category === categoryFilter
        : true;
      const matchSeason = seasonFilter ? seasons.includes(seasonFilter) : true;
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
                <option key={category.value} value={category.value}>
                  {category.label}
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
              {seasonOptions.map((season) => (
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
              {tpoOptions.map((tpo) => (
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
            const categoryLabel = findItemCategoryLabel(item.category);
            const shapeLabel = findItemShapeLabel(item.category, item.shape);

            return (
              <Link href={`/items/${item.id}`} key={item.id}>
                <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <PreviewThumb
                      item={item}
                      mainColorHex={mainColor?.hex}
                      subColorHex={subColor?.hex}
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {item.name || "名称未設定"}
                      </h2>

                      <p className="mt-2 text-sm text-gray-600">
                        {categoryLabel} / {shapeLabel}
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
