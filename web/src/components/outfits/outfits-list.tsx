"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { isItemVisibleByCategorySettings } from "@/lib/api/categories";
import { fetchCategoryVisibilitySettings } from "@/lib/api/settings";
import { SEASON_OPTIONS, TPO_OPTIONS } from "@/lib/master-data/item-attributes";

type OutfitItem = {
  id: number;
  item_id: number;
  sort_order: number;
  item: {
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
  };
};

type Outfit = {
  id: number;
  name: string | null;
  memo: string | null;
  seasons: string[];
  tpos: string[];
  outfit_items?: OutfitItem[];
  outfitItems?: OutfitItem[];
};

type OutfitsListProps = {
  outfits: Outfit[];
  totalCount: number;
  totalAllCount: number;
  currentPage: number;
  lastPage: number;
};

type OutfitSortValue = "updated_at_desc" | "name_asc";

const DEFAULT_SORT: OutfitSortValue = "updated_at_desc";
const SORT_OPTIONS: Array<{ value: OutfitSortValue; label: string }> = [
  { value: "updated_at_desc", label: "更新順" },
  { value: "name_asc", label: "名前順" },
];

function normalizeSort(value: string | null): OutfitSortValue {
  if (value === "name_asc") {
    return value;
  }

  return DEFAULT_SORT;
}

function normalizeKeyword(value: string | null): string {
  return value?.trim() ?? "";
}

function normalizePage(value: string | null): number {
  const page = Number(value ?? "1");
  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function buildQueryString({
  keyword,
  season,
  tpo,
  sort,
  page,
}: {
  keyword: string;
  season: string;
  tpo: string;
  sort: OutfitSortValue;
  page: number;
}): string {
  const params = new URLSearchParams();

  if (keyword) {
    params.set("keyword", keyword);
  }

  if (season) {
    params.set("season", season);
  }

  if (tpo) {
    params.set("tpo", tpo);
  }

  if (sort !== DEFAULT_SORT) {
    params.set("sort", sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return params.toString();
}

export default function OutfitsList({
  outfits,
  totalCount,
  totalAllCount,
  currentPage,
  lastPage,
}: OutfitsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const keyword = normalizeKeyword(searchParams.get("keyword"));
  const seasonFilter = searchParams.get("season") ?? "";
  const tpoFilter = searchParams.get("tpo") ?? "";
  const sort = normalizeSort(searchParams.get("sort"));
  const page = normalizePage(searchParams.get("page"));

  const [isComposingKeyword, setIsComposingKeyword] = useState(false);
  const [visibleCategoryIds, setVisibleCategoryIds] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;

    fetchCategoryVisibilitySettings()
      .then((settings) => {
        if (!active) return;
        setVisibleCategoryIds(settings.visibleCategoryIds);
      })
      .catch(() => {
        // 設定取得に失敗した場合でも、一覧自体は表示する
      });

    return () => {
      active = false;
    };
  }, []);

  function updateQuery(nextValues: Partial<{
    keyword: string;
    season: string;
    tpo: string;
    sort: OutfitSortValue;
    page: number;
  }>) {
    const nextQuery = buildQueryString({
      keyword: nextValues.keyword ?? keyword,
      season: nextValues.season ?? seasonFilter,
      tpo: nextValues.tpo ?? tpoFilter,
      sort: nextValues.sort ?? sort,
      page: nextValues.page ?? page,
    });

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }

  const hasActiveFilters = Boolean(
    keyword || seasonFilter || tpoFilter || sort !== DEFAULT_SORT || currentPage > 1,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              キーワード
            </label>
            <input
              type="search"
              key={`keyword-${keyword}`}
              defaultValue={keyword}
              onChange={(e) => {
                const nextKeyword = e.target.value;
                if (!isComposingKeyword) {
                  updateQuery({ keyword: nextKeyword, page: 1 });
                }
              }}
              onCompositionStart={() => setIsComposingKeyword(true)}
              onCompositionEnd={(e) => {
                const nextKeyword = e.currentTarget.value;
                setIsComposingKeyword(false);
                updateQuery({ keyword: nextKeyword, page: 1 });
              }}
              placeholder="名前で検索"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              季節
            </label>
            <select
              value={seasonFilter}
              onChange={(e) => updateQuery({ season: e.target.value, page: 1 })}
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
              onChange={(e) => updateQuery({ tpo: e.target.value, page: 1 })}
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

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              sort
            </label>
            <select
              value={sort}
              onChange={(e) => updateQuery({ sort: normalizeSort(e.target.value), page: 1 })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            表示件数: {outfits.length} / {totalCount}
          </p>

          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="text-sm font-medium text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
            disabled={!hasActiveFilters}
          >
            条件をクリア
          </button>
        </div>
      </section>

      {outfits.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            条件に一致するコーディネートがありません
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            条件を変更するか、絞り込みをクリアしてください。
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {outfits.map((outfit) => {
            const outfitItems = outfit.outfitItems ?? outfit.outfit_items ?? [];
            const visibleOutfitItems =
              visibleCategoryIds === null
                ? outfitItems
                : outfitItems.filter((outfitItem) =>
                    isItemVisibleByCategorySettings(outfitItem.item, visibleCategoryIds),
                  );
            const itemCount = visibleOutfitItems.length;
            const hiddenItemCount = outfitItems.length - visibleOutfitItems.length;

            return (
              <Link href={`/outfits/${outfit.id}`} key={outfit.id}>
                <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:bg-gray-50">
                  <h2 className="min-h-6 text-lg font-semibold text-gray-900">
                    {outfit.name ?? ""}
                  </h2>

                  {outfit.memo && (
                    <p className="mt-2 text-sm text-gray-600">{outfit.memo}</p>
                  )}

                  <p className="mt-4 text-sm text-gray-600">
                    表示アイテム数: {itemCount}
                  </p>

                  {hiddenItemCount > 0 && (
                    <p className="mt-1 text-sm text-amber-700">
                      現在の表示設定により {hiddenItemCount} 件を非表示にしています。
                    </p>
                  )}

                  <p className="mt-2 text-sm text-gray-600">
                    季節:{" "}
                    {outfit.seasons?.length ? outfit.seasons.join(" / ") : "未設定"}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    TPO: {outfit.tpos?.length ? outfit.tpos.join(" / ") : "未設定"}
                  </p>
                </article>
              </Link>
            );
          })}
        </section>
      )}

      <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <button
          type="button"
          onClick={() => updateQuery({ page: currentPage - 1 })}
          disabled={currentPage <= 1}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          前へ
        </button>

        <p className="text-sm text-gray-600">
          {currentPage} / {lastPage}ページ
          <span className="ml-2 text-gray-400">
            （全{totalCount}件）
          </span>
        </p>
        <button
          type="button"
          onClick={() => updateQuery({ page: currentPage + 1 })}
          disabled={currentPage >= lastPage}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          次へ
        </button>
      </section>
    </div>
  );
}
