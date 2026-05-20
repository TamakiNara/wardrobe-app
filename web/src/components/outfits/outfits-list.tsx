"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import OutfitColorThumbnail from "@/components/outfits/outfit-color-thumbnail";
import OutfitDuplicateAction from "@/components/outfits/outfit-duplicate-action";
import { isItemVisibleByCategorySettings } from "@/lib/api/categories";
import { fetchCategoryVisibilitySettings } from "@/lib/api/settings";
import { SEASON_OPTIONS } from "@/lib/master-data/item-attributes";
import {
  findItemCategoryLabel,
  findItemShapeLabel,
  ITEM_CATEGORIES,
} from "@/lib/master-data/item-shapes";
import { fetchAllPaginatedCandidates } from "@/lib/wear-logs/candidates";
import type { ItemRecord, ItemSpec } from "@/types/items";
import type { SkinTonePreset } from "@/types/settings";

export type OutfitItem = {
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
    spec?: ItemSpec | null;
  };
};

export type Outfit = {
  id: number;
  name: string | null;
  memo: string | null;
  seasons: string[];
  tpos: string[];
  outfit_items?: OutfitItem[];
  outfitItems?: OutfitItem[];
};

export type OutfitsListProps = {
  outfits: Outfit[];
  totalCount: number;
  totalAllCount: number;
  currentPage: number;
  lastPage: number;
  availableTpos: string[];
  itemFilter?: {
    id: number;
    name: string | null;
  } | null;
  initialSeasonFilter?: string;
  skinTonePreset?: SkinTonePreset;
  initialVisibleCategoryIds?: string[] | null;
};

type OutfitSortValue = "updated_at_desc" | "name_asc";
type ItemFilterLoadStatus = "idle" | "loading" | "success" | "error";

const DEFAULT_SORT: OutfitSortValue = "updated_at_desc";
const SORT_OPTIONS: Array<{ value: OutfitSortValue; label: string }> = [
  { value: "updated_at_desc", label: "更新順" },
  { value: "name_asc", label: "名前順" },
];
const ITEM_FILTER_SEASONS = SEASON_OPTIONS.filter(
  (season) => season !== "オール",
);

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

function matchesItemSeasonFilter(seasons: string[], filterSeason: string) {
  if (filterSeason === "") {
    return true;
  }

  if (seasons.length === 0) {
    return true;
  }

  return seasons.includes(filterSeason) || seasons.includes("オール");
}

function getColorDisplayLabel(
  color: NonNullable<ItemRecord["colors"]>[number],
) {
  const customLabel = color.custom_label?.trim();

  if (customLabel) {
    return customLabel;
  }

  const label = color.label?.trim();
  return label || "色未設定";
}

function renderItemColorSummary(item: ItemRecord) {
  const colors = item.colors ?? [];
  const mainColor = colors.find((color) => color.role === "main");
  const subColor = colors.find((color) => color.role === "sub");

  if (!mainColor && !subColor) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {mainColor && (
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700">
          <span
            className="h-3 w-3 rounded-full border border-gray-300"
            style={{ backgroundColor: mainColor.hex }}
          />
          {getColorDisplayLabel(mainColor)}
        </span>
      )}
      {subColor && (
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
          <span
            className="h-3 w-3 rounded-full border border-gray-300"
            style={{ backgroundColor: subColor.hex }}
          />
          {getColorDisplayLabel(subColor)}
        </span>
      )}
    </div>
  );
}

function buildQueryString({
  keyword,
  season,
  currentSeason,
  tpo,
  sort,
  page,
  itemId,
}: {
  keyword: string;
  season: string;
  currentSeason: string;
  tpo: string;
  sort: OutfitSortValue;
  page: number;
  itemId: string;
}): string {
  const params = new URLSearchParams();

  if (keyword) {
    params.set("keyword", keyword);
  }

  if (season) {
    params.set("season", season);
  } else if (currentSeason) {
    params.set("currentSeason", currentSeason);
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

  if (itemId) {
    params.set("item_id", itemId);
  }

  return params.toString();
}

export default function OutfitsList({
  outfits,
  totalCount,
  currentPage,
  lastPage,
  availableTpos,
  itemFilter = null,
  initialSeasonFilter = "",
  skinTonePreset,
  initialVisibleCategoryIds,
}: OutfitsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const keyword = normalizeKeyword(searchParams.get("keyword"));
  const seasonFilter = searchParams.get("season") ?? "";
  const currentSeasonFilter = searchParams.get("currentSeason") ?? "";
  const effectiveSeasonFilter = seasonFilter || currentSeasonFilter;
  const tpoFilter = searchParams.get("tpo") ?? "";
  const sort = normalizeSort(searchParams.get("sort"));
  const page = normalizePage(searchParams.get("page"));
  const itemIdFilter = searchParams.get("item_id") ?? "";

  const [isComposingKeyword, setIsComposingKeyword] = useState(false);
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [visibleCategoryIds, setVisibleCategoryIds] = useState<string[] | null>(
    initialVisibleCategoryIds ?? null,
  );
  const [hasClearedInitialSeason, setHasClearedInitialSeason] = useState(false);
  const [isItemFilterOpen, setIsItemFilterOpen] = useState(false);
  const [itemFilterKeyword, setItemFilterKeyword] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState("");
  const [itemSeasonFilter, setItemSeasonFilter] = useState("");
  const [itemTpoFilter, setItemTpoFilter] = useState("");
  const [itemFilterCandidates, setItemFilterCandidates] = useState<
    ItemRecord[]
  >([]);
  const [itemFilterLoadStatus, setItemFilterLoadStatus] =
    useState<ItemFilterLoadStatus>("idle");

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  const updateQuery = useCallback(
    (
      nextValues: Partial<{
        keyword: string;
        season: string;
        currentSeason: string;
        tpo: string;
        sort: OutfitSortValue;
        page: number;
        itemId: string;
      }>,
    ) => {
      const nextSeason = nextValues.season ?? seasonFilter;
      const nextCurrentSeason = nextValues.currentSeason ?? currentSeasonFilter;
      const nextQuery = buildQueryString({
        keyword: nextValues.keyword ?? keyword,
        season: nextSeason,
        currentSeason: nextSeason === "" ? nextCurrentSeason : "",
        tpo: nextValues.tpo ?? tpoFilter,
        sort: nextValues.sort ?? sort,
        page: nextValues.page ?? page,
        itemId: nextValues.itemId ?? itemIdFilter,
      });

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [
      currentSeasonFilter,
      keyword,
      page,
      pathname,
      router,
      seasonFilter,
      sort,
      itemIdFilter,
      tpoFilter,
    ],
  );

  function buildItemDetailHref(itemId: number): string {
    const currentQuery = searchParams.toString();
    const returnToPath = currentQuery
      ? `${pathname}?${currentQuery}`
      : pathname;

    return `/items/${itemId}?return_to=${encodeURIComponent(returnToPath)}&return_label=${encodeURIComponent("コーディネート一覧")}`;
  }

  useEffect(() => {
    if (
      seasonFilter ||
      currentSeasonFilter ||
      itemIdFilter ||
      !initialSeasonFilter
    ) {
      return;
    }

    if (hasClearedInitialSeason) {
      return;
    }

    updateQuery({
      currentSeason: initialSeasonFilter,
      page: 1,
    });
  }, [
    currentSeasonFilter,
    hasClearedInitialSeason,
    initialSeasonFilter,
    itemIdFilter,
    seasonFilter,
    updateQuery,
  ]);

  useEffect(() => {
    if (initialVisibleCategoryIds !== undefined) {
      return;
    }

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
  }, [initialVisibleCategoryIds]);

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

  async function loadItemFilterCandidates() {
    setItemFilterLoadStatus("loading");
    try {
      const response = await fetchAllPaginatedCandidates<ItemRecord, "items">(
        "/api/items",
        "items",
      );

      if (response.status !== 200) {
        setItemFilterCandidates([]);
        setItemFilterLoadStatus("error");
        return;
      }

      setItemFilterCandidates(
        response.entries.toSorted((a, b) =>
          (a.name ?? "").localeCompare(b.name ?? "", "ja"),
        ),
      );
      setItemFilterLoadStatus("success");
    } catch {
      setItemFilterCandidates([]);
      setItemFilterLoadStatus("error");
    }
  }

  function handleItemFilterToggle() {
    setIsItemFilterOpen((current) => {
      const next = !current;
      if (
        next &&
        itemFilterLoadStatus !== "success" &&
        itemFilterLoadStatus !== "loading"
      ) {
        void loadItemFilterCandidates();
      }

      return next;
    });
  }

  const hasActiveFilters = Boolean(
    keyword ||
    effectiveSeasonFilter ||
    tpoFilter ||
    sort !== DEFAULT_SORT ||
    currentPage > 1 ||
    itemIdFilter,
  );
  const hasItemFilter = itemIdFilter !== "";
  const itemFilterLabel = itemFilter?.name?.trim() || "指定したアイテム";
  const normalizedItemFilterKeyword = itemFilterKeyword.trim().toLowerCase();
  const availableItemCategoryValues = Array.from(
    new Set(
      itemFilterCandidates
        .map((item) => item.category)
        .filter(
          (category): category is string =>
            typeof category === "string" && category !== "",
        ),
    ),
  );
  const filteredItemCandidates = itemFilterCandidates.filter((item) => {
    const itemName = (item.name ?? "名称未設定").toLowerCase();
    const brandName = (item.brand_name ?? "").toLowerCase();
    const categoryLabel = (
      findItemCategoryLabel(item.category) ?? ""
    ).toLowerCase();
    const shapeLabel = (
      findItemShapeLabel(item.category, item.shape) ?? ""
    ).toLowerCase();
    const seasons = item.seasons ?? [];
    const tpos = item.tpos ?? [];
    const matchesKeyword =
      !normalizedItemFilterKeyword ||
      itemName.includes(normalizedItemFilterKeyword) ||
      brandName.includes(normalizedItemFilterKeyword) ||
      categoryLabel.includes(normalizedItemFilterKeyword) ||
      shapeLabel.includes(normalizedItemFilterKeyword);
    const matchesCategory =
      itemCategoryFilter === "" || item.category === itemCategoryFilter;
    const matchesSeason = matchesItemSeasonFilter(seasons, itemSeasonFilter);
    const matchesTpo = itemTpoFilter === "" || tpos.includes(itemTpoFilter);

    return matchesKeyword && matchesCategory && matchesSeason && matchesTpo;
  });

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
              value={effectiveSeasonFilter}
              onChange={(e) => {
                setHasClearedInitialSeason(e.target.value === "");
                updateQuery({
                  season: e.target.value,
                  currentSeason: "",
                  page: 1,
                });
              }}
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
              {availableTpos.map((tpo) => (
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
              onChange={(e) =>
                updateQuery({ sort: normalizeSort(e.target.value), page: 1 })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 xl:col-span-5">
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    使用アイテム
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    手持ちアイテムから選んで、含まれるコーディネートを絞り込みます。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleItemFilterToggle}
                  className="self-start rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 sm:self-auto"
                >
                  {isItemFilterOpen
                    ? "アイテム一覧を閉じる"
                    : "アイテム一覧を開く"}
                </button>
              </div>

              {hasItemFilter ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                  <span className="font-medium">選択中: </span>「
                  {itemFilterLabel}」
                </div>
              ) : null}

              {isItemFilterOpen ? (
                <div className="space-y-3">
                  <label
                    htmlFor="outfit-item-filter-keyword"
                    className="sr-only"
                  >
                    使用アイテムを絞り込む
                  </label>
                  <input
                    id="outfit-item-filter-keyword"
                    type="search"
                    value={itemFilterKeyword}
                    onChange={(e) => setItemFilterKeyword(e.target.value)}
                    placeholder="アイテム名・カテゴリ・形で絞り込み"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        カテゴリ
                      </label>
                      <select
                        value={itemCategoryFilter}
                        onChange={(e) => setItemCategoryFilter(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">指定なし</option>
                        {ITEM_CATEGORIES.filter((category) =>
                          availableItemCategoryValues.includes(category.value),
                        ).map((category) => (
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
                        value={itemSeasonFilter}
                        onChange={(e) => setItemSeasonFilter(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">指定なし</option>
                        {ITEM_FILTER_SEASONS.map((season) => (
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
                        value={itemTpoFilter}
                        onChange={(e) => setItemTpoFilter(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">指定なし</option>
                        {availableTpos.map((tpo) => (
                          <option key={tpo} value={tpo}>
                            {tpo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {itemFilterLoadStatus === "loading" ? (
                    <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                      アイテム候補を読み込んでいます。
                    </p>
                  ) : null}

                  {itemFilterLoadStatus === "error" ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      アイテム候補を取得できませんでした。
                    </p>
                  ) : null}

                  {itemFilterLoadStatus === "success" &&
                  itemFilterCandidates.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                      候補に表示できるアイテムがありません。
                    </p>
                  ) : null}

                  {itemFilterLoadStatus === "success" &&
                  itemFilterCandidates.length > 0 &&
                  filteredItemCandidates.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                      条件に一致するアイテム候補がありません。
                    </p>
                  ) : null}

                  {itemFilterLoadStatus === "success" &&
                  filteredItemCandidates.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto pr-1">
                      <ul className="grid gap-2 md:grid-cols-2">
                        {filteredItemCandidates.map((item) => {
                          const itemName = item.name?.trim() || "名称未設定";
                          const categoryLabel =
                            findItemCategoryLabel(item.category) ||
                            "カテゴリ未設定";
                          const shapeLabel =
                            findItemShapeLabel(item.category, item.shape) ||
                            "形未設定";
                          const brandName = item.brand_name?.trim();
                          const isSelected = String(item.id) === itemIdFilter;
                          return (
                            <li key={item.id}>
                              <div
                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuery({
                                        itemId: String(item.id),
                                        page: 1,
                                      })
                                    }
                                    className="min-w-0 flex-1 text-left"
                                  >
                                    <span className="flex items-center justify-between gap-2">
                                      <span className="font-medium text-gray-900">
                                        {itemName}
                                      </span>
                                      {isSelected ? (
                                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                          選択中
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className="mt-1 block text-xs text-gray-500">
                                      {categoryLabel} / {shapeLabel}
                                      {brandName ? ` · ${brandName}` : ""}
                                    </span>
                                    {renderItemColorSummary(item)}
                                  </button>
                                  <Link
                                    href={buildItemDetailHref(item.id)}
                                    className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
                                  >
                                    詳細
                                  </Link>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            表示件数: {outfits.length} / {totalCount}
          </p>

          <button
            type="button"
            onClick={() => {
              if (effectiveSeasonFilter) {
                setHasClearedInitialSeason(true);
              }
              updateQuery({
                keyword: "",
                season: "",
                currentSeason: "",
                tpo: "",
                sort: DEFAULT_SORT,
                page: 1,
                itemId: "",
              });
            }}
            className="text-sm font-medium text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
            disabled={!hasActiveFilters}
          >
            条件をクリア
          </button>
        </div>
      </section>

      {hasItemFilter ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">
              「{itemFilterLabel}」を含むコーディネート
            </p>
            <button
              type="button"
              onClick={() => updateQuery({ itemId: "", page: 1 })}
              className="self-start text-sm font-medium text-blue-700 hover:underline sm:self-auto"
            >
              絞り込みを解除
            </button>
          </div>
        </section>
      ) : null}

      {outfits.length === 0 && hasItemFilter ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            「{itemFilterLabel}」を含むコーディネートはまだありません。
          </h2>
        </section>
      ) : outfits.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            条件に一致するコーディネートがありません
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            条件を変えてお試しください。
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
                    isItemVisibleByCategorySettings(
                      outfitItem.item,
                      visibleCategoryIds,
                    ),
                  );
            const itemCount = visibleOutfitItems.length;
            const hiddenItemCount =
              outfitItems.length - visibleOutfitItems.length;

            return (
              <article
                key={outfit.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <Link
                  href={`/outfits/${outfit.id}`}
                  className="block transition hover:text-blue-700"
                >
                  <div className="flex items-start gap-4">
                    <OutfitColorThumbnail
                      outfitItems={visibleOutfitItems}
                      skinTonePreset={skinTonePreset}
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="min-h-6 text-lg font-semibold text-gray-900">
                        {outfit.name ?? ""}
                      </h2>

                      {outfit.memo && (
                        <p className="mt-2 text-sm text-gray-600">
                          {outfit.memo}
                        </p>
                      )}

                      <p className="mt-4 text-sm text-gray-600">
                        表示アイテム数: {itemCount}
                      </p>

                      {hiddenItemCount > 0 && (
                        <p className="mt-1 text-sm text-amber-700">
                          現在の表示設定により {hiddenItemCount}{" "}
                          件を非表示にしています。
                        </p>
                      )}

                      <p className="mt-2 text-sm text-gray-600">
                        季節:{" "}
                        {outfit.seasons?.length
                          ? outfit.seasons.join(" / ")
                          : "未設定"}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        TPO:{" "}
                        {outfit.tpos?.length
                          ? outfit.tpos.join(" / ")
                          : "未設定"}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href={`/outfits/${outfit.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    詳細
                  </Link>
                  <OutfitDuplicateAction outfitId={outfit.id} />
                </div>
              </article>
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
          <span className="ml-2 text-gray-400">（全{totalCount}件）</span>
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
