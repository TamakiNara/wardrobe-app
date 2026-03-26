"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ITEM_COLORS,
  ITEM_COLORS_BY_GROUP,
  type ItemColorValue,
} from "@/lib/master-data/item-colors";

type ColorSelectProps = {
  value: ItemColorValue | "";
  onChange: (value: ItemColorValue | "") => void;
  placeholder: string;
  emptyOptionLabel?: string;
  disabled?: boolean;
};

export default function ColorSelect({
  value,
  onChange,
  placeholder,
  emptyOptionLabel,
  disabled = false,
}: ColorSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedColor = useMemo(
    () => ITEM_COLORS.find((color) => color.value === value) ?? null,
    [value],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-gray-900 outline-none transition hover:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selectedColor ? (
            <>
              <span
                className="h-5 w-5 shrink-0 rounded-full border border-gray-300"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span className="truncate">{selectedColor.label}</span>
              <span className="shrink-0 text-xs text-gray-400">
                {selectedColor.hex.toUpperCase()}
              </span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <span className="shrink-0 text-xs text-gray-500">{open ? "閉じる" : "選択"}</span>
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          {emptyOptionLabel && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="mb-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition hover:bg-gray-50"
            >
              <span>{emptyOptionLabel}</span>
              {!value && <span className="text-xs text-blue-600">選択中</span>}
            </button>
          )}

          {ITEM_COLORS_BY_GROUP.map((group) => (
            <div key={group.value} className="mb-2 last:mb-0">
              <p className="px-3 py-2 text-xs font-semibold tracking-wide text-gray-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.colors.map((color) => {
                  const isSelected = color.value === value;

                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        onChange(color.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                        isSelected ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-5 w-5 shrink-0 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="truncate text-sm font-medium">{color.label}</span>
                        <span className="shrink-0 text-xs text-gray-400">{color.hex.toUpperCase()}</span>
                      </span>
                      {isSelected && (
                        <span className="shrink-0 text-xs font-medium text-blue-600">選択中</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
