import type {
  ItemCustomSizeField,
  ItemSizeDetails,
  ItemStructuredSizeDetails,
  StructuredSizeFieldName,
} from "@/types/items";

export type StructuredSizeFieldDefinition = {
  name: StructuredSizeFieldName;
  label: string;
};

export type EditableCustomSizeField = {
  id: string;
  label: string;
  value: string;
};

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
  }

  if (category === "bottoms") {
    if (shape === "tight-skirt" || shape === "a-line-skirt") return "skirt";
    if (shape === "tapered" || shape === "wide" || shape === "straight") {
      return "pants";
    }
  }

  if (category === "pants") {
    if (
      shape === "pants" ||
      shape === "denim" ||
      shape === "slacks" ||
      shape === "short-pants" ||
      shape === "other"
    ) {
      return "pants";
    }
  }

  if (category === "skirts") {
    if (shape === "skirt" || shape === "other") {
      return "skirt";
    }
  }

  if (category === "outerwear") {
    if (
      shape === "jacket" ||
      shape === "blouson" ||
      shape === "down-padded" ||
      shape === "mountain-parka"
    ) {
      return "jacket";
    }
  }

  if (
    (category === "onepiece_allinone" || category === "onepiece_dress") &&
    shape === "onepiece"
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
    label: STRUCTURED_SIZE_FIELD_LABELS[name],
  }));
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

          if (typeof fieldValue !== "number" || Number.isNaN(fieldValue)) {
            return carry;
          }

          carry[name as StructuredSizeFieldName] = fieldValue;
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
        typeof recordField.value !== "number" ||
        typeof recordField.sort_order !== "number"
      ) {
        return carry;
      }

      carry.push({
        label: recordField.label,
        value: recordField.value,
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

export function formatSizeDetailValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
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
  structuredValues: Partial<Record<StructuredSizeFieldName, string>>,
  customFields: EditableCustomSizeField[],
): ItemSizeDetails | null {
  const structured = definitions.reduce<ItemStructuredSizeDetails>(
    (carry, definition) => {
      const rawValue = structuredValues[definition.name]?.trim();

      if (!rawValue) {
        return carry;
      }

      const parsedValue = Number(rawValue);
      if (Number.isNaN(parsedValue)) {
        return carry;
      }

      carry[definition.name] = parsedValue;
      return carry;
    },
    {},
  );

  const nextCustomFields = customFields.reduce<ItemCustomSizeField[]>(
    (carry, field, index) => {
      const label = field.label.trim();
      const rawValue = field.value.trim();

      if (!label || !rawValue) {
        return carry;
      }

      const parsedValue = Number(rawValue);
      if (Number.isNaN(parsedValue)) {
        return carry;
      }

      carry.push({
        label,
        value: parsedValue,
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
