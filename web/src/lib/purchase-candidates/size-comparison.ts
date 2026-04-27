import {
  formatSizeDetailValue,
  getStructuredSizeFieldDefinitions,
  normalizeItemSizeDetails,
  type StructuredSizeFieldContext,
} from "@/lib/items/size-details";
import type { ItemCustomSizeField, ItemRecord } from "@/types/items";
import type { PurchaseCandidateRecord } from "@/types/purchase-candidates";

type ComparisonItemLike = Pick<
  ItemRecord,
  | "id"
  | "name"
  | "status"
  | "category"
  | "subcategory"
  | "shape"
  | "size_details"
>;

type ComparisonCandidateLike = Pick<
  PurchaseCandidateRecord,
  "id" | "name" | "size_details"
> & {
  resolvedCategory?: string | null;
  resolvedSubcategory?: string | null;
  resolvedShape?: string | null;
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

function normalizeSizeLabel(label: string) {
  return label.trim();
}

function hasAnySizeDetails(sizeDetails: unknown) {
  const normalized = normalizeItemSizeDetails(sizeDetails);
  const hasStructured =
    Boolean(normalized?.structured) &&
    Object.keys(normalized.structured ?? {}).length > 0;
  const hasCustom = Boolean(normalized?.custom_fields?.length);

  return hasStructured || hasCustom;
}

function buildItemOptionLabel(item: ComparisonItemLike) {
  return item.name?.trim() || `アイテム #${item.id}`;
}

export function getPurchaseCandidateComparisonOptions(
  candidate: ComparisonCandidateLike,
  items: ComparisonItemLike[],
): PurchaseCandidateComparisonOption[] {
  const category = candidate.resolvedCategory ?? null;
  const subcategory = candidate.resolvedSubcategory ?? null;
  const shape = candidate.resolvedShape ?? null;

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

      const shapeComparable = Boolean(shape?.trim());
      const leftShapeScore =
        shapeComparable &&
        left.subcategory === subcategory &&
        left.shape === shape
          ? 0
          : 1;
      const rightShapeScore =
        shapeComparable &&
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

  return definitions.filter((definition, index) => {
    return (
      definitions.findIndex((item) => item.name === definition.name) === index
    );
  });
}

function buildCustomFieldRows(
  candidateFields: ItemCustomSizeField[],
  itemFields: ItemCustomSizeField[],
): PurchaseCandidateSizeComparisonRow[] {
  const labels: string[] = [];

  candidateFields.forEach((field) => {
    const label = normalizeSizeLabel(field.label);
    if (label && !labels.includes(label)) {
      labels.push(label);
    }
  });

  itemFields.forEach((field) => {
    const label = normalizeSizeLabel(field.label);
    if (label && !labels.includes(label)) {
      labels.push(label);
    }
  });

  return labels.map((label) => {
    const candidateField = candidateFields.find(
      (field) => normalizeSizeLabel(field.label) === label,
    );
    const itemField = itemFields.find(
      (field) => normalizeSizeLabel(field.label) === label,
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
  candidate: ComparisonCandidateLike,
  item: ComparisonItemLike,
): PurchaseCandidateSizeComparisonRow[] {
  const candidateSizeDetails = normalizeItemSizeDetails(candidate.size_details);
  const itemSizeDetails = normalizeItemSizeDetails(item.size_details);
  const definitions = buildFieldDefinitionsUnion(
    {
      category: candidate.resolvedCategory ?? null,
      shape: candidate.resolvedShape ?? null,
    },
    {
      category: item.category,
      shape: item.shape,
    },
  );

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

export function hasStructuredSizeComparisonBase(
  candidate: ComparisonCandidateLike,
) {
  return hasAnySizeDetails(candidate.size_details);
}
