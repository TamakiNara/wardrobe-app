"use client";

import { useMemo, useState } from "react";
import type { ItemRecord } from "@/types/items";
import type { PurchaseCandidateRecord } from "@/types/purchase-candidates";
import {
  buildPurchaseCandidateSizeComparisonRows,
  getPurchaseCandidateComparisonOptions,
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
  const comparisonReady = hasStructuredSizeComparisonBase({
    ...candidate,
    resolvedCategory,
    resolvedSubcategory,
    resolvedShape,
  });

  const options = useMemo(
    () =>
      getPurchaseCandidateComparisonOptions(
        {
          ...candidate,
          resolvedCategory,
          resolvedSubcategory,
          resolvedShape,
        },
        items,
      ),
    [candidate, items, resolvedCategory, resolvedShape, resolvedSubcategory],
  );

  const [selectedItemId, setSelectedItemId] = useState<number | null>(
    options[0]?.id ?? null,
  );

  const selectedOption =
    options.find((option) => option.id === selectedItemId) ??
    options[0] ??
    null;

  const rows = useMemo(() => {
    if (!selectedOption) {
      return [];
    }

    return buildPurchaseCandidateSizeComparisonRows(
      {
        ...candidate,
        resolvedCategory,
        resolvedSubcategory,
        resolvedShape,
      },
      selectedOption.item,
    );
  }, [
    candidate,
    resolvedCategory,
    resolvedShape,
    resolvedSubcategory,
    selectedOption,
  ]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        手持ちアイテムとサイズ比較
      </h2>
      {!comparisonReady ? (
        <p className="mt-4 text-sm text-gray-600">
          購入検討に実寸を入力すると、手持ちアイテムと比較できます。
        </p>
      ) : options.length === 0 ? (
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
              value={selectedOption?.id ?? ""}
              onChange={(event) =>
                setSelectedItemId(Number(event.target.value))
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {options.map((option) => (
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
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    購入検討
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    手持ち
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      {row.label}
                    </th>
                    <td className="px-4 py-3 text-gray-600">
                      {row.candidateValue}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.itemValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
