"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { UserBrandRecord } from "@/types/settings";

type PurchaseCandidateBrandFilterFieldProps = {
  inputId: string;
  name: string;
  defaultValue?: string;
  brands: UserBrandRecord[];
  onValueChange?: (value: string) => void;
};

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase("ja-JP");
}

export default function PurchaseCandidateBrandFilterField({
  inputId,
  name,
  defaultValue = "",
  brands,
  onValueChange,
}: PurchaseCandidateBrandFilterFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const blurTimeoutRef = useRef<number | null>(null);
  const normalizedValue = normalizeSearchText(value);

  const suggestions = useMemo(() => {
    if (normalizedValue === "") {
      return brands;
    }

    return brands.filter((brand) => {
      const normalizedName = normalizeSearchText(brand.name);
      const normalizedKana = normalizeSearchText(brand.kana ?? "");

      return (
        normalizedName.startsWith(normalizedValue) ||
        normalizedKana.startsWith(normalizedValue)
      );
    });
  }, [brands, normalizedValue]);

  function handleSelectSuggestion(brand: UserBrandRecord) {
    setValue(brand.name);
    onValueChange?.(brand.name);
    setOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      setHighlightedIndex(suggestions.length > 0 ? 0 : -1);
      return;
    }

    if (!open || suggestions.length === 0) {
      if (event.key === "Escape") {
        setOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      handleSelectSuggestion(suggestions[highlightedIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        id={inputId}
        name={name}
        type="text"
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          setValue(nextValue);
          onValueChange?.(nextValue);
          setOpen(true);
          setHighlightedIndex(0);
        }}
        onFocus={() => {
          setOpen(true);
          setHighlightedIndex(suggestions.length > 0 ? 0 : -1);
        }}
        onBlur={() => {
          blurTimeoutRef.current = window.setTimeout(() => {
            setOpen(false);
          }, 120);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={`${inputId}-suggestions`}
        placeholder="ブランド名で絞り込み"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {open ? (
        <div
          id={`${inputId}-suggestions`}
          className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
        >
          {suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">
              一致するブランド候補はありません。
            </p>
          ) : (
            <ul className="space-y-1">
              {suggestions.map((brand, index) => (
                <li key={brand.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSelectSuggestion(brand);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left transition ${
                      index === highlightedIndex
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block text-sm font-medium">
                      {brand.name}
                    </span>
                    {brand.kana ? (
                      <span className="block text-xs text-gray-500">
                        {brand.kana}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
