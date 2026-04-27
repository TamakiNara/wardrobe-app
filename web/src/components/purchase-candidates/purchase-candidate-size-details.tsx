"use client";

import { useState } from "react";
import {
  formatSizeDetailValue,
  getStructuredSizeFieldDefinitions,
  normalizeItemSizeDetails,
} from "@/lib/items/size-details";
import { PURCHASE_CANDIDATE_SIZE_GENDER_LABELS } from "@/lib/purchase-candidates/labels";
import type {
  PurchaseCandidateSizeOption,
  PurchaseCandidateSizeOptionKey,
} from "@/lib/purchase-candidates/size-comparison";

type Props = {
  sizeGender: "women" | "men" | "unisex" | null;
  sizeOptions: PurchaseCandidateSizeOption[];
  resolvedCategory?: string | null;
  resolvedShape?: string | null;
};

export default function PurchaseCandidateSizeDetails({
  sizeGender,
  sizeOptions,
  resolvedCategory,
  resolvedShape,
}: Props) {
  const [activeOptionKey, setActiveOptionKey] =
    useState<PurchaseCandidateSizeOptionKey>(sizeOptions[0]?.key ?? "primary");

  const showTabs = sizeOptions.length > 1;

  return (
    <div className="mt-4 space-y-4">
      <dl className="grid gap-4 md:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-gray-700">サイズ区分</dt>
          <dd className="mt-1 text-sm text-gray-600">
            {sizeGender
              ? (PURCHASE_CANDIDATE_SIZE_GENDER_LABELS[sizeGender] ?? "未設定")
              : "未設定"}
          </dd>
        </div>
      </dl>

      {sizeOptions.length === 0 ? (
        <p className="text-sm text-gray-500">未設定</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {showTabs ? (
            <div className="border-b border-gray-200 px-4 pt-4">
              <div
                className="-mb-px flex flex-wrap items-end gap-2"
                role="tablist"
                aria-label="サイズ候補"
              >
                {sizeOptions.map((option) => {
                  const isActive = option.key === activeOptionKey;
                  const tabTitle =
                    option.key === "primary" ? "サイズ候補1" : "サイズ候補2";
                  const displayLabel =
                    option.label.trim() !== "" ? option.label : "サイズ未入力";

                  return (
                    <button
                      key={option.key}
                      id={`purchase-candidate-size-tab-${option.key}`}
                      type="button"
                      role="tab"
                      aria-label={option.optionLabel}
                      aria-selected={isActive}
                      aria-controls={`purchase-candidate-size-panel-${option.key}`}
                      onClick={() => setActiveOptionKey(option.key)}
                      className={[
                        "flex min-w-[11rem] items-center gap-3 rounded-t-xl border px-4 py-2.5 text-left transition",
                        isActive
                          ? "relative -mb-px border-gray-200 border-b-white bg-white text-gray-900 after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-white"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
                      ].join(" ")}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium">{tabTitle}</div>
                        <div className="truncate text-sm font-semibold">
                          {displayLabel}
                        </div>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700">
                        入力あり
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {sizeOptions.map((option) => {
            const isActive = !showTabs || option.key === activeOptionKey;
            const normalizedSizeDetails = normalizeItemSizeDetails(
              option.sizeDetails,
            );
            const structuredFields = getStructuredSizeFieldDefinitions(
              resolvedCategory,
              resolvedShape,
            ).filter(
              (field) =>
                normalizedSizeDetails?.structured?.[field.name] !== undefined,
            );
            const customFields = normalizedSizeDetails?.custom_fields ?? [];

            return (
              <div
                key={option.key}
                id={`purchase-candidate-size-panel-${option.key}`}
                role="tabpanel"
                aria-labelledby={`purchase-candidate-size-tab-${option.key}`}
                hidden={!isActive}
                className="space-y-4 p-4"
              >
                <dl className="grid gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-700">
                      サイズ表記
                    </dt>
                    <dd className="mt-1 text-sm text-gray-600">
                      {option.label || "未設定"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">
                      サイズ感メモ
                    </dt>
                    <dd className="mt-1 text-sm text-gray-600">
                      {option.note || "未設定"}
                    </dd>
                  </div>
                </dl>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-medium text-gray-700">実寸</h3>
                  {structuredFields.length > 0 || customFields.length > 0 ? (
                    <div className="mt-3 space-y-3 text-sm text-gray-600">
                      {structuredFields.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {structuredFields.map((field) => {
                            const value =
                              normalizedSizeDetails?.structured?.[field.name];

                            return value ? (
                              <div
                                key={`${option.key}-${field.name}`}
                                className="rounded-lg bg-gray-50 px-4 py-3"
                              >
                                <p className="text-xs font-medium text-gray-500">
                                  {field.label}
                                </p>
                                <p className="mt-1 text-sm text-gray-700">
                                  {formatSizeDetailValue(value)}
                                </p>
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : null}

                      {customFields.length > 0 ? (
                        <div className="space-y-2">
                          {customFields.map((field) => (
                            <div
                              key={`${option.key}-${field.label}-${field.sort_order}`}
                              className="flex flex-col gap-1 rounded-lg bg-gray-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
                            >
                              <span className="text-sm font-medium text-gray-700">
                                {field.label}
                              </span>
                              <span className="text-sm text-gray-600">
                                {formatSizeDetailValue(field)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">未設定</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
