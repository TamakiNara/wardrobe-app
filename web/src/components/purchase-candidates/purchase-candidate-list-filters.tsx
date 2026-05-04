"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PurchaseCandidateBrandFilterField from "@/components/purchase-candidates/purchase-candidate-brand-filter-field";
import {
  getItemSubcategoryOptions,
  normalizeItemSubcategory,
} from "@/lib/master-data/item-subcategories";
import {
  PURCHASE_CANDIDATE_PRIORITY_LABELS,
  PURCHASE_CANDIDATE_STATUS_LABELS,
} from "@/lib/purchase-candidates/labels";
import type { CategoryOption } from "@/types/categories";
import type { UserBrandRecord } from "@/types/settings";

type PurchaseCandidateListFiltersProps = {
  keyword: string;
  status: string;
  priority: string;
  category: string;
  subcategory: string;
  brand: string;
  sort: string;
  itemCount: number;
  totalCount: number;
  categoryOptions: CategoryOption[];
  brandOptions: UserBrandRecord[];
};

type PurchaseCandidateFilterValues = {
  keyword: string;
  status: string;
  priority: string;
  category: string;
  subcategory: string;
  brand: string;
  sort: string;
  page: number;
};

const DEBOUNCE_DELAY_MS = 300;

function normalizePage(value: string | null): number {
  const page = Number(value ?? "1");
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildQueryString(values: PurchaseCandidateFilterValues): string {
  const params = new URLSearchParams();

  if (values.keyword) {
    params.set("keyword", values.keyword);
  }

  if (values.status) {
    params.set("status", values.status);
  }

  if (values.priority) {
    params.set("priority", values.priority);
  }

  if (values.category) {
    params.set("category", values.category);
  }

  if (values.category && values.subcategory) {
    params.set("subcategory", values.subcategory);
  }

  if (values.brand) {
    params.set("brand", values.brand);
  }

  if (values.sort) {
    params.set("sort", values.sort);
  }

  if (values.page > 1) {
    params.set("page", String(values.page));
  }

  return params.toString();
}

function FilterFieldHeader({
  htmlFor,
  label,
  isActive,
  onClear,
}: {
  htmlFor: string;
  label: string;
  isActive: boolean;
  onClear: () => void;
}) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {isActive ? (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          解除
        </button>
      ) : null}
    </div>
  );
}

export default function PurchaseCandidateListFilters({
  keyword,
  status,
  priority,
  category,
  subcategory,
  brand,
  sort,
  itemCount,
  totalCount,
  categoryOptions,
  brandOptions,
}: PurchaseCandidateListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [draftBrand, setDraftBrand] = useState(brand);
  const [isComposingKeyword, setIsComposingKeyword] = useState(false);
  const currentPage = normalizePage(searchParams.get("page"));

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    setDraftBrand(brand);
  }, [brand]);

  const updateQuery = useCallback(
    (
      nextValues: Partial<PurchaseCandidateFilterValues>,
      options: { replaceDraft?: boolean } = {},
    ) => {
      const shouldResetPage = !Object.prototype.hasOwnProperty.call(
        nextValues,
        "page",
      );
      const nextCategory = nextValues.category ?? category;
      const rawNextSubcategory =
        nextValues.subcategory ??
        (nextCategory === category ? subcategory : "");
      const nextSubcategory =
        normalizeItemSubcategory(nextCategory, rawNextSubcategory) ?? "";
      const nextQuery = buildQueryString({
        keyword: nextValues.keyword ?? keyword,
        status: nextValues.status ?? status,
        priority: nextValues.priority ?? priority,
        category: nextCategory,
        subcategory: nextCategory ? nextSubcategory : "",
        brand: nextValues.brand ?? brand,
        sort: nextValues.sort ?? sort,
        page: nextValues.page ?? (shouldResetPage ? 1 : currentPage),
      });

      if (options.replaceDraft) {
        setDraftKeyword(nextValues.keyword ?? keyword);
        setDraftBrand(nextValues.brand ?? brand);
      }

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [
      brand,
      category,
      currentPage,
      keyword,
      pathname,
      priority,
      router,
      sort,
      status,
      subcategory,
    ],
  );

  useEffect(() => {
    if (isComposingKeyword || draftKeyword === keyword) {
      return;
    }

    const timerId = window.setTimeout(() => {
      updateQuery({ keyword: draftKeyword.trim(), brand: draftBrand.trim() });
    }, DEBOUNCE_DELAY_MS);

    return () => window.clearTimeout(timerId);
  }, [draftBrand, draftKeyword, isComposingKeyword, keyword, updateQuery]);

  useEffect(() => {
    if (draftBrand === brand) {
      return;
    }

    const timerId = window.setTimeout(() => {
      updateQuery({ keyword: draftKeyword.trim(), brand: draftBrand.trim() });
    }, DEBOUNCE_DELAY_MS);

    return () => window.clearTimeout(timerId);
  }, [brand, draftBrand, draftKeyword, updateQuery]);

  const currentSubcategory =
    normalizeItemSubcategory(category, subcategory) ?? "";
  const subcategoryOptions = category
    ? [...getItemSubcategoryOptions(category)].sort((left, right) => {
        if (left.value === "other") {
          return 1;
        }

        if (right.value === "other") {
          return -1;
        }

        return 0;
      })
    : [];
  const hasActiveFilters = Boolean(
    keyword ||
    status ||
    priority ||
    category ||
    currentSubcategory ||
    brand ||
    sort ||
    currentPage > 1,
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        data-testid="purchase-candidate-filter-grid"
      >
        <div>
          <FilterFieldHeader
            htmlFor="purchase-candidate-keyword"
            label="キーワード"
            isActive={keyword !== "" || draftKeyword !== ""}
            onClear={() => updateQuery({ keyword: "" }, { replaceDraft: true })}
          />
          <input
            id="purchase-candidate-keyword"
            type="search"
            value={draftKeyword}
            onChange={(e) => setDraftKeyword(e.target.value)}
            onCompositionStart={() => setIsComposingKeyword(true)}
            onCompositionEnd={(e) => {
              setIsComposingKeyword(false);
              setDraftKeyword(e.currentTarget.value);
            }}
            placeholder="名前・メモで検索"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <FilterFieldHeader
            htmlFor="purchase-candidate-brand"
            label="ブランド"
            isActive={brand !== "" || draftBrand !== ""}
            onClear={() => updateQuery({ brand: "" }, { replaceDraft: true })}
          />
          <PurchaseCandidateBrandFilterField
            inputId="purchase-candidate-brand"
            name="brand"
            defaultValue={draftBrand}
            brands={brandOptions}
            onValueChange={setDraftBrand}
          />
        </div>

        <div>
          <FilterFieldHeader
            htmlFor="purchase-candidate-category"
            label="カテゴリ"
            isActive={category !== ""}
            onClear={() => updateQuery({ category: "", subcategory: "" })}
          />
          <select
            id="purchase-candidate-category"
            value={category}
            onChange={(e) =>
              updateQuery({ category: e.target.value, subcategory: "" })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">すべて</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FilterFieldHeader
            htmlFor="purchase-candidate-subcategory"
            label="種類"
            isActive={currentSubcategory !== ""}
            onClear={() => updateQuery({ subcategory: "" })}
          />
          <select
            id="purchase-candidate-subcategory"
            value={currentSubcategory}
            onChange={(e) => updateQuery({ subcategory: e.target.value })}
            disabled={!category}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">すべて</option>
            {subcategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FilterFieldHeader
            htmlFor="purchase-candidate-status"
            label="状態"
            isActive={status !== ""}
            onClear={() => updateQuery({ status: "" })}
          />
          <select
            id="purchase-candidate-status"
            value={status}
            onChange={(e) => updateQuery({ status: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">購入前</option>
            {Object.entries(PURCHASE_CANDIDATE_STATUS_LABELS).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <FilterFieldHeader
            htmlFor="purchase-candidate-priority"
            label="優先度"
            isActive={priority !== ""}
            onClear={() => updateQuery({ priority: "" })}
          />
          <select
            id="purchase-candidate-priority"
            value={priority}
            onChange={(e) => updateQuery({ priority: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">すべて</option>
            {Object.entries(PURCHASE_CANDIDATE_PRIORITY_LABELS).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <FilterFieldHeader
            htmlFor="purchase-candidate-sort"
            label="並び順"
            isActive={sort !== ""}
            onClear={() => updateQuery({ sort: "" })}
          />
          <select
            id="purchase-candidate-sort"
            value={sort}
            onChange={(e) => updateQuery({ sort: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">更新順</option>
            <option value="name_asc">名前順</option>
          </select>
        </div>

        <div className="flex items-end xl:justify-end">
          <button
            type="button"
            onClick={() => {
              setDraftKeyword("");
              setDraftBrand("");
              router.replace(pathname, { scroll: false });
            }}
            className="inline-flex h-10 items-center text-sm font-medium text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
            disabled={!hasActiveFilters}
          >
            条件をクリア
          </button>
        </div>
      </div>

      <div
        className="mt-4 flex flex-col gap-4 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between"
        data-testid="purchase-candidate-display-controls"
      >
        <p className="text-sm text-gray-600">
          表示件数: {itemCount} / {totalCount}
        </p>
        <div />
      </div>
    </section>
  );
}
