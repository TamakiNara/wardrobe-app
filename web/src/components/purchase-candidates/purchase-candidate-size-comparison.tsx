"use client";

import { useMemo, useState } from "react";
import type { ItemRecord } from "@/types/items";
import type { PurchaseCandidateRecord } from "@/types/purchase-candidates";
import {
  buildPurchaseCandidateMultiSizeComparisonRows,
  getPurchaseCandidateComparisonOptions,
  getPurchaseCandidateSizeOptions,
  hasStructuredSizeComparisonBase,
} from "@/lib/purchase-candidates/size-comparison";

type Props = {
  candidate: PurchaseCandidateRecord;
  resolvedCategory?: string | null;
  resolvedSubcategory?: string | null;
  resolvedShape?: string | null;
  items: ItemRecord[];
};

export default function PurchaseCandidateSizeComparison({
  candidate,
  resolvedCategory,
  resolvedSubcategory,
  resolvedShape,
  items,
}: Props) {
  const candidateContext = useMemo(
    () => ({
      ...candidate,
      resolvedCategory,
      resolvedSubcategory,
      resolvedShape,
    }),
    [candidate, resolvedCategory, resolvedShape, resolvedSubcategory],
  );

  const comparisonReady = hasStructuredSizeComparisonBase(candidateContext);
  const comparisonOptions = useMemo(
    () => getPurchaseCandidateComparisonOptions(candidateContext, items),
    [candidateContext, items],
  );
  const sizeOptions = useMemo(
    () => getPurchaseCandidateSizeOptions(candidateContext),
    [candidateContext],
  );

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const selectedComparisonOption =
    comparisonOptions.find((option) => option.id === selectedItemId) ??
    comparisonOptions[0] ??
    null;

  const rows = useMemo(() => {
    if (!selectedComparisonOption || sizeOptions.length === 0) {
      return [];
    }

    return buildPurchaseCandidateMultiSizeComparisonRows(
      sizeOptions,
      {
        category: resolvedCategory ?? null,
        shape: resolvedShape ?? null,
      },
      selectedComparisonOption.item,
    );
  }, [resolvedCategory, resolvedShape, selectedComparisonOption, sizeOptions]);

  const itemSizeLabel =
    selectedComparisonOption?.item.size_label?.trim() || "未設定";
  const candidateNotes = sizeOptions
    .map((option) => ({
      key: option.key,
      label: option.label?.trim() || option.optionLabel,
      note: option.note?.trim() || "",
    }))
    .filter((option) => option.note !== "");
  const itemSizeNote = selectedComparisonOption?.item.size_note?.trim() || "";
  const hasAnySizeNotes = candidateNotes.length > 0 || itemSizeNote !== "";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        手持ちアイテムとサイズ比較
      </h2>
      {!comparisonReady ? (
        <p className="mt-4 text-sm text-gray-600">
          購入検討に実寸を入力すると、手持ちアイテムと比較できます。
        </p>
      ) : comparisonOptions.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">
          比較できる手持ちアイテムがまだありません。
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="purchase-candidate-size-comparison-item"
              className="text-sm font-medium text-gray-700"
            >
              比較対象
            </label>
            <select
              id="purchase-candidate-size-comparison-item"
              value={selectedComparisonOption?.id ?? ""}
              onChange={(event) =>
                setSelectedItemId(Number(event.target.value))
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {comparisonOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    項目
                  </th>
                  {sizeOptions.map((option) => (
                    <th
                      key={option.key}
                      className="px-4 py-3 text-left font-medium text-gray-700"
                    >
                      {option.label || "未設定"}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    手持ち（{itemSizeLabel}）
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      {row.label}
                    </th>
                    {sizeOptions.map((option) => (
                      <td
                        key={`${row.key}-${option.key}`}
                        className="px-4 py-3 text-gray-600"
                      >
                        {row.candidateValues[option.key] ?? "未設定"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-gray-600">{row.itemValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasAnySizeNotes ? (
            <div className="grid gap-3 md:grid-cols-2">
              {candidateNotes.map((option) => (
                <div
                  key={option.key}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="text-xs font-medium text-slate-500">
                    {option.label} のサイズ感メモ
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {option.note}
                  </p>
                </div>
              ))}
              {itemSizeNote !== "" ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">
                    比較対象のサイズ感メモ
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {itemSizeNote}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
