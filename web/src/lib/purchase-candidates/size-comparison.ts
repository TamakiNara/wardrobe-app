import {
  formatSizeDetailValue,
  getStructuredSizeFieldDefinitions,
  normalizeItemSizeDetails,
  type StructuredSizeFieldContext,
} from "@/lib/items/size-details";
import type {
  ItemCustomSizeField,
  ItemRecord,
  ItemSizeDetails,
} from "@/types/items";
import type { PurchaseCandidateRecord } from "@/types/purchase-candidates";

type ComparisonItemLike = Pick<
  ItemRecord,
  | "id"
  | "name"
  | "status"
  | "category"
  | "subcategory"
  | "shape"
  | "size_label"
  | "size_details"
>;

type ComparisonCandidateLike = Pick<
  PurchaseCandidateRecord,
  | "id"
  | "name"
  | "size_label"
  | "size_note"
  | "size_details"
  | "alternate_size_label"
  | "alternate_size_note"
  | "alternate_size_details"
> & {
  resolvedCategory?: string | null;
  resolvedSubcategory?: string | null;
  resolvedShape?: string | null;
};

export type PurchaseCandidateSizeOptionKey = "primary" | "alternate";

export type PurchaseCandidateSizeOption = {
  key: PurchaseCandidateSizeOptionKey;
  label: string;
  note: string | null;
  sizeDetails: ItemSizeDetails | null;
  optionLabel: string;
};

export type PurchaseCandidateComparisonOption = {
  id: number;
  label: string;
  item: ComparisonItemLike;
};

export type PurchaseCandidateSizeComparisonRow = {
  key: string;
  label: string;
  candidateValue: string;
  itemValue: string;
};

export type PurchaseCandidateMultiSizeComparisonRow = {
  key: string;
  label: string;
  candidateValues: Partial<Record<PurchaseCandidateSizeOptionKey, string>>;
  itemValue: string;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim();
}

function hasAnySizeDetails(sizeDetails: unknown) {
  const normalized = normalizeItemSizeDetails(sizeDetails);
  const hasStructured = Boolean(
    normalized?.structured &&
    Object.values(normalized.structured).some(
      (fieldValue) => fieldValue !== undefined,
    ),
  );
  const hasCustom = Boolean(normalized?.custom_fields?.length);

  return hasStructured || hasCustom;
}

function hasAnySizeCandidateContent(option: {
  label: string | null | undefined;
  note: string | null | undefined;
  sizeDetails: ItemSizeDetails | null | undefined;
}) {
  return (
    normalizeText(option.label) !== "" ||
    normalizeText(option.note) !== "" ||
    hasAnySizeDetails(option.sizeDetails)
  );
}

function buildItemOptionLabel(item: ComparisonItemLike) {
  return item.name?.trim() || `アイテム #${item.id}`;
}

function buildSizeOptionLabel(
  ordinalLabel: string,
  sizeLabel: string | null,
): string {
  const normalizedLabel = normalizeText(sizeLabel);

  return normalizedLabel === ""
    ? ordinalLabel
    : `${ordinalLabel}（${normalizedLabel}）`;
}

export function getPurchaseCandidateSizeOptions(
  candidate: ComparisonCandidateLike,
): PurchaseCandidateSizeOption[] {
  const options: PurchaseCandidateSizeOption[] = [];

  if (
    hasAnySizeCandidateContent({
      label: candidate.size_label,
      note: candidate.size_note,
      sizeDetails: candidate.size_details,
    })
  ) {
    options.push({
      key: "primary",
      label: candidate.size_label ?? "",
      note: candidate.size_note ?? null,
      sizeDetails: candidate.size_details,
      optionLabel: buildSizeOptionLabel("サイズ候補1", candidate.size_label),
    });
  }

  if (
    hasAnySizeCandidateContent({
      label: candidate.alternate_size_label,
      note: candidate.alternate_size_note,
      sizeDetails: candidate.alternate_size_details,
    })
  ) {
    options.push({
      key: "alternate",
      label: candidate.alternate_size_label ?? "",
      note: candidate.alternate_size_note ?? null,
      sizeDetails: candidate.alternate_size_details,
      optionLabel: buildSizeOptionLabel(
        "サイズ候補2",
        candidate.alternate_size_label,
      ),
    });
  }

  return options;
}

export function getPurchaseCandidateComparisonOptions(
  candidate: ComparisonCandidateLike,
  items: ComparisonItemLike[],
): PurchaseCandidateComparisonOption[] {
  const category = candidate.resolvedCategory ?? null;
  const subcategory = candidate.resolvedSubcategory ?? null;
  const shape = candidate.resolvedShape ?? null;
  const hasComparableShape = normalizeText(shape) !== "";

  return items
    .filter((item) => item.status === "active")
    .filter((item) => hasAnySizeDetails(item.size_details))
    .filter((item) => !category || item.category === category)
    .sort((left, right) => {
      const leftSubcategoryScore = left.subcategory === subcategory ? 0 : 1;
      const rightSubcategoryScore = right.subcategory === subcategory ? 0 : 1;
      if (leftSubcategoryScore !== rightSubcategoryScore) {
        return leftSubcategoryScore - rightSubcategoryScore;
      }

      const leftShapeScore =
        hasComparableShape &&
        left.subcategory === subcategory &&
        left.shape === shape
          ? 0
          : 1;
      const rightShapeScore =
        hasComparableShape &&
        right.subcategory === subcategory &&
        right.shape === shape
          ? 0
          : 1;
      if (leftShapeScore !== rightShapeScore) {
        return leftShapeScore - rightShapeScore;
      }

      return buildItemOptionLabel(left).localeCompare(
        buildItemOptionLabel(right),
        "ja",
      );
    })
    .map((item) => ({
      id: item.id,
      label: buildItemOptionLabel(item),
      item,
    }));
}

function buildFieldDefinitionsUnion(
  candidateContext: StructuredSizeFieldContext,
  itemContext: StructuredSizeFieldContext,
) {
  const definitions = [
    ...getStructuredSizeFieldDefinitions(
      candidateContext.category,
      candidateContext.shape,
    ),
    ...getStructuredSizeFieldDefinitions(
      itemContext.category,
      itemContext.shape,
    ),
  ];

  return definitions.filter(
    (definition, index) =>
      definitions.findIndex((item) => item.name === definition.name) === index,
  );
}

function buildCustomFieldRows(
  candidateFields: ItemCustomSizeField[],
  itemFields: ItemCustomSizeField[],
): PurchaseCandidateSizeComparisonRow[] {
  const labels: string[] = [];

  candidateFields.forEach((field) => {
    const label = normalizeText(field.label);
    if (label !== "" && !labels.includes(label)) {
      labels.push(label);
    }
  });

  itemFields.forEach((field) => {
    const label = normalizeText(field.label);
    if (label !== "" && !labels.includes(label)) {
      labels.push(label);
    }
  });

  return labels.map((label) => {
    const candidateField = candidateFields.find(
      (field) => normalizeText(field.label) === label,
    );
    const itemField = itemFields.find(
      (field) => normalizeText(field.label) === label,
    );

    return {
      key: `custom:${label}`,
      label,
      candidateValue: candidateField
        ? formatSizeDetailValue(candidateField)
        : "未設定",
      itemValue: itemField ? formatSizeDetailValue(itemField) : "未設定",
    };
  });
}

export function buildPurchaseCandidateSizeComparisonRows(
  sizeOption: PurchaseCandidateSizeOption,
  categoryContext: StructuredSizeFieldContext,
  item: ComparisonItemLike,
): PurchaseCandidateSizeComparisonRow[] {
  const candidateSizeDetails = normalizeItemSizeDetails(sizeOption.sizeDetails);
  const itemSizeDetails = normalizeItemSizeDetails(item.size_details);
  const definitions = buildFieldDefinitionsUnion(categoryContext, {
    category: item.category,
    shape: item.shape,
  });

  const structuredRows = definitions.map((definition) => {
    const candidateValue = candidateSizeDetails?.structured?.[definition.name];
    const itemValue = itemSizeDetails?.structured?.[definition.name];

    return {
      key: definition.name,
      label: definition.label,
      candidateValue: candidateValue
        ? formatSizeDetailValue(candidateValue)
        : "未設定",
      itemValue: itemValue ? formatSizeDetailValue(itemValue) : "未設定",
    };
  });

  const customRows = buildCustomFieldRows(
    candidateSizeDetails?.custom_fields ?? [],
    itemSizeDetails?.custom_fields ?? [],
  );

  return [...structuredRows, ...customRows];
}

export function buildPurchaseCandidateMultiSizeComparisonRows(
  sizeOptions: PurchaseCandidateSizeOption[],
  categoryContext: StructuredSizeFieldContext,
  item: ComparisonItemLike,
): PurchaseCandidateMultiSizeComparisonRow[] {
  const itemSizeDetails = normalizeItemSizeDetails(item.size_details);
  const definitions = buildFieldDefinitionsUnion(categoryContext, {
    category: item.category,
    shape: item.shape,
  });

  const structuredRows: PurchaseCandidateMultiSizeComparisonRow[] =
    definitions.map((definition) => {
      const candidateValues = Object.fromEntries(
        sizeOptions.map((option) => {
          const candidateSizeDetails = normalizeItemSizeDetails(
            option.sizeDetails,
          );
          const candidateValue =
            candidateSizeDetails?.structured?.[definition.name];

          return [
            option.key,
            candidateValue ? formatSizeDetailValue(candidateValue) : "未設定",
          ];
        }),
      ) as Partial<Record<PurchaseCandidateSizeOptionKey, string>>;

      const itemValue = itemSizeDetails?.structured?.[definition.name];

      return {
        key: definition.name,
        label: definition.label,
        candidateValues,
        itemValue: itemValue ? formatSizeDetailValue(itemValue) : "未設定",
      };
    });

  const customLabels: string[] = [];

  sizeOptions.forEach((option) => {
    const candidateSizeDetails = normalizeItemSizeDetails(option.sizeDetails);
    candidateSizeDetails?.custom_fields?.forEach((field) => {
      const label = normalizeText(field.label);
      if (label !== "" && !customLabels.includes(label)) {
        customLabels.push(label);
      }
    });
  });

  itemSizeDetails?.custom_fields?.forEach((field) => {
    const label = normalizeText(field.label);
    if (label !== "" && !customLabels.includes(label)) {
      customLabels.push(label);
    }
  });

  const customRows: PurchaseCandidateMultiSizeComparisonRow[] =
    customLabels.map((label) => {
      const candidateValues = Object.fromEntries(
        sizeOptions.map((option) => {
          const candidateSizeDetails = normalizeItemSizeDetails(
            option.sizeDetails,
          );
          const candidateField = candidateSizeDetails?.custom_fields?.find(
            (field) => normalizeText(field.label) === label,
          );

          return [
            option.key,
            candidateField ? formatSizeDetailValue(candidateField) : "未設定",
          ];
        }),
      ) as Partial<Record<PurchaseCandidateSizeOptionKey, string>>;

      const itemField = itemSizeDetails?.custom_fields?.find(
        (field) => normalizeText(field.label) === label,
      );

      return {
        key: `custom:${label}`,
        label,
        candidateValues,
        itemValue: itemField ? formatSizeDetailValue(itemField) : "未設定",
      };
    });

  return [...structuredRows, ...customRows];
}

export function hasStructuredSizeComparisonBase(
  candidate: ComparisonCandidateLike,
) {
  return getPurchaseCandidateSizeOptions(candidate).some((option) =>
    hasAnySizeDetails(option.sizeDetails),
  );
}
