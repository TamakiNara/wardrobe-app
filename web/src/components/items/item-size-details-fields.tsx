import { useMemo, useState } from "react";
import { ChevronUp, Pencil } from "lucide-react";
import {
  FORM_CONTROL_INNER_INPUT_CLASS,
  getFormControlClassName,
  getFormControlWrapperClassName,
} from "@/components/forms/control-styles";
import type {
  EditableCustomSizeField,
  EditableSizeDetailValue,
  StructuredSizeFieldDefinition,
} from "@/lib/items/size-details";
import { formatSizeDetailValue } from "@/lib/items/size-details";
import type {
  ItemSizeDetailValue,
  StructuredSizeFieldName,
} from "@/types/items";

type ItemSizeDetailsFieldsProps = {
  structuredSizeFieldDefinitions: StructuredSizeFieldDefinition[];
  structuredSizeValues: Partial<
    Record<StructuredSizeFieldName, EditableSizeDetailValue>
  >;
  customSizeFields: EditableCustomSizeField[];
  hasDuplicateWarnings: boolean;
  disabled?: boolean;
  compact?: boolean;
  onAddCustomSizeField: () => void;
  onUpdateStructuredSizeValue: (
    fieldName: StructuredSizeFieldName,
    key: keyof ItemSizeDetailValue,
    value: string,
  ) => void;
  onUpdateCustomSizeField: (
    fieldId: string,
    field: "label" | keyof ItemSizeDetailValue,
    value: string,
  ) => void;
  onRemoveCustomSizeField: (fieldId: string) => void;
};

export default function ItemSizeDetailsFields({
  structuredSizeFieldDefinitions,
  structuredSizeValues,
  customSizeFields,
  hasDuplicateWarnings,
  disabled = false,
  compact = false,
  onAddCustomSizeField,
  onUpdateStructuredSizeValue,
  onUpdateCustomSizeField,
  onRemoveCustomSizeField,
}: ItemSizeDetailsFieldsProps) {
  const [hasExpandedOnce, setHasExpandedOnce] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isExpanded = hasExpandedOnce && !isCollapsed;
  const containerClassName = compact
    ? "space-y-3 border-l-2 border-gray-200 pl-4"
    : "space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4";
  const structuredGridClassName = compact
    ? "grid gap-3 md:grid-cols-2"
    : "grid gap-4 md:grid-cols-2";
  const structuredCardClassName = compact
    ? "space-y-2.5 rounded-lg bg-gray-50 px-3 py-2.5"
    : "space-y-3 rounded-lg border border-gray-200 bg-white p-3";
  const customSectionClassName = compact ? "space-y-2.5" : "space-y-3";
  const customCardClassName = compact
    ? "space-y-2.5 rounded-lg bg-gray-50 px-3 py-2.5"
    : "space-y-3 rounded-lg border border-gray-200 bg-white p-3";
  const sizeSummary = useMemo(() => {
    const structuredSummaries = structuredSizeFieldDefinitions
      .map((definition) => {
        const fieldValue = structuredSizeValues[definition.name];
        if (!fieldValue) {
          return null;
        }

        const formattedValue = formatSizeDetailValue(
          fieldValue as ItemSizeDetailValue,
        );
        if (!formattedValue) {
          return null;
        }

        return `${definition.label} ${formattedValue}`;
      })
      .filter((value): value is string => Boolean(value));

    const customCount = customSizeFields.filter(
      (field) =>
        field.label.trim() ||
        field.value.trim() ||
        field.min.trim() ||
        field.max.trim() ||
        field.note.trim(),
    ).length;

    const summaryParts = [...structuredSummaries];
    if (customCount > 0) {
      summaryParts.push(`自由項目 ${customCount}件`);
    }

    return summaryParts.length > 0
      ? summaryParts.join(" / ")
      : "実寸は未入力です";
  }, [customSizeFields, structuredSizeFieldDefinitions, structuredSizeValues]);

  return (
    <div className={containerClassName}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="shrink-0 text-sm font-medium text-gray-700">実寸</p>
        <p className="min-w-0 flex-1 text-sm text-gray-600">{sizeSummary}</p>
        {isExpanded ? (
          <button
            type="button"
            onClick={onAddCustomSizeField}
            disabled={disabled}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            自由項目を追加
          </button>
        ) : null}
        <button
          type="button"
          aria-label={isExpanded ? "実寸を閉じる" : "実寸を編集"}
          aria-expanded={isExpanded}
          onClick={() => {
            setHasExpandedOnce(true);
            setIsCollapsed(isExpanded);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Pencil className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {isExpanded ? (
        <>
          {structuredSizeFieldDefinitions.length > 0 ? (
            <div className={structuredGridClassName}>
              {structuredSizeFieldDefinitions.map((field) => (
                <div key={field.name} className={structuredCardClassName}>
                  <label
                    htmlFor={`structured-size-${field.name}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    {field.label}
                  </label>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div>
                      <label
                        htmlFor={`structured-size-${field.name}`}
                        className="mb-1 block text-xs font-medium text-gray-500"
                      >
                        単一値
                      </label>
                      <div className={getFormControlWrapperClassName()}>
                        <input
                          id={`structured-size-${field.name}`}
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={structuredSizeValues[field.name]?.value ?? ""}
                          disabled={disabled}
                          onChange={(e) =>
                            onUpdateStructuredSizeValue(
                              field.name,
                              "value",
                              e.target.value,
                            )
                          }
                          className={FORM_CONTROL_INNER_INPUT_CLASS}
                        />
                        <span className="text-sm text-gray-500">cm</span>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor={`structured-size-${field.name}-note`}
                        className="mb-1 block text-xs font-medium text-gray-500"
                      >
                        注記
                      </label>
                      <input
                        id={`structured-size-${field.name}-note`}
                        type="text"
                        inputMode="text"
                        value={structuredSizeValues[field.name]?.note ?? ""}
                        disabled={disabled}
                        placeholder="例: ヌード寸 / 約 / 後ろ約"
                        onChange={(e) =>
                          onUpdateStructuredSizeValue(
                            field.name,
                            "note",
                            e.target.value,
                          )
                        }
                        className={getFormControlClassName()}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <div>
                      <label
                        htmlFor={`structured-size-${field.name}-min`}
                        className="mb-1 block text-xs font-medium text-gray-500"
                      >
                        範囲最小
                      </label>
                      <div className={getFormControlWrapperClassName()}>
                        <input
                          id={`structured-size-${field.name}-min`}
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={structuredSizeValues[field.name]?.min ?? ""}
                          disabled={disabled}
                          onChange={(e) =>
                            onUpdateStructuredSizeValue(
                              field.name,
                              "min",
                              e.target.value,
                            )
                          }
                          className={FORM_CONTROL_INNER_INPUT_CLASS}
                        />
                        <span className="text-sm text-gray-500">cm</span>
                      </div>
                    </div>
                    <div className="hidden items-end pb-3 text-sm text-gray-400 lg:flex">
                      〜
                    </div>
                    <div>
                      <label
                        htmlFor={`structured-size-${field.name}-max`}
                        className="mb-1 block text-xs font-medium text-gray-500"
                      >
                        範囲最大
                      </label>
                      <div className={getFormControlWrapperClassName()}>
                        <input
                          id={`structured-size-${field.name}-max`}
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={structuredSizeValues[field.name]?.max ?? ""}
                          disabled={disabled}
                          onChange={(e) =>
                            onUpdateStructuredSizeValue(
                              field.name,
                              "max",
                              e.target.value,
                            )
                          }
                          className={FORM_CONTROL_INNER_INPUT_CLASS}
                        />
                        <span className="text-sm text-gray-500">cm</span>
                      </div>
                    </div>
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
            <div className={customSectionClassName}>
              <p className="text-sm font-medium text-gray-700">自由項目</p>
              {customSizeFields.map((field) => (
                <div key={field.id} className={customCardClassName}>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <input
                      type="text"
                      placeholder="項目名"
                      value={field.label}
                      disabled={disabled}
                      onChange={(e) =>
                        onUpdateCustomSizeField(
                          field.id,
                          "label",
                          e.target.value,
                        )
                      }
                      className={getFormControlClassName()}
                    />
                    <input
                      type="text"
                      placeholder="例: ヌード寸 / 約 / 後ろ約"
                      value={field.note}
                      disabled={disabled}
                      onChange={(e) =>
                        onUpdateCustomSizeField(
                          field.id,
                          "note",
                          e.target.value,
                        )
                      }
                      className={getFormControlClassName()}
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveCustomSizeField(field.id)}
                      disabled={disabled}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                      削除
                    </button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        単一値
                      </label>
                      <div className={getFormControlWrapperClassName()}>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          placeholder="値"
                          value={field.value}
                          disabled={disabled}
                          onChange={(e) =>
                            onUpdateCustomSizeField(
                              field.id,
                              "value",
                              e.target.value,
                            )
                          }
                          className={FORM_CONTROL_INNER_INPUT_CLASS}
                        />
                        <span className="text-sm text-gray-500">cm</span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        範囲最小
                      </label>
                      <div className={getFormControlWrapperClassName()}>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          placeholder="最小値"
                          value={field.min}
                          disabled={disabled}
                          onChange={(e) =>
                            onUpdateCustomSizeField(
                              field.id,
                              "min",
                              e.target.value,
                            )
                          }
                          className={FORM_CONTROL_INNER_INPUT_CLASS}
                        />
                        <span className="text-sm text-gray-500">cm</span>
                      </div>
                    </div>
                    <div className="hidden items-end pb-3 text-sm text-gray-400 lg:flex">
                      〜
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        範囲最大
                      </label>
                      <div className={getFormControlWrapperClassName()}>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          placeholder="最大値"
                          value={field.max}
                          disabled={disabled}
                          onChange={(e) =>
                            onUpdateCustomSizeField(
                              field.id,
                              "max",
                              e.target.value,
                            )
                          }
                          className={FORM_CONTROL_INNER_INPUT_CLASS}
                        />
                        <span className="text-sm text-gray-500">cm</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {hasDuplicateWarnings ? (
            <p className="text-xs text-amber-600">同名の実寸項目があります。</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
