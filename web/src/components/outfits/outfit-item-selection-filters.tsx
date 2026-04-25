"use client";

import PurchaseCandidateBrandFilterField from "@/components/purchase-candidates/purchase-candidate-brand-filter-field";
import { buildOutfitItemSubcategoryOptions } from "@/lib/outfits/item-selection-filters";
import type { CategoryOption } from "@/types/categories";
import type { UserBrandRecord } from "@/types/settings";

type OutfitItemSelectionFiltersProps = {
  keyword: string;
  brand: string;
  category: string;
  subcategory: string;
  season: string;
  tpo: string;
  categoryOptions: CategoryOption[];
  brandOptions: UserBrandRecord[];
  seasonOptions: string[];
  tpoOptions: string[];
  onKeywordChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onSeasonChange: (value: string) => void;
  onTpoChange: (value: string) => void;
};

function FilterFieldHeader({
  htmlFor,
  label,
}: {
  htmlFor: string;
  label: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-sm font-medium text-gray-700"
    >
      {label}
    </label>
  );
}

export default function OutfitItemSelectionFilters({
  keyword,
  brand,
  category,
  subcategory,
  season,
  tpo,
  categoryOptions,
  brandOptions,
  seasonOptions,
  tpoOptions,
  onKeywordChange,
  onBrandChange,
  onCategoryChange,
  onSubcategoryChange,
  onSeasonChange,
  onTpoChange,
}: OutfitItemSelectionFiltersProps) {
  const subcategoryOptions = category
    ? buildOutfitItemSubcategoryOptions(category)
    : [];

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
        data-testid="outfit-item-filter-grid"
      >
        <div>
          <FilterFieldHeader
            htmlFor="outfit-item-filter-keyword"
            label="キーワード"
          />
          <input
            id="outfit-item-filter-keyword"
            type="search"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="名前・メモで検索"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <FilterFieldHeader
            htmlFor="outfit-item-filter-brand"
            label="ブランド"
          />
          <PurchaseCandidateBrandFilterField
            inputId="outfit-item-filter-brand"
            name="brand"
            defaultValue={brand}
            brands={brandOptions}
            onValueChange={onBrandChange}
          />
        </div>

        <div>
          <FilterFieldHeader
            htmlFor="outfit-item-filter-category"
            label="カテゴリ"
          />
          <select
            id="outfit-item-filter-category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
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
            htmlFor="outfit-item-filter-subcategory"
            label="種類"
          />
          <select
            id="outfit-item-filter-subcategory"
            value={subcategory}
            onChange={(event) => onSubcategoryChange(event.target.value)}
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
          <FilterFieldHeader htmlFor="outfit-item-filter-season" label="季節" />
          <select
            id="outfit-item-filter-season"
            value={season}
            onChange={(event) => onSeasonChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">すべて</option>
            {seasonOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FilterFieldHeader htmlFor="outfit-item-filter-tpo" label="TPO" />
          <select
            id="outfit-item-filter-tpo"
            value={tpo}
            onChange={(event) => onTpoChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">すべて</option>
            {tpoOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
