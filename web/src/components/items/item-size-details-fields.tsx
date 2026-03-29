import type {
  EditableCustomSizeField,
  StructuredSizeFieldDefinition,
} from "@/lib/items/size-details";
import type { StructuredSizeFieldName } from "@/types/items";

type ItemSizeDetailsFieldsProps = {
  structuredSizeFieldDefinitions: StructuredSizeFieldDefinition[];
  structuredSizeValues: Partial<Record<StructuredSizeFieldName, string>>;
  customSizeFields: EditableCustomSizeField[];
  hasDuplicateWarnings: boolean;
  onAddCustomSizeField: () => void;
  onUpdateStructuredSizeValue: (
    fieldName: StructuredSizeFieldName,
    value: string,
  ) => void;
  onUpdateCustomSizeField: (
    fieldId: string,
    field: "label" | "value",
    value: string,
  ) => void;
  onRemoveCustomSizeField: (fieldId: string) => void;
};

export default function ItemSizeDetailsFields({
  structuredSizeFieldDefinitions,
  structuredSizeValues,
  customSizeFields,
  hasDuplicateWarnings,
  onAddCustomSizeField,
  onUpdateStructuredSizeValue,
  onUpdateCustomSizeField,
  onRemoveCustomSizeField,
}: ItemSizeDetailsFieldsProps) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-700">実寸</p>
        <button
          type="button"
          onClick={onAddCustomSizeField}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          自由項目を追加
        </button>
      </div>

      {structuredSizeFieldDefinitions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {structuredSizeFieldDefinitions.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={`structured-size-${field.name}`}
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {field.label}
              </label>
              <div className="flex items-center rounded-lg border border-gray-300 bg-white pr-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <input
                  id={`structured-size-${field.name}`}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={structuredSizeValues[field.name] ?? ""}
                  onChange={(e) =>
                    onUpdateStructuredSizeValue(field.name, e.target.value)
                  }
                  className="w-full rounded-lg bg-transparent px-4 py-3 text-gray-900 outline-none"
                />
                <span className="text-sm text-gray-500">cm</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          現在のカテゴリと形に対応する固定実寸はありません。必要なら自由項目を追加してください。
        </p>
      )}

      {customSizeFields.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">自由項目</p>
          {customSizeFields.map((field) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-lg border border-gray-200 bg-white p-3 md:grid-cols-[minmax(0,1fr)_9rem_auto]"
            >
              <input
                type="text"
                placeholder="項目名"
                value={field.label}
                onChange={(e) =>
                  onUpdateCustomSizeField(field.id, "label", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex items-center rounded-lg border border-gray-300 pr-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="値"
                  value={field.value}
                  onChange={(e) =>
                    onUpdateCustomSizeField(field.id, "value", e.target.value)
                  }
                  className="w-full rounded-lg bg-transparent px-4 py-3 text-gray-900 outline-none"
                />
                <span className="text-sm text-gray-500">cm</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveCustomSizeField(field.id)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {hasDuplicateWarnings ? (
        <p className="text-xs text-amber-600">同名の実寸項目があります。</p>
      ) : null}
    </div>
  );
}
