"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import OutfitDuplicateAction from "@/components/outfits/outfit-duplicate-action";
import { SEASON_OPTIONS, TPO_OPTIONS } from "@/lib/master-data/item-attributes";

type Outfit = {
  id: number;
  status: "active" | "invalid";
  name: string | null;
  memo: string | null;
  seasons: string[];
  tpos: string[];
};

type InvalidOutfitsListProps = {
  outfits: Outfit[];
  totalCount: number;
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

export default function InvalidOutfitsList({
  outfits,
  totalCount,
  currentPage,
  lastPage,
}: InvalidOutfitsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const keyword = normalizeKeyword(searchParams.get("keyword"));
  const seasonFilter = searchParams.get("season") ?? "";
  const tpoFilter = searchParams.get("tpo") ?? "";
  const sort = normalizeSort(searchParams.get("sort"));
  const page = normalizePage(searchParams.get("page"));

  const [isComposingKeyword, setIsComposingKeyword] = useState(false);
  const [draftKeyword, setDraftKeyword] = useState(keyword);

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  const updateQuery = useCallback((nextValues: Partial<{
    keyword: string;
    season: string;
    tpo: string;
    sort: OutfitSortValue;
    page: number;
  }>) => {
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
  }, [keyword, page, pathname, router, seasonFilter, sort, tpoFilter]);

  useEffect(() => {
    if (isComposingKeyword || draftKeyword === keyword) {
      return;
    }

    const timerId = window.setTimeout(() => {
      updateQuery({ keyword: draftKeyword, page: 1 });
    }, 250);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [draftKeyword, isComposingKeyword, keyword, updateQuery]);

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
              value={draftKeyword}
              onChange={(e) => {
                setDraftKeyword(e.target.value);
              }}
              onCompositionStart={() => setIsComposingKeyword(true)}
              onCompositionEnd={(e) => {
                setIsComposingKeyword(false);
                setDraftKeyword(e.currentTarget.value);
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
            無効なコーディネートはありません
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            現在は通常利用できないコーディネートはありません。
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {outfits.map((outfit) => (
            <article
              key={outfit.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="min-h-6 text-lg font-semibold text-gray-900">
                  {outfit.name || "名称未設定"}
                </h2>
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                  無効
                </span>
              </div>

              {outfit.memo && (
                <p className="mt-2 text-sm text-gray-600">{outfit.memo}</p>
              )}

              <p className="mt-4 text-sm text-gray-600">
                季節: {outfit.seasons?.length ? outfit.seasons.join(" / ") : "未設定"}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                TPO: {outfit.tpos?.length ? outfit.tpos.join(" / ") : "未設定"}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/outfits/${outfit.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  詳細
                </Link>
                <Link
                  href={`/outfits/${outfit.id}/edit`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  編集
                </Link>
                <OutfitDuplicateAction outfitId={outfit.id} />
              </div>
            </article>
          ))}
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
