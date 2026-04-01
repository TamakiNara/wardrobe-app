"use client";

import FieldLabel from "@/components/forms/field-label";
import {
  ITEM_MATERIAL_NAME_OPTIONS,
  ITEM_MATERIAL_PART_OPTIONS,
  type EditableItemMaterial,
} from "@/lib/items/materials";

type ItemMaterialFieldsProps = {
  rows: EditableItemMaterial[];
  errors: Record<string, string>;
  totals: Array<{ partLabel: string; total: number }>;
  onChange: (
    rowId: string,
    field: "part_label" | "material_name" | "ratio",
    value: string,
  ) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
};

export default function ItemMaterialFields({
  rows,
  errors,
  totals,
  onChange,
  onAddRow,
  onRemoveRow,
}: ItemMaterialFieldsProps) {
  return (
    <div className="space-y-4" data-error-key="materials">
      <datalist id="item-material-part-options">
        {ITEM_MATERIAL_PART_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="item-material-name-options">
        {ITEM_MATERIAL_NAME_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_8rem_auto] md:items-end">
              <div>
                <FieldLabel
                  htmlFor={`${row.id}-part`}
                  label="区分"
                  className="mb-1"
                />
                <input
                  id={`${row.id}-part`}
                  list="item-material-part-options"
                  value={row.part_label}
                  onChange={(event) =>
                    onChange(row.id, "part_label", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {errors[`materials.${index}.part_label`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`materials.${index}.part_label`]}
                  </p>
                )}
              </div>

              <div>
                <FieldLabel
                  htmlFor={`${row.id}-material`}
                  label="素材名"
                  className="mb-1"
                />
                <input
                  id={`${row.id}-material`}
                  list="item-material-name-options"
                  value={row.material_name}
                  onChange={(event) =>
                    onChange(row.id, "material_name", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {errors[`materials.${index}.material_name`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`materials.${index}.material_name`]}
                  </p>
                )}
              </div>

              <div>
                <FieldLabel
                  htmlFor={`${row.id}-ratio`}
                  label="混率"
                  className="mb-1"
                />
                <div className="flex items-center gap-2">
                  <input
                    id={`${row.id}-ratio`}
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={row.ratio}
                    onChange={(event) =>
                      onChange(row.id, "ratio", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                {errors[`materials.${index}.ratio`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`materials.${index}.ratio`]}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRemoveRow(row.id)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                削除
              </button>
            </div>

            {errors[`materials.${index}`] && (
              <p className="mt-2 text-sm text-red-600">
                {errors[`materials.${index}`]}
              </p>
            )}
          </div>
        ))}
      </div>

      {totals.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-sm font-medium text-gray-700">区分ごとの合計</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {totals.map((total) => (
              <span
                key={total.partLabel}
                className={`rounded-full px-3 py-1 text-sm ${
                  total.total === 100
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {total.partLabel}: {total.total}%
              </span>
            ))}
          </div>
        </div>
      )}

      {errors.materials && (
        <p className="text-sm text-red-600">{errors.materials}</p>
      )}

      <button
        type="button"
        onClick={onAddRow}
        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        素材を追加
      </button>
    </div>
  );
}
