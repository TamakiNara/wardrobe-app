import { useMemo, useState } from "react";
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
  onAddCustomSizeField,
  onUpdateStructuredSizeValue,
  onUpdateCustomSizeField,
  onRemoveCustomSizeField,
}: ItemSizeDetailsFieldsProps) {
  const [hasExpandedOnce, setHasExpandedOnce] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasExistingSizeDetails = useMemo(() => {
    const hasStructuredValues = Object.values(structuredSizeValues).some(
      (field) =>
        Boolean(field) &&
        Boolean(
          field?.value?.trim() ||
          field?.min?.trim() ||
          field?.max?.trim() ||
          field?.note?.trim(),
        ),
    );
    const hasCustomValues = customSizeFields.some((field) =>
      Boolean(
        field.label.trim() ||
        field.value.trim() ||
        field.min.trim() ||
        field.max.trim() ||
        field.note.trim(),
      ),
    );

    return hasStructuredValues || hasCustomValues;
  }, [customSizeFields, structuredSizeValues]);
  const isExpanded =
    hasExpandedOnce || hasExistingSizeDetails ? !isCollapsed : false;

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-700">実寸</p>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <>
              <button
                type="button"
                onClick={onAddCustomSizeField}
                disabled={disabled}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                自由項目を追加
              </button>
              <button
                type="button"
                aria-expanded="true"
                onClick={() => {
                  setHasExpandedOnce(true);
                  setIsCollapsed(true);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                折りたたむ
              </button>
            </>
          ) : (
            <button
              type="button"
              aria-expanded="false"
              onClick={() => {
                setHasExpandedOnce(true);
                setIsCollapsed(false);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              実寸を入力
            </button>
          )}
        </div>
      </div>

      {isExpanded ? (
        <>
          {structuredSizeFieldDefinitions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {structuredSizeFieldDefinitions.map((field) => (
                <div
                  key={field.name}
                  className="space-y-3 rounded-lg border border-gray-200 bg-white p-3"
                >
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
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">自由項目</p>
              {customSizeFields.map((field) => (
                <div
                  key={field.id}
                  className="space-y-3 rounded-lg border border-gray-200 bg-white p-3"
                >
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
