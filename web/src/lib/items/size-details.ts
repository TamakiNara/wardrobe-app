import type {
  ItemCustomSizeField,
  ItemSizeDetailValue,
  ItemSizeDetails,
  ItemStructuredSizeDetails,
  StructuredSizeFieldName,
} from "@/types/items";

export type StructuredSizeFieldContext = {
  category?: string | null;
  shape?: string | null;
};

export type StructuredSizeFieldDefinition = {
  name: StructuredSizeFieldName;
  label: string;
};

export type EditableSizeDetailValue = {
  value: string;
  min: string;
  max: string;
  note: string;
};

export type EditableCustomSizeField = {
  id: string;
  label: string;
} & EditableSizeDetailValue;

export function createEmptyEditableSizeDetailValue(): EditableSizeDetailValue {
  return {
    value: "",
    min: "",
    max: "",
    note: "",
  };
}

export function buildEditableSizeDetailValue(
  value?: ItemSizeDetailValue | null,
): EditableSizeDetailValue {
  return {
    value:
      value?.value !== null && value?.value !== undefined
        ? formatSizeDetailNumber(value.value)
        : "",
    min:
      value?.min !== null && value?.min !== undefined
        ? formatSizeDetailNumber(value.min)
        : "",
    max:
      value?.max !== null && value?.max !== undefined
        ? formatSizeDetailNumber(value.max)
        : "",
    note: value?.note ?? "",
  };
}

const STRUCTURED_SIZE_FIELD_LABELS: Record<StructuredSizeFieldName, string> = {
  shoulder_width: "肩幅",
  body_width: "身幅",
  body_length: "着丈",
  sleeve_length: "袖丈",
  sleeve_width: "袖幅",
  cuff_width: "袖口幅",
  neck_circumference: "襟周り",
  waist: "ウエスト",
  hip: "ヒップ",
  rise: "股上",
  inseam: "股下",
  hem_width: "裾幅",
  thigh_width: "わたり幅",
  total_length: "総丈",
};

const STRUCTURED_SIZE_FIELD_GROUPS = {
  jacket: [
    "shoulder_width",
    "body_width",
    "body_length",
    "sleeve_length",
    "sleeve_width",
    "cuff_width",
  ],
  shirt: [
    "shoulder_width",
    "body_width",
    "body_length",
    "sleeve_length",
    "neck_circumference",
  ],
  tshirt: ["shoulder_width", "body_width", "body_length", "sleeve_length"],
  blouse: ["shoulder_width", "body_width", "body_length", "sleeve_length"],
  pants: ["waist", "hip", "rise", "inseam", "hem_width", "thigh_width"],
  skirt: ["waist", "hip", "total_length"],
  onepiece: ["shoulder_width", "body_width", "sleeve_length", "total_length"],
} satisfies Record<string, StructuredSizeFieldName[]>;

type StructuredSizeFieldGroupName = keyof typeof STRUCTURED_SIZE_FIELD_GROUPS;

function resolveStructuredSizeFieldGroup(
  category?: string | null,
  shape?: string | null,
): StructuredSizeFieldGroupName | null {
  if (category === "tops") {
    if (shape === "jacket") return "jacket";
    if (shape === "shirt") return "shirt";
    if (shape === "tshirt") return "tshirt";
    if (shape === "blouse") return "blouse";
    if (
      shape === "knit" ||
      shape === "cardigan" ||
      shape === "sweatshirt" ||
      shape === "hoodie"
    ) {
      return "tshirt";
    }
  }

  if (category === "bottoms") {
    if (
      shape === "mini-skirt" ||
      shape === "tight-skirt" ||
      shape === "a-line-skirt" ||
      shape === "flare-skirt"
    ) {
      return "skirt";
    }
    if (shape === "tapered" || shape === "wide" || shape === "straight") {
      return "pants";
    }
  }

  if (category === "pants") {
    if (
      shape === "pants" ||
      shape === "straight" ||
      shape === "tapered" ||
      shape === "wide" ||
      shape === "culottes" ||
      shape === "jogger" ||
      shape === "skinny" ||
      shape === "gaucho"
    ) {
      return "pants";
    }
  }

  if (category === "skirts") {
    if (
      shape === "skirt" ||
      shape === "tight" ||
      shape === "flare" ||
      shape === "a_line" ||
      shape === "mermaid" ||
      shape === "pleated"
    ) {
      return "skirt";
    }
  }

  if (category === "outerwear") {
    if (
      shape === "jacket" ||
      shape === "tailored" ||
      shape === "no_collar" ||
      shape === "blazer" ||
      shape === "blouson" ||
      shape === "down-padded" ||
      shape === "mountain-parka"
    ) {
      return "jacket";
    }
  }

  if (
    (category === "onepiece_allinone" || category === "onepiece_dress") &&
    (shape === "onepiece" || shape === "dress")
  ) {
    return "onepiece";
  }

  return null;
}

export function getStructuredSizeFieldDefinitions(
  category?: string | null,
  shape?: string | null,
): StructuredSizeFieldDefinition[] {
  const group = resolveStructuredSizeFieldGroup(category, shape);

  if (!group) {
    return [];
  }

  return STRUCTURED_SIZE_FIELD_GROUPS[group].map((name) => ({
    name,
    label: resolveStructuredSizeFieldLabel(name, category, shape),
  }));
}

export function getStructuredSizeFieldDefinitionsFromContext(
  context?: StructuredSizeFieldContext | null,
): StructuredSizeFieldDefinition[] {
  return getStructuredSizeFieldDefinitions(context?.category, context?.shape);
}

export function normalizeItemSizeDetails(
  value: unknown,
): ItemSizeDetails | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const structuredRecord =
    record.structured && typeof record.structured === "object"
      ? (record.structured as Record<string, unknown>)
      : null;
  const customFieldRecords = Array.isArray(record.custom_fields)
    ? record.custom_fields
    : [];

  const structured = structuredRecord
    ? Object.entries(structuredRecord).reduce<ItemStructuredSizeDetails>(
        (carry, [name, fieldValue]) => {
          if (!(name in STRUCTURED_SIZE_FIELD_LABELS)) {
            return carry;
          }

          const normalizedFieldValue = normalizeSizeDetailValue(fieldValue);
          if (!normalizedFieldValue) {
            return carry;
          }

          carry[name as StructuredSizeFieldName] = normalizedFieldValue;
          return carry;
        },
        {},
      )
    : {};

  const customFields = customFieldRecords.reduce<ItemCustomSizeField[]>(
    (carry, field) => {
      if (!field || typeof field !== "object" || Array.isArray(field)) {
        return carry;
      }

      const recordField = field as Record<string, unknown>;
      if (
        typeof recordField.label !== "string" ||
        typeof recordField.sort_order !== "number"
      ) {
        return carry;
      }

      const normalizedFieldValue = normalizeSizeDetailValue({
        value: recordField.value,
        min: recordField.min,
        max: recordField.max,
        note: recordField.note,
      });

      if (!normalizedFieldValue) {
        return carry;
      }

      carry.push({
        label: recordField.label,
        ...normalizedFieldValue,
        sort_order: recordField.sort_order,
      });
      return carry;
    },
    [],
  );

  if (Object.keys(structured).length === 0 && customFields.length === 0) {
    return null;
  }

  return {
    ...(Object.keys(structured).length > 0 ? { structured } : {}),
    ...(customFields.length > 0 ? { custom_fields: customFields } : {}),
  };
}

export function resolveStructuredSizeFieldLabel(
  fieldName: StructuredSizeFieldName,
  category?: string | null,
  shape?: string | null,
) {
  void category;
  void shape;

  return STRUCTURED_SIZE_FIELD_LABELS[fieldName];
}

export function formatSizeDetailNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatSizeDetailValue(value: ItemSizeDetailValue | number) {
  const normalizedValue = normalizeSizeDetailValue(value);

  if (!normalizedValue) {
    return "";
  }

  const valueText =
    normalizedValue.min !== null || normalizedValue.max !== null
      ? buildRangeText(normalizedValue.min, normalizedValue.max)
      : normalizedValue.value !== null
        ? `${formatSizeDetailNumber(normalizedValue.value)}cm`
        : "";

  if (!valueText) {
    return "";
  }

  return normalizedValue.note
    ? `${normalizedValue.note} ${valueText}`
    : valueText;
}

export function buildSizeDetailDuplicateWarnings(
  definitions: StructuredSizeFieldDefinition[],
  customFieldLabels: string[],
) {
  const normalizedStructuredLabels = new Set(
    definitions.map((definition) => definition.label.trim()),
  );
  const normalizedCustomLabels = customFieldLabels
    .map((label) => label.trim())
    .filter(Boolean);

  const duplicateStructuredLabels = normalizedCustomLabels.filter((label) =>
    normalizedStructuredLabels.has(label),
  );

  const duplicateCustomLabels = normalizedCustomLabels.filter(
    (label, index) => normalizedCustomLabels.indexOf(label) !== index,
  );

  return {
    hasStructuredDuplicates: duplicateStructuredLabels.length > 0,
    hasCustomDuplicates: duplicateCustomLabels.length > 0,
  };
}

export function buildItemSizeDetailsPayload(
  definitions: StructuredSizeFieldDefinition[],
  structuredValues: Partial<
    Record<StructuredSizeFieldName, EditableSizeDetailValue>
  >,
  customFields: EditableCustomSizeField[],
): ItemSizeDetails | null {
  const structured = definitions.reduce<ItemStructuredSizeDetails>(
    (carry, definition) => {
      const normalizedFieldValue = normalizeEditableSizeDetailValue(
        structuredValues[definition.name],
      );

      if (!normalizedFieldValue) {
        return carry;
      }

      carry[definition.name] = normalizedFieldValue;
      return carry;
    },
    {},
  );

  const nextCustomFields = customFields.reduce<ItemCustomSizeField[]>(
    (carry, field, index) => {
      const label = field.label.trim();
      const normalizedFieldValue = normalizeEditableSizeDetailValue(field);

      if (!label || !normalizedFieldValue) {
        return carry;
      }

      carry.push({
        label,
        ...normalizedFieldValue,
        sort_order: index + 1,
      });
      return carry;
    },
    [],
  );

  if (Object.keys(structured).length === 0 && nextCustomFields.length === 0) {
    return null;
  }

  return {
    ...(Object.keys(structured).length > 0 ? { structured } : {}),
    ...(nextCustomFields.length > 0 ? { custom_fields: nextCustomFields } : {}),
  };
}

function buildRangeText(min: number | null, max: number | null) {
  if (min !== null && max !== null) {
    return `${formatSizeDetailNumber(min)}〜${formatSizeDetailNumber(max)}cm`;
  }

  if (min !== null) {
    return `${formatSizeDetailNumber(min)}cm〜`;
  }

  if (max !== null) {
    return `〜${formatSizeDetailNumber(max)}cm`;
  }

  return "";
}

function parseNullableSizeNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    const parsedValue = Number(trimmedValue);
    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  return null;
}

function normalizeSizeDetailValue(value: unknown): ItemSizeDetailValue | null {
  if (typeof value === "number") {
    return {
      value,
      min: null,
      max: null,
      note: null,
    };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const min = parseNullableSizeNumber(record.min);
  const max = parseNullableSizeNumber(record.max);
  const rangeIsSet = min !== null || max !== null;
  const normalizedValue = rangeIsSet
    ? null
    : parseNullableSizeNumber(record.value);
  const note =
    typeof record.note === "string" && record.note.trim()
      ? record.note.trim()
      : null;

  if (normalizedValue === null && !rangeIsSet) {
    return null;
  }

  return {
    value: normalizedValue,
    min,
    max,
    note,
  };
}

function normalizeEditableSizeDetailValue(
  value?: EditableSizeDetailValue | null,
): ItemSizeDetailValue | null {
  if (!value) {
    return null;
  }

  return normalizeSizeDetailValue(value);
}
