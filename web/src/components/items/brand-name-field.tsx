"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import FieldLabel from "@/components/forms/field-label";
import { fetchUserBrands } from "@/lib/api/settings";
import type { UserBrandRecord } from "@/types/settings";

type BrandNameFieldProps = {
  inputId: string;
  value: string;
  onChange: (value: string) => void;
  saveAsCandidate: boolean;
  onSaveAsCandidateChange: (checked: boolean) => void;
  disabled?: boolean;
};

export default function BrandNameField({
  inputId,
  value,
  onChange,
  saveAsCandidate,
  onSaveAsCandidateChange,
  disabled = false,
}: BrandNameFieldProps) {
  const [suggestions, setSuggestions] = useState<UserBrandRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const blurTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || disabled) {
      return;
    }

    let active = true;

    fetchUserBrands(value.trim() || undefined, true)
      .then((response) => {
        if (!active) return;
        setSuggestions(response.brands);
        setHighlightedIndex(response.brands.length > 0 ? 0 : -1);
      })
      .catch(() => {
        if (!active) return;
        setSuggestions([]);
        setHighlightedIndex(-1);
        setError("ブランド候補の取得に失敗しました。");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [disabled, open, value]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  function handleSelectSuggestion(brand: UserBrandRecord) {
    onChange(brand.name);
    setOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setLoading(true);
      setError(null);
      setOpen(true);
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
      setHighlightedIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
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
      <FieldLabel htmlFor={inputId} label="ブランド名" />
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(event) => {
        onChange(event.target.value);
          setLoading(true);
          setError(null);
          setOpen(true);
        }}
        onFocus={() => {
          setLoading(true);
          setError(null);
          setOpen(true);
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
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        disabled={disabled}
      />
      <p className="mt-1 text-xs text-gray-500">候補がなくても自由入力できます。</p>

      {open ? (
        <div
          id={`${inputId}-suggestions`}
          className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
        >
          {loading ? (
            <p className="px-3 py-2 text-sm text-gray-500">ブランド候補を読み込んでいます。</p>
          ) : error ? (
            <p className="px-3 py-2 text-sm text-red-600">{error}</p>
          ) : suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">一致するブランド候補はありません。</p>
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
                    <span className="block text-sm font-medium">{brand.name}</span>
                    {brand.kana ? (
                      <span className="block text-xs text-gray-500">{brand.kana}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={saveAsCandidate}
          onChange={(event) => onSaveAsCandidateChange(event.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          disabled={disabled}
        />
        ブランド候補にも追加する
      </label>
    </div>
  );
}
