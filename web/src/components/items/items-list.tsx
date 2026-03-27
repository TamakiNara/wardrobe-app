"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TopsPreviewSvg from "@/components/items/preview-svg/tops-preview-svg";
import { buildSupportedCategoryOptions, fetchCategoryGroups } from "@/lib/api/categories";
import { buildClosetViewGroups } from "@/lib/items/closet-view";
import { fetchCategoryVisibilitySettings } from "@/lib/api/settings";
import { ITEM_CARE_STATUS_LABELS } from "@/lib/items/metadata";
import {
  ITEM_CATEGORIES as ITEM_CATEGORY_OPTIONS,
  findItemCategoryLabel,
  findItemShapeLabel,
} from "@/lib/master-data/item-shapes";
import type { CategoryOption } from "@/types/categories";
import type { ItemRecord } from "@/types/items";

type ItemsListProps = {
  items: ItemRecord[];
  totalCount: number;
  totalAllCount: number;
  currentPage: number;
  lastPage: number;
  availableCategoryValues: string[];
  availableSeasons: string[];
  availableTpos: string[];
  initialSeasonFilter?: string;
};

type ItemSortValue = "updated_at_desc" | "name_asc";
type ItemListViewMode = "list" | "closet";

const DEFAULT_SORT: ItemSortValue = "updated_at_desc";
const SORT_OPTIONS: Array<{ value: ItemSortValue; label: string }> = [
  { value: "updated_at_desc", label: "更新順" },
  { value: "name_asc", label: "名前順" },
];

const DEFAULT_VIEW_MODE: ItemListViewMode = "list";

function normalizeSort(value: string | null): ItemSortValue {
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
  category,
  season,
  tpo,
  sort,
  page,
}: {
  keyword: string;
  category: string;
  season: string;
  tpo: string;
  sort: ItemSortValue;
  page: number;
}): string {
  const params = new URLSearchParams();

  if (keyword) {
    params.set("keyword", keyword);
  }

  if (category) {
    params.set("category", category);
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
  const primaryImage = item.images?.find((image) => image.is_primary)
    ?? item.images?.[0];

  if (primaryImage?.url) {
    return (
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage.url}
          alt={primaryImage.original_filename ?? item.name ?? "item image"}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

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

export default function ItemsList({
  items,
  totalCount,
  currentPage,
  lastPage,
  availableCategoryValues,
  availableSeasons,
  availableTpos,
  initialSeasonFilter = "",
}: ItemsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const keyword = normalizeKeyword(searchParams.get("keyword"));
  const categoryFilter = searchParams.get("category") ?? "";
  const seasonFilter = searchParams.get("season") ?? "";
  const tpoFilter = searchParams.get("tpo") ?? "";
  const sort = normalizeSort(searchParams.get("sort"));
  const page = normalizePage(searchParams.get("page"));

  const [isComposingKeyword, setIsComposingKeyword] = useState(false);
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [apiCategoryOptions, setApiCategoryOptions] = useState<CategoryOption[]>([
    ...ITEM_CATEGORY_OPTIONS,
  ]);
  const [viewMode, setViewMode] = useState<ItemListViewMode>(DEFAULT_VIEW_MODE);
  const initialSeasonAppliedRef = useRef(false);

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  const updateQuery = useCallback((nextValues: Partial<{
    keyword: string;
    category: string;
    season: string;
    tpo: string;
    sort: ItemSortValue;
    page: number;
  }>) => {
    const nextQuery = buildQueryString({
      keyword: nextValues.keyword ?? keyword,
      category: nextValues.category ?? categoryFilter,
      season: nextValues.season ?? seasonFilter,
      tpo: nextValues.tpo ?? tpoFilter,
      sort: nextValues.sort ?? sort,
      page: nextValues.page ?? page,
    });

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [categoryFilter, keyword, page, pathname, router, seasonFilter, sort, tpoFilter]);

  useEffect(() => {
    if (initialSeasonAppliedRef.current) {
      return;
    }

    if (!initialSeasonFilter || seasonFilter) {
      return;
    }

    initialSeasonAppliedRef.current = true;
    updateQuery({ season: initialSeasonFilter, page: 1 });
  }, [initialSeasonFilter, seasonFilter, updateQuery]);

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

  const categoryOptions = useMemo(() => {
    return apiCategoryOptions.filter((category) =>
      availableCategoryValues.includes(category.value),
    );
  }, [apiCategoryOptions, availableCategoryValues]);

  const seasonOptions = availableSeasons;
  const tpoOptions = availableTpos;
  const closetGroups = useMemo(() => buildClosetViewGroups(items, categoryOptions), [
    categoryOptions,
    items,
  ]);

  const hasActiveFilters = Boolean(
    keyword ||
      categoryFilter ||
      seasonFilter ||
      tpoFilter ||
      sort !== DEFAULT_SORT ||
      currentPage > 1,
  );
  const shouldShowEmptyState =
    items.length === 0 || (viewMode === "closet" && closetGroups.length === 0);

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
              カテゴリ
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => updateQuery({ category: e.target.value, page: 1 })}
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
              onChange={(e) => updateQuery({ season: e.target.value, page: 1 })}
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
              onChange={(e) => updateQuery({ tpo: e.target.value, page: 1 })}
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
            表示件数: {items.length} / {totalCount}
          </p>

          <div className="flex items-center gap-3">
            <div
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1"
              role="group"
              aria-label="アイテム一覧の表示切替"
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="通常一覧に切り替え"
                aria-pressed={viewMode === "list"}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                  viewMode === "list"
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-transparent bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-100"
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                  <rect x="3" y="4" width="14" height="3" rx="1.5" />
                  <rect x="3" y="9" width="14" height="3" rx="1.5" />
                  <rect x="3" y="14" width="14" height="3" rx="1.5" />
                </svg>
                <span>一覧</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("closet")}
                aria-label="クローゼットビューに切り替え"
                aria-pressed={viewMode === "closet"}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                  viewMode === "closet"
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-transparent bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-100"
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 stroke-current">
                  <rect x="4" y="3" width="5" height="14" rx="1.5" fill="none" strokeWidth="1.6" />
                  <rect x="11" y="3" width="5" height="14" rx="1.5" fill="none" strokeWidth="1.6" />
                </svg>
                <span>クローゼット</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.replace(pathname, { scroll: false })}
              className="text-sm font-medium text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
              disabled={!hasActiveFilters}
            >
              条件をクリア
            </button>
          </div>
        </div>
      </section>

      {shouldShowEmptyState ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            条件に一致するアイテムがありません
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            条件を変えてお試しください。
          </p>
        </section>
      ) : viewMode === "closet" ? (
        <section className="space-y-6">
          {closetGroups.map((group) => (
            <section
              key={group.category}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold text-gray-900">{group.label}</h2>
              <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-4">
                {group.shapeGroups.map((shapeGroup) => (
                  <section
                    key={`${group.category}-${shapeGroup.shape}`}
                    className={`min-w-fit space-y-2 ${
                      shapeGroup.items.length === 1 ? "text-center" : "text-left"
                    }`}
                  >
                    <h3 className="text-xs font-medium text-gray-500">{shapeGroup.label}</h3>
                    <div
                      className={`flex flex-wrap gap-2 ${
                        shapeGroup.items.length === 1 ? "justify-center" : "justify-start"
                      }`}
                    >
                      {shapeGroup.items.map((item) => {
                        const mainColor = item.colors.find((color) => color.role === "main");
                        const subColor = item.colors.find((color) => color.role === "sub");
                        const itemName = item.name || "名称未設定";
                        const mainColorLabel = mainColor?.label ?? "未設定";

                        return (
                          <Link
                            href={`/items/${item.id}`}
                            key={item.id}
                            aria-label={`${itemName} / ${shapeGroup.label} / ${mainColorLabel}`}
                            className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                          >
                            <span className="sr-only">
                              {itemName} / {shapeGroup.label} / {mainColorLabel}
                            </span>
                            <span className="relative block h-24 w-12 overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-blue-300 hover:shadow-sm">
                              <span
                                className="absolute inset-y-0 left-0"
                                style={{
                                  width: subColor?.hex ? "90%" : "100%",
                                  backgroundColor: mainColor?.hex ?? "#E5E7EB",
                                }}
                              />
                              {subColor?.hex ? (
                                <span
                                  className="absolute inset-y-0 right-0"
                                  style={{ width: "10%", backgroundColor: subColor.hex }}
                                />
                              ) : null}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
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

                      {item.care_status ? (
                        <p className="mt-2 inline-flex rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
                          {ITEM_CARE_STATUS_LABELS[item.care_status]}
                        </p>
                      ) : null}

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
