"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, Info, TriangleAlert } from "lucide-react";
import FieldLabel from "@/components/forms/field-label";
import {
  FORM_CONTROL_COLOR_SCHEME_CLASS,
  FORM_CONTROL_INNER_INPUT_CLASS,
  getFormControlClassName,
  getFormControlWrapperClassName,
} from "@/components/forms/control-styles";
import ColorSelect from "@/components/items/color-select";
import BrandNameField from "@/components/items/brand-name-field";
import ItemFormSection from "@/components/items/item-form-section";
import ItemMaterialFields from "@/components/items/item-material-fields";
import ItemSizeDetailsFields from "@/components/items/item-size-details-fields";
import PurchaseCandidateImageUploader from "@/components/purchase-candidates/purchase-candidate-image-uploader";
import { fetchCategoryGroups } from "@/lib/api/categories";
import {
  flattenValidationErrors,
  getUserFacingSubmitErrorMessage,
} from "@/lib/api/error-message";
import { fetchCategoryVisibilitySettings } from "@/lib/api/settings";
import { SEASON_OPTIONS, TPO_OPTIONS } from "@/lib/master-data/item-attributes";
import {
  BOTTOMS_LENGTH_OPTIONS,
  BOTTOMS_RISE_OPTIONS,
  SKIRT_DESIGN_OPTIONS,
  SKIRT_LENGTH_OPTIONS,
  SKIRT_MATERIAL_OPTIONS,
  getLegwearCoverageFieldLabel,
  getLegwearCoverageOptions,
  getLegwearCoveragePlaceholder,
  resolveBottomsLengthType,
  resolveLegwearCoverageType,
  resolveSkirtDesignType,
  resolveSkirtLengthType,
  resolveSkirtMaterialType,
  type BottomsLengthType,
  type BottomsRiseType,
  type LegwearCoverageType,
  type SkirtDesignType,
  type SkirtLengthType,
  type SkirtMaterialType,
} from "@/lib/master-data/item-skin-exposure";
import {
  DEFAULT_TOPS_FIT,
  TOPS_DESIGNS,
  TOPS_FITS,
  TOPS_LENGTHS,
  TOPS_NECKS,
  TOPS_RULES,
  TOPS_SLEEVES,
  type TopsDesignValue,
  type TopsFitValue,
  type TopsLengthValue,
  type TopsNeckValue,
  type TopsSleeveValue,
} from "@/lib/master-data/item-tops";
import {
  ITEM_COLORS,
  resolveCustomColorHex,
  type ItemColorValue,
} from "@/lib/master-data/item-colors";
import { findItemShapeLabel } from "@/lib/master-data/item-shapes";
import {
  buildEditableItemMaterials,
  createEmptyItemMaterialRow,
  validateItemMaterials,
  type EditableItemMaterial,
} from "@/lib/items/materials";
import { ITEM_SHEERNESS_LABELS } from "@/lib/items/metadata";
import { swapPurchaseCandidateSizeCandidates } from "@/lib/purchase-candidates/size-options";
import {
  buildItemSizeDetailsPayload,
  buildSizeDetailDuplicateWarnings,
  buildEditableSizeDetailValue,
  createEmptyEditableSizeDetailValue,
  getStructuredSizeFieldDefinitionsFromContext,
  normalizeItemSizeDetails,
  type EditableSizeDetailValue,
  type EditableCustomSizeField,
} from "@/lib/items/size-details";
import { resolvePurchaseCandidateItemClassification } from "@/lib/items/classification";
import {
  PURCHASE_CANDIDATE_PRIORITY_LABELS,
  PURCHASE_CANDIDATE_SIZE_GENDER_LABELS,
  PURCHASE_CANDIDATE_STATUS_LABELS,
} from "@/lib/purchase-candidates/labels";
import {
  formatPurchaseCandidateDateTime,
  hasPurchaseCandidateDateTimeValue,
  normalizePurchaseCandidateDateTimeValue,
} from "@/lib/purchase-candidates/date-time";
import {
  clearPurchaseCandidateDuplicatePayload,
  ensurePurchaseCandidateDuplicateName,
  loadPurchaseCandidateDuplicatePayload,
} from "@/lib/purchase-candidates/duplicate";
import type { CategoryGroupRecord } from "@/types/categories";
import type {
  PurchaseCandidateDetailResponse,
  PurchaseCandidateDuplicateImageRecord,
  PurchaseCandidateImageRecord,
  PurchaseCandidatePriority,
  PurchaseCandidateRecord,
  PurchaseCandidateStatus,
  PurchaseCandidateUpsertPayload,
} from "@/types/purchase-candidates";
import type {
  ItemSizeDetailValue,
  ItemSheerness,
  ItemSpec,
  StructuredSizeFieldName,
} from "@/types/items";

type PurchaseCandidateFormProps = {
  mode: "create" | "edit";
  candidateId?: string;
  cancelHref?: string;
  initialCategoryId?: string;
  initialCategoryGroupId?: string;
  footerAction?: ReactNode;
};

type SizeCandidateTabKey = "primary" | "alternate";
type DraftSourceKind = "duplicate" | "color-variant";

const PURCHASE_CANDIDATE_SAVE_ERROR_MESSAGE =
  "保存に失敗しました。時間をおいて再度お試しください。";
const PURCHASE_CANDIDATE_IMAGE_ADD_ERROR_MESSAGE =
  "画像の追加に失敗しました。時間をおいて再度お試しください。";
const PURCHASE_CANDIDATE_IMAGE_DELETE_ERROR_MESSAGE =
  "画像の削除に失敗しました。時間をおいて再度お試しください。";
const PURCHASE_CANDIDATE_VALIDATION_SUMMARY_MESSAGE =
  "入力内容を確認してください。";

class UserFacingFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingFormError";
  }
}

type PurchaseCandidateCategoryOption = {
  value: string;
  label: string;
  groupId: string;
  groupLabel: string;
};

type PurchaseCandidateCategoryGroupOption = {
  value: string;
  label: string;
};

type PurchaseCandidateSpecFormState = {
  topsSleeve: TopsSleeveValue | "";
  topsLength: TopsLengthValue | "";
  topsNeck: TopsNeckValue | "";
  topsDesign: TopsDesignValue | "";
  topsFit: TopsFitValue;
  bottomsLengthType: BottomsLengthType | "";
  bottomsRiseType: BottomsRiseType | "";
  skirtLengthType: SkirtLengthType | "";
  skirtMaterialType: SkirtMaterialType | "";
  skirtDesignType: SkirtDesignType | "";
  legwearCoverageType: LegwearCoverageType | "";
};

function resolvePurchaseCandidateSpecFormState(
  categoryId: string,
  shapeOverride?: string | null,
  spec?: ItemSpec | null,
): PurchaseCandidateSpecFormState {
  const resolvedCategory = resolvePurchaseCandidateItemClassification(
    categoryId,
    shapeOverride,
  );

  return {
    topsSleeve: (spec?.tops?.sleeve as TopsSleeveValue | undefined) ?? "",
    topsLength: (spec?.tops?.length as TopsLengthValue | undefined) ?? "",
    topsNeck: (spec?.tops?.neck as TopsNeckValue | undefined) ?? "",
    topsDesign: (spec?.tops?.design as TopsDesignValue | undefined) ?? "",
    topsFit: (spec?.tops?.fit as TopsFitValue | undefined) ?? DEFAULT_TOPS_FIT,
    bottomsLengthType:
      (resolveBottomsLengthType(
        spec?.bottoms?.length_type ?? null,
      ) as BottomsLengthType | null) ?? "",
    bottomsRiseType:
      (spec?.bottoms?.rise_type as BottomsRiseType | undefined) ?? "",
    skirtLengthType:
      (resolveSkirtLengthType(
        spec?.skirt?.length_type ?? null,
      ) as SkirtLengthType | null) ?? "",
    skirtMaterialType:
      (resolveSkirtMaterialType(
        spec?.skirt?.material_type ?? null,
      ) as SkirtMaterialType | null) ?? "",
    skirtDesignType:
      (resolveSkirtDesignType(
        spec?.skirt?.design_type ?? null,
      ) as SkirtDesignType | null) ?? "",
    legwearCoverageType:
      (resolveLegwearCoverageType(
        resolvedCategory?.category ?? null,
        resolvedCategory?.shape ?? null,
        spec?.legwear?.coverage_type ?? null,
        resolvedCategory?.subcategory ?? null,
      ) as LegwearCoverageType | null) ?? "",
  };
}

function resolveInitialPurchaseCandidateShape(
  categoryId: string,
  savedShape?: string | null,
) {
  const normalizedSavedShape =
    typeof savedShape === "string" ? savedShape.trim() : "";
  if (normalizedSavedShape !== "") {
    return normalizedSavedShape;
  }

  const resolved = resolvePurchaseCandidateItemClassification(
    categoryId,
    savedShape,
  );

  if (!resolved?.shouldShowShapeField) {
    return normalizedSavedShape;
  }

  return resolved.defaultShape || normalizedSavedShape;
}

function buildCategoryOptions(
  groups: CategoryGroupRecord[],
  visibleCategoryIds?: string[],
  forcedCategoryIds: string[] = [],
  forcedCategoryGroupIds: string[] = [],
): PurchaseCandidateCategoryOption[] {
  const visibleSet = visibleCategoryIds ? new Set(visibleCategoryIds) : null;
  const forcedSet = new Set(
    forcedCategoryIds
      .map((categoryId) => categoryId.trim())
      .filter((categoryId) => categoryId !== ""),
  );
  const forcedGroupSet = new Set(
    forcedCategoryGroupIds
      .map((groupId) => groupId.trim())
      .filter((groupId) => groupId !== ""),
  );

  return groups.flatMap((group) =>
    group.categories
      .filter((category) => {
        if (!visibleSet) {
          return true;
        }

        return (
          visibleSet.has(category.id) ||
          forcedSet.has(category.id) ||
          forcedGroupSet.has(category.groupId)
        );
      })
      .map((category) => ({
        value: category.id,
        label: category.name,
        groupId: group.id,
        groupLabel: group.name,
      })),
  );
}

function buildCategoryGroupOptions(
  options: PurchaseCandidateCategoryOption[],
): PurchaseCandidateCategoryGroupOption[] {
  const seen = new Set<string>();

  return options.flatMap((option) => {
    if (seen.has(option.groupId)) {
      return [];
    }

    seen.add(option.groupId);
    return [
      {
        value: option.groupId,
        label: option.groupLabel,
      },
    ];
  });
}

function resolveCategoryGroupId(
  categoryId: string,
  options: PurchaseCandidateCategoryOption[],
): string {
  return options.find((option) => option.value === categoryId)?.groupId ?? "";
}

function normalizeNullableString(value: string): string {
  return value.trim();
}

function hasEditableSizeDetailValueInput(
  field?: EditableSizeDetailValue | null,
): boolean {
  return Boolean(
    field?.value?.trim() ||
    field?.min?.trim() ||
    field?.max?.trim() ||
    field?.note?.trim(),
  );
}

function hasPurchaseCandidateSizeDetailsInput(
  structuredSizeValues: Partial<
    Record<StructuredSizeFieldName, EditableSizeDetailValue>
  >,
  customSizeFields: EditableCustomSizeField[],
): boolean {
  const hasStructuredValues = Object.values(structuredSizeValues).some(
    hasEditableSizeDetailValueInput,
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
}

function hasPurchaseCandidateSizeCandidateInput(params: {
  label: string;
  note: string;
  structuredSizeValues: Partial<
    Record<StructuredSizeFieldName, EditableSizeDetailValue>
  >;
  customSizeFields: EditableCustomSizeField[];
}): boolean {
  return (
    normalizeNullableString(params.label) !== "" ||
    params.note.trim() !== "" ||
    hasPurchaseCandidateSizeDetailsInput(
      params.structuredSizeValues,
      params.customSizeFields,
    )
  );
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

function getDateInputValue(value: string): string {
  return value.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}$/)?.[1] ?? "";
}

function getTimeInputValue(value: string): string {
  return value.match(/^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})$/)?.[1] ?? "";
}

export function resolveDateTimeFromDateInput(
  dateValue: string,
  currentValue: string,
): string {
  if (dateValue === "") {
    return "";
  }

  return `${dateValue}T${getTimeInputValue(currentValue) || "00:00"}`;
}

export function resolveDateTimeFromTimeInput(
  timeValue: string,
  currentValue: string,
): string {
  const dateValue = getDateInputValue(currentValue);
  if (dateValue === "") {
    return currentValue;
  }

  return `${dateValue}T${timeValue || "00:00"}`;
}

export const resolveSaleEndsAtFromDateInput = resolveDateTimeFromDateInput;
export const resolveSaleEndsAtFromTimeInput = resolveDateTimeFromTimeInput;

function createEditableCustomSizeFieldId(index: number): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) {
    return `custom-${randomUuid}`;
  }

  return `custom-${Date.now()}-${index}`;
}

function normalizeDraftDuplicateImages(
  images: PurchaseCandidateDuplicateImageRecord[],
): PurchaseCandidateDuplicateImageRecord[] {
  const sortedImages = [...images].sort((left, right) => {
    if (left.sort_order !== right.sort_order) {
      return left.sort_order - right.sort_order;
    }

    return left.source_image_id - right.source_image_id;
  });

  const hasPrimary = sortedImages.some((image) => image.is_primary);

  return sortedImages.map((image, index) => ({
    ...image,
    sort_order: index + 1,
    is_primary: hasPrimary ? image.is_primary : index === 0,
  }));
}

function ReviewHintIcon() {
  return (
    <Info
      className="h-4 w-4 text-amber-600"
      aria-label="元データから引き継いだため確認してください"
    />
  );
}

export default function PurchaseCandidateForm({
  mode,
  candidateId,
  cancelHref = "/purchase-candidates",
  initialCategoryId,
  initialCategoryGroupId,
  footerAction,
}: PurchaseCandidateFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const requestedDraftSourceKind: DraftSourceKind | null =
    source === "duplicate" || source === "color-variant" ? source : null;
  const hasAppliedDuplicateDraftRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState<PurchaseCandidateStatus>("considering");
  const [priority, setPriority] = useState<PurchaseCandidatePriority>("medium");
  const [name, setName] = useState("");
  const [categoryGroupId, setCategoryGroupId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shape, setShape] = useState("");
  const [variantSourceCandidateId, setVariantSourceCandidateId] = useState<
    number | null
  >(null);
  const [brandName, setBrandName] = useState("");
  const [saveBrandAsCandidate, setSaveBrandAsCandidate] = useState(false);
  const [price, setPrice] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleEndsAt, setSaleEndsAt] = useState("");
  const [discountEndsAt, setDiscountEndsAt] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [wantedReason, setWantedReason] = useState("");
  const [memo, setMemo] = useState("");
  const [sizeGender, setSizeGender] = useState<"women" | "men" | "unisex" | "">(
    "",
  );
  const [sizeLabel, setSizeLabel] = useState("");
  const [sizeNote, setSizeNote] = useState("");
  const [structuredSizeValues, setStructuredSizeValues] = useState<
    Partial<Record<StructuredSizeFieldName, EditableSizeDetailValue>>
  >({});
  const [customSizeFields, setCustomSizeFields] = useState<
    EditableCustomSizeField[]
  >([]);
  const [alternateSizeLabel, setAlternateSizeLabel] = useState("");
  const [alternateSizeNote, setAlternateSizeNote] = useState("");
  const [alternateStructuredSizeValues, setAlternateStructuredSizeValues] =
    useState<Partial<Record<StructuredSizeFieldName, EditableSizeDetailValue>>>(
      {},
    );
  const [alternateCustomSizeFields, setAlternateCustomSizeFields] = useState<
    EditableCustomSizeField[]
  >([]);
  const [activeSizeCandidateTab, setActiveSizeCandidateTab] =
    useState<SizeCandidateTabKey>("primary");
  const [topsSleeve, setTopsSleeve] = useState<TopsSleeveValue | "">("");
  const [topsLength, setTopsLength] = useState<TopsLengthValue | "">("");
  const [topsNeck, setTopsNeck] = useState<TopsNeckValue | "">("");
  const [topsDesign, setTopsDesign] = useState<TopsDesignValue | "">("");
  const [topsFit, setTopsFit] = useState<TopsFitValue>(DEFAULT_TOPS_FIT);
  const [bottomsLengthType, setBottomsLengthType] = useState<
    BottomsLengthType | ""
  >("");
  const [bottomsRiseType, setBottomsRiseType] = useState<BottomsRiseType | "">(
    "",
  );
  const [skirtLengthType, setSkirtLengthType] = useState<SkirtLengthType | "">(
    "",
  );
  const [skirtMaterialType, setSkirtMaterialType] = useState<
    SkirtMaterialType | ""
  >("");
  const [skirtDesignType, setSkirtDesignType] = useState<SkirtDesignType | "">(
    "",
  );
  const [legwearCoverageType, setLegwearCoverageType] = useState<
    LegwearCoverageType | ""
  >("");
  const [isRainOk, setIsRainOk] = useState(false);
  const [sheerness, setSheerness] = useState<ItemSheerness | "">("");
  const [materialRows, setMaterialRows] = useState<EditableItemMaterial[]>(() =>
    buildEditableItemMaterials(),
  );

  const [mainColor, setMainColor] = useState<ItemColorValue | "">("");
  const [mainColorCustomLabel, setMainColorCustomLabel] = useState("");
  const [subColor, setSubColor] = useState<ItemColorValue | "">("");
  const [useCustomMainColor, setUseCustomMainColor] = useState(false);
  const [useCustomSubColor, setUseCustomSubColor] = useState(false);
  const [customMainHex, setCustomMainHex] = useState("#3B82F6");
  const [customSubHex, setCustomSubHex] = useState("#3B82F6");
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedTpos, setSelectedTpos] = useState<string[]>([]);

  const [categoryOptions, setCategoryOptions] = useState<
    PurchaseCandidateCategoryOption[]
  >([]);
  const [existingImages, setExistingImages] = useState<
    PurchaseCandidateImageRecord[]
  >([]);
  const [duplicateImages, setDuplicateImages] = useState<
    PurchaseCandidateDuplicateImageRecord[]
  >([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );
  const [initializationSuccess, setInitializationSuccess] = useState<
    string | null
  >(null);
  const [draftSourceKind, setDraftSourceKind] =
    useState<DraftSourceKind | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isPurchasedLocked = mode === "edit" && status === "purchased";
  const isDuplicateDraftSource = mode === "create" && draftSourceKind !== null;
  const isColorVariantDraftSource =
    mode === "create" && draftSourceKind === "color-variant";
  const hasInheritedPrice = isDuplicateDraftSource && price.trim() !== "";
  const hasInheritedSalePrice =
    isDuplicateDraftSource && salePrice.trim() !== "";
  const hasInheritedReleaseDate =
    isDuplicateDraftSource && releaseDate.trim() !== "";
  const hasInheritedSaleEndsAt =
    isDuplicateDraftSource && saleEndsAt.trim() !== "";
  const hasInheritedDiscountEndsAt =
    isDuplicateDraftSource && discountEndsAt.trim() !== "";
  const hasInheritedMemo = isDuplicateDraftSource && memo.trim() !== "";

  const selectedMainColor = useMemo(() => {
    if (useCustomMainColor) {
      return {
        label: "カスタムカラー",
        hex: customMainHex,
      };
    }

    return ITEM_COLORS.find((color) => color.value === mainColor) ?? null;
  }, [customMainHex, mainColor, useCustomMainColor]);

  const selectedSubColor = useMemo(() => {
    if (useCustomSubColor) {
      return {
        label: "カスタムカラー",
        hex: customSubHex,
      };
    }

    return ITEM_COLORS.find((color) => color.value === subColor) ?? null;
  }, [customSubHex, subColor, useCustomSubColor]);

  const categoryGroupOptions = useMemo(
    () => buildCategoryGroupOptions(categoryOptions),
    [categoryOptions],
  );
  const filteredCategoryOptions = useMemo(
    () =>
      categoryOptions.filter((option) => option.groupId === categoryGroupId),
    [categoryGroupId, categoryOptions],
  );
  const resolvedItemCategory = useMemo(
    () => resolvePurchaseCandidateItemClassification(categoryId, shape),
    [categoryId, shape],
  );
  const availableShapeOptions = useMemo(
    () =>
      resolvedItemCategory?.shapeCandidates.map((value) => ({
        value,
        label:
          findItemShapeLabel(resolvedItemCategory.category, value) || value,
      })) ?? [],
    [resolvedItemCategory],
  );
  const resolvedTopsShape = useMemo(() => {
    return resolvedItemCategory?.category === "tops"
      ? (resolvedItemCategory.shape ?? "")
      : "";
  }, [resolvedItemCategory]);
  const topsRule = useMemo(
    () =>
      resolvedItemCategory?.category === "tops" &&
      resolvedItemCategory?.subcategory !== "other" &&
      resolvedTopsShape &&
      resolvedTopsShape in TOPS_RULES
        ? TOPS_RULES[resolvedTopsShape as keyof typeof TOPS_RULES]
        : null,
    [resolvedItemCategory, resolvedTopsShape],
  );
  const availableTopsSleeves = useMemo(
    () =>
      TOPS_SLEEVES.filter(
        (item) => topsRule?.sleeves.includes(item.value) ?? false,
      ),
    [topsRule],
  );
  const availableTopsLengths = useMemo(
    () =>
      TOPS_LENGTHS.filter(
        (item) => topsRule?.lengths.includes(item.value) ?? false,
      ),
    [topsRule],
  );
  const availableTopsNecks = useMemo(
    () =>
      TOPS_NECKS.filter(
        (item) => topsRule?.necks.includes(item.value) ?? false,
      ),
    [topsRule],
  );
  const availableTopsDesigns = useMemo(
    () =>
      TOPS_DESIGNS.filter(
        (item) => topsRule?.designs.includes(item.value) ?? false,
      ),
    [topsRule],
  );
  const availableTopsFits = useMemo(
    () =>
      TOPS_FITS.filter((item) => topsRule?.fits.includes(item.value) ?? false),
    [topsRule],
  );
  const isTopsSpecVisible = resolvedItemCategory?.category === "tops";
  const shouldShowTopsSleeveField =
    isTopsSpecVisible &&
    resolvedTopsShape !== "" &&
    availableTopsSleeves.length > 1;
  const shouldShowTopsLengthField =
    isTopsSpecVisible &&
    resolvedTopsShape !== "" &&
    availableTopsLengths.length > 1;
  const shouldShowTopsNeckField =
    isTopsSpecVisible &&
    resolvedTopsShape !== "" &&
    availableTopsNecks.length > 1;
  const shouldShowTopsDesignField =
    isTopsSpecVisible &&
    resolvedTopsShape !== "" &&
    availableTopsDesigns.length > 1;
  const shouldShowTopsFitField =
    isTopsSpecVisible &&
    resolvedTopsShape !== "" &&
    resolvedTopsShape !== "tanktop" &&
    availableTopsFits.length > 1;
  // Purchase candidate では spec を未入力許容のまま扱い、表示する項目だけを
  // item 側の分類モデルとそろえる。
  const isBottomsSpecVisible = resolvedItemCategory?.category === "pants";
  const isSkirtSpecVisible = resolvedItemCategory?.category === "skirts";
  const isLegwearSpecVisible = resolvedItemCategory?.category === "legwear";
  const legwearCoverageOptions = useMemo(
    () =>
      getLegwearCoverageOptions(
        resolvedItemCategory?.shape ?? null,
        resolvedItemCategory?.subcategory ?? null,
      ),
    [resolvedItemCategory],
  );
  const legwearCoverageLabel = useMemo(
    () =>
      getLegwearCoverageFieldLabel(
        resolvedItemCategory?.shape ?? null,
        resolvedItemCategory?.subcategory ?? null,
      ),
    [resolvedItemCategory],
  );
  const legwearCoveragePlaceholder = useMemo(
    () =>
      getLegwearCoveragePlaceholder(
        resolvedItemCategory?.shape ?? null,
        resolvedItemCategory?.subcategory ?? null,
      ),
    [resolvedItemCategory],
  );
  const resolvedSizeDetailsShape = useMemo(
    () => resolvedItemCategory?.shape ?? null,
    [resolvedItemCategory],
  );
  const structuredSizeFieldDefinitions = useMemo(
    () =>
      getStructuredSizeFieldDefinitionsFromContext({
        category: resolvedItemCategory?.category,
        shape: resolvedSizeDetailsShape,
      }),
    [resolvedItemCategory?.category, resolvedSizeDetailsShape],
  );
  const sizeDetailDuplicateWarnings = useMemo(
    () =>
      buildSizeDetailDuplicateWarnings(
        structuredSizeFieldDefinitions,
        customSizeFields.map((field) => field.label),
      ),
    [customSizeFields, structuredSizeFieldDefinitions],
  );
  const alternateSizeDetailDuplicateWarnings = useMemo(
    () =>
      buildSizeDetailDuplicateWarnings(
        structuredSizeFieldDefinitions,
        alternateCustomSizeFields.map((field) => field.label),
      ),
    [alternateCustomSizeFields, structuredSizeFieldDefinitions],
  );
  const primarySizeCandidateHasInput = useMemo(
    () =>
      hasPurchaseCandidateSizeCandidateInput({
        label: sizeLabel,
        note: sizeNote,
        structuredSizeValues,
        customSizeFields,
      }),
    [customSizeFields, sizeLabel, sizeNote, structuredSizeValues],
  );
  const alternateSizeCandidateHasInput = useMemo(
    () =>
      hasPurchaseCandidateSizeCandidateInput({
        label: alternateSizeLabel,
        note: alternateSizeNote,
        structuredSizeValues: alternateStructuredSizeValues,
        customSizeFields: alternateCustomSizeFields,
      }),
    [
      alternateCustomSizeFields,
      alternateSizeLabel,
      alternateSizeNote,
      alternateStructuredSizeValues,
    ],
  );
  const canSwapSizeCandidates = useMemo(
    () => primarySizeCandidateHasInput && alternateSizeCandidateHasInput,
    [alternateSizeCandidateHasInput, primarySizeCandidateHasInput],
  );
  const sizeCandidateTabs = useMemo(
    () => [
      {
        key: "primary" as const,
        title: "サイズ候補1",
        label: normalizeNullableString(sizeLabel),
        hasInput: primarySizeCandidateHasInput,
      },
      {
        key: "alternate" as const,
        title: "サイズ候補2",
        label: normalizeNullableString(alternateSizeLabel),
        hasInput: alternateSizeCandidateHasInput,
      },
    ],
    [
      alternateSizeCandidateHasInput,
      alternateSizeLabel,
      primarySizeCandidateHasInput,
      sizeLabel,
    ],
  );
  const activeSizeCandidate =
    activeSizeCandidateTab === "primary"
      ? {
          key: "primary" as const,
          title: "サイズ候補1",
          labelInputId: "size_label",
          noteInputId: "size_note",
          label: sizeLabel,
          note: sizeNote,
          structuredSizeValues,
          customSizeFields,
          hasDuplicateWarnings:
            sizeDetailDuplicateWarnings.hasStructuredDuplicates ||
            sizeDetailDuplicateWarnings.hasCustomDuplicates,
          setLabel: setSizeLabel,
          setNote: setSizeNote,
          onAddCustomSizeField: addCustomSizeField,
          onUpdateStructuredSizeValue: updateStructuredSizeValue,
          onUpdateCustomSizeField: updateCustomSizeField,
          onRemoveCustomSizeField: removeCustomSizeField,
        }
      : {
          key: "alternate" as const,
          title: "サイズ候補2",
          labelInputId: "alternate_size_label",
          noteInputId: "alternate_size_note",
          label: alternateSizeLabel,
          note: alternateSizeNote,
          structuredSizeValues: alternateStructuredSizeValues,
          customSizeFields: alternateCustomSizeFields,
          hasDuplicateWarnings:
            alternateSizeDetailDuplicateWarnings.hasStructuredDuplicates ||
            alternateSizeDetailDuplicateWarnings.hasCustomDuplicates,
          setLabel: setAlternateSizeLabel,
          setNote: setAlternateSizeNote,
          onAddCustomSizeField: addAlternateCustomSizeField,
          onUpdateStructuredSizeValue: updateAlternateStructuredSizeValue,
          onUpdateCustomSizeField: updateAlternateCustomSizeField,
          onRemoveCustomSizeField: removeAlternateCustomSizeField,
        };
  const materialValidation = useMemo(
    () => validateItemMaterials(materialRows),
    [materialRows],
  );
  const imageHelperText = [
    "一覧では代表画像を表示し、",
    "詳細や編集では画像全体を見やすく表示します。",
  ].join("");
  const displayedImages = useMemo(
    () =>
      mode === "create" && duplicateImages.length > 0
        ? duplicateImages
        : existingImages,
    [duplicateImages, existingImages, mode],
  );
  const hasInheritedImages =
    isDuplicateDraftSource && displayedImages.length > 0;
  const submitMessage = submitError ?? submitSuccess;

  function resetSpecFormState() {
    setTopsSleeve("");
    setTopsLength("");
    setTopsNeck("");
    setTopsDesign("");
    setTopsFit(DEFAULT_TOPS_FIT);
    setBottomsLengthType("");
    setBottomsRiseType("");
    setSkirtLengthType("");
    setSkirtMaterialType("");
    setSkirtDesignType("");
    setLegwearCoverageType("");
  }

  function applySpecFormState(
    categoryIdValue: string,
    shapeValue?: string | null,
    spec?: ItemSpec | null,
  ) {
    const nextState = resolvePurchaseCandidateSpecFormState(
      categoryIdValue,
      shapeValue,
      spec,
    );
    setTopsSleeve(nextState.topsSleeve);
    setTopsLength(nextState.topsLength);
    setTopsNeck(nextState.topsNeck);
    setTopsDesign(nextState.topsDesign);
    setTopsFit(nextState.topsFit);
    setBottomsLengthType(nextState.bottomsLengthType);
    setBottomsRiseType(nextState.bottomsRiseType);
    setSkirtLengthType(nextState.skirtLengthType);
    setSkirtMaterialType(nextState.skirtMaterialType);
    setSkirtDesignType(nextState.skirtDesignType);
    setLegwearCoverageType(nextState.legwearCoverageType);
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setLoadError(null);

      try {
        const groups = await fetchCategoryGroups();
        let visibleCategoryIds: string[] | undefined;

        try {
          const settings = await fetchCategoryVisibilitySettings();
          visibleCategoryIds = settings.visibleCategoryIds;
        } catch {
          visibleCategoryIds = undefined;
        }

        const nextCategoryOptions = buildCategoryOptions(
          groups,
          visibleCategoryIds,
          mode === "create" && initialCategoryId ? [initialCategoryId] : [],
          mode === "create" && initialCategoryGroupId
            ? [initialCategoryGroupId]
            : [],
        );

        setCategoryOptions(nextCategoryOptions);

        const resolveInitialCategoryGroupId = () => {
          const normalizedInitialCategoryGroupId =
            initialCategoryGroupId?.trim();
          if (normalizedInitialCategoryGroupId) {
            return normalizedInitialCategoryGroupId;
          }

          const normalizedInitialCategoryId = initialCategoryId?.trim();
          if (
            normalizedInitialCategoryId &&
            nextCategoryOptions.some(
              (option) => option.groupId === normalizedInitialCategoryId,
            )
          ) {
            return normalizedInitialCategoryId;
          }

          return "";
        };

        const applyInitialCategory = (nextCategoryId: string) => {
          setCategoryGroupId(
            resolveCategoryGroupId(nextCategoryId, nextCategoryOptions),
          );
          setCategoryId(nextCategoryId);
          setShape(resolveInitialPurchaseCandidateShape(nextCategoryId, null));
          resetSpecFormState();
          applySpecFormState(nextCategoryId, null, null);
        };

        if (mode === "edit" && candidateId) {
          const response = await fetch(
            `/api/purchase-candidates/${candidateId}`,
            {
              headers: { Accept: "application/json" },
            },
          );

          if (response.status === 401) {
            router.push("/login");
            return;
          }

          if (!response.ok) {
            router.push("/purchase-candidates");
            return;
          }

          const data =
            (await response.json()) as PurchaseCandidateDetailResponse;
          const candidate = data.purchaseCandidate;

          setStatus(candidate.status);
          setPriority(candidate.priority);
          setName(candidate.name);
          setCategoryGroupId(
            resolveCategoryGroupId(candidate.category_id, nextCategoryOptions),
          );
          setCategoryId(candidate.category_id);
          setShape(
            resolveInitialPurchaseCandidateShape(
              candidate.category_id,
              candidate.shape,
            ),
          );
          setVariantSourceCandidateId(null);
          setBrandName(candidate.brand_name ?? "");
          setSaveBrandAsCandidate(false);
          setPrice(candidate.price === null ? "" : String(candidate.price));
          setReleaseDate(candidate.release_date ?? "");
          setSalePrice(
            candidate.sale_price === null ? "" : String(candidate.sale_price),
          );
          setSaleEndsAt(
            normalizePurchaseCandidateDateTimeValue(candidate.sale_ends_at),
          );
          setDiscountEndsAt(
            normalizePurchaseCandidateDateTimeValue(candidate.discount_ends_at),
          );
          setPurchaseUrl(candidate.purchase_url ?? "");
          setWantedReason(candidate.wanted_reason ?? "");
          setMemo(candidate.memo ?? "");
          setSizeGender(candidate.size_gender ?? "");
          setSizeLabel(candidate.size_label ?? "");
          setSizeNote(candidate.size_note ?? "");
          setStructuredSizeValues(
            toEditableStructuredSizeValues(candidate.size_details),
          );
          setCustomSizeFields(
            toEditableCustomSizeFields(candidate.size_details, "existing"),
          );
          setAlternateSizeLabel(candidate.alternate_size_label ?? "");
          setAlternateSizeNote(candidate.alternate_size_note ?? "");
          setAlternateStructuredSizeValues(
            toEditableStructuredSizeValues(candidate.alternate_size_details),
          );
          setAlternateCustomSizeFields(
            toEditableCustomSizeFields(
              candidate.alternate_size_details,
              "existing-alternate",
            ),
          );
          setActiveSizeCandidateTab("primary");
          setIsRainOk(candidate.is_rain_ok);
          setSheerness(candidate.sheerness ?? "");
          const main = candidate.colors.find((color) => color.role === "main");
          const sub = candidate.colors.find((color) => color.role === "sub");
          setMainColorCustomLabel(main?.custom_label ?? "");

          if (main?.mode === "custom") {
            setUseCustomMainColor(true);
            setCustomMainHex(main.hex);
            setMainColor("");
          } else {
            setUseCustomMainColor(false);
            setMainColor((main?.value as ItemColorValue | undefined) ?? "");
          }

          if (sub?.mode === "custom") {
            setUseCustomSubColor(true);
            setCustomSubHex(sub.hex);
            setSubColor("");
          } else {
            setUseCustomSubColor(false);
            setSubColor((sub?.value as ItemColorValue | undefined) ?? "");
          }

          setSelectedSeasons(candidate.seasons);
          setSelectedTpos(candidate.tpos);
          setMaterialRows(buildEditableItemMaterials(candidate.materials));
          setExistingImages(
            [...candidate.images].sort(
              (left, right) => left.sort_order - right.sort_order,
            ),
          );
          setDuplicateImages([]);
          applySpecFormState(
            candidate.category_id,
            candidate.shape,
            candidate.spec,
          );
        } else if (mode === "create" && initialCategoryId) {
          const normalizedInitialCategoryId = initialCategoryId.trim();
          const hasMatchingCategory = nextCategoryOptions.some(
            (option) => option.value === normalizedInitialCategoryId,
          );

          if (hasMatchingCategory) {
            applyInitialCategory(normalizedInitialCategoryId);
          } else {
            const nextInitialCategoryGroupId = resolveInitialCategoryGroupId();
            if (nextInitialCategoryGroupId) {
              setCategoryGroupId(nextInitialCategoryGroupId);
              setCategoryId("");
              setShape("");
              resetSpecFormState();
            }
          }
        } else if (mode === "create") {
          const nextInitialCategoryGroupId = resolveInitialCategoryGroupId();
          if (nextInitialCategoryGroupId) {
            setCategoryGroupId(nextInitialCategoryGroupId);
          }
        }
      } catch {
        setLoadError("購入検討フォームの初期化に失敗しました。");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [candidateId, initialCategoryGroupId, initialCategoryId, mode, router]);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    if (!requestedDraftSourceKind) {
      return;
    }

    if (loading) {
      return;
    }

    if (hasAppliedDuplicateDraftRef.current) {
      return;
    }

    hasAppliedDuplicateDraftRef.current = true;

    const payload = loadPurchaseCandidateDuplicatePayload();
    clearPurchaseCandidateDuplicatePayload();
    router.replace("/purchase-candidates/new");
    setInitializationError(null);
    setInitializationSuccess(null);
    setDraftSourceKind(null);

    if (!payload) {
      setInitializationError(
        "複製の初期値を読み込めませんでした。通常の新規作成として続けてください。",
      );
      return;
    }

    const isColorVariantSource = requestedDraftSourceKind === "color-variant";
    const main = isColorVariantSource
      ? undefined
      : payload.colors.find((color) => color.role === "main");
    const sub = isColorVariantSource
      ? undefined
      : payload.colors.find((color) => color.role === "sub");
    setMainColorCustomLabel(main?.custom_label ?? "");
    if (isColorVariantSource) {
      setCustomMainHex("#3B82F6");
      setCustomSubHex("#3B82F6");
    }

    setStatus(payload.status);
    setPriority(payload.priority);
    setName(
      isColorVariantSource
        ? payload.name
        : ensurePurchaseCandidateDuplicateName(payload.name),
    );
    setCategoryGroupId(
      resolveCategoryGroupId(payload.category_id, categoryOptions),
    );
    setCategoryId(payload.category_id);
    setShape(
      resolveInitialPurchaseCandidateShape(payload.category_id, payload.shape),
    );
    setVariantSourceCandidateId(
      isColorVariantSource
        ? (payload.variant_source_candidate_id ?? null)
        : null,
    );
    setBrandName(payload.brand_name ?? "");
    setSaveBrandAsCandidate(false);
    setPrice(payload.price === null ? "" : String(payload.price));
    setReleaseDate(payload.release_date ?? "");
    setSalePrice(payload.sale_price === null ? "" : String(payload.sale_price));
    setSaleEndsAt(
      normalizePurchaseCandidateDateTimeValue(payload.sale_ends_at),
    );
    setDiscountEndsAt(
      normalizePurchaseCandidateDateTimeValue(payload.discount_ends_at),
    );
    setPurchaseUrl(payload.purchase_url ?? "");
    setWantedReason(payload.wanted_reason ?? "");
    setMemo(payload.memo ?? "");
    setSizeGender(payload.size_gender ?? "");
    setSizeLabel(payload.size_label ?? "");
    setSizeNote(payload.size_note ?? "");
    setStructuredSizeValues(
      toEditableStructuredSizeValues(payload.size_details),
    );
    setCustomSizeFields(
      toEditableCustomSizeFields(payload.size_details, "duplicate"),
    );
    setAlternateSizeLabel(payload.alternate_size_label ?? "");
    setAlternateSizeNote(payload.alternate_size_note ?? "");
    setAlternateStructuredSizeValues(
      toEditableStructuredSizeValues(payload.alternate_size_details),
    );
    setAlternateCustomSizeFields(
      toEditableCustomSizeFields(
        payload.alternate_size_details,
        "duplicate-alternate",
      ),
    );
    setActiveSizeCandidateTab("primary");
    setIsRainOk(payload.is_rain_ok);
    setSheerness(payload.sheerness ?? "");

    if (main?.mode === "custom") {
      setUseCustomMainColor(true);
      setCustomMainHex(main.hex);
      setMainColor("");
    } else {
      setUseCustomMainColor(false);
      setMainColor((main?.value as ItemColorValue | undefined) ?? "");
    }

    if (sub?.mode === "custom") {
      setUseCustomSubColor(true);
      setCustomSubHex(sub.hex);
      setSubColor("");
    } else {
      setUseCustomSubColor(false);
      setSubColor((sub?.value as ItemColorValue | undefined) ?? "");
    }

    setSelectedSeasons(payload.seasons);
    setSelectedTpos(payload.tpos);
    setMaterialRows(buildEditableItemMaterials(payload.materials));
    const normalizedDraftImages = normalizeDraftDuplicateImages(payload.images);
    setExistingImages([]);
    setDuplicateImages(normalizedDraftImages);
    setPendingImages([]);
    applySpecFormState(payload.category_id, payload.shape, payload.spec);
    setErrors({});
    setDraftSourceKind(requestedDraftSourceKind);
    setInitializationSuccess(
      isColorVariantSource
        ? "元の購入検討情報を引き継いでいます。黄色で示した項目は、必要に応じて見直してください。色違い追加では、新しい色を選択してください。"
        : "元の購入検討情報を引き継いでいます。黄色で示した項目は、必要に応じて見直してください。",
    );
  }, [categoryOptions, loading, mode, requestedDraftSourceKind, router]);

  useEffect(() => {
    if (!categoryId || categoryOptions.length === 0) {
      return;
    }

    const nextCategoryGroupId = resolveCategoryGroupId(
      categoryId,
      categoryOptions,
    );
    if (!nextCategoryGroupId || nextCategoryGroupId === categoryGroupId) {
      return;
    }

    setCategoryGroupId(nextCategoryGroupId);
  }, [categoryGroupId, categoryId, categoryOptions]);

  function toggleValue(
    value: string,
    current: string[],
    setter: (values: string[]) => void,
  ) {
    setter(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function toggleSeason(season: string) {
    setSelectedSeasons((prev) => {
      const isSelected = prev.includes(season);

      if (season === "オール") {
        return isSelected ? [] : ["オール"];
      }

      const withoutAll = prev.filter((item) => item !== "オール");
      return isSelected
        ? withoutAll.filter((item) => item !== season)
        : [...withoutAll, season];
    });
  }

  function toEditableStructuredSizeValues(sizeDetails: unknown) {
    const normalizedSizeDetails = normalizeItemSizeDetails(sizeDetails);

    return normalizedSizeDetails?.structured
      ? Object.fromEntries(
          Object.entries(normalizedSizeDetails.structured).map(
            ([fieldName, fieldValue]) => [
              fieldName,
              buildEditableSizeDetailValue(fieldValue),
            ],
          ),
        )
      : {};
  }

  function toEditableCustomSizeFields(sizeDetails: unknown, prefix: string) {
    const normalizedSizeDetails = normalizeItemSizeDetails(sizeDetails);

    return (
      normalizedSizeDetails?.custom_fields?.map((field, index) => ({
        id: `${prefix}-${index}`,
        label: field.label,
        ...buildEditableSizeDetailValue(field),
      })) ?? []
    );
  }

  function updateStructuredSizeValue(
    fieldName: StructuredSizeFieldName,
    key: keyof ItemSizeDetailValue,
    value: string,
  ) {
    setStructuredSizeValues((current) => ({
      ...current,
      [fieldName]: normalizeEditableSizeValue(current[fieldName], key, value),
    }));
  }

  function updateAlternateStructuredSizeValue(
    fieldName: StructuredSizeFieldName,
    key: keyof ItemSizeDetailValue,
    value: string,
  ) {
    setAlternateStructuredSizeValues((current) => ({
      ...current,
      [fieldName]: normalizeEditableSizeValue(current[fieldName], key, value),
    }));
  }

  function updateCustomSizeField(
    fieldId: string,
    field: "label" | keyof ItemSizeDetailValue,
    value: string,
  ) {
    setCustomSizeFields((current) =>
      current.map((item) =>
        item.id === fieldId
          ? field === "label"
            ? { ...item, label: value }
            : { ...item, ...normalizeEditableSizeValue(item, field, value) }
          : item,
      ),
    );
  }

  function updateAlternateCustomSizeField(
    fieldId: string,
    field: "label" | keyof ItemSizeDetailValue,
    value: string,
  ) {
    setAlternateCustomSizeFields((current) =>
      current.map((item) =>
        item.id === fieldId
          ? field === "label"
            ? { ...item, label: value }
            : { ...item, ...normalizeEditableSizeValue(item, field, value) }
          : item,
      ),
    );
  }

  function addCustomSizeField() {
    setCustomSizeFields((current) => [
      ...current,
      {
        id: createEditableCustomSizeFieldId(current.length),
        label: "",
        ...createEmptyEditableSizeDetailValue(),
      },
    ]);
  }

  function addAlternateCustomSizeField() {
    setAlternateCustomSizeFields((current) => [
      ...current,
      {
        id: createEditableCustomSizeFieldId(current.length),
        label: "",
        ...createEmptyEditableSizeDetailValue(),
      },
    ]);
  }

  function removeCustomSizeField(fieldId: string) {
    setCustomSizeFields((current) =>
      current.filter((field) => field.id !== fieldId),
    );
  }

  function removeAlternateCustomSizeField(fieldId: string) {
    setAlternateCustomSizeFields((current) =>
      current.filter((field) => field.id !== fieldId),
    );
  }

  function swapSizeCandidates() {
    const swapped = swapPurchaseCandidateSizeCandidates(
      {
        label: sizeLabel,
        note: sizeNote,
        details: {
          structured: structuredSizeValues,
          custom: customSizeFields,
        },
      },
      {
        label: alternateSizeLabel,
        note: alternateSizeNote,
        details: {
          structured: alternateStructuredSizeValues,
          custom: alternateCustomSizeFields,
        },
      },
    );

    setSizeLabel(swapped.primary.label);
    setSizeNote(swapped.primary.note);
    setStructuredSizeValues(swapped.primary.details.structured);
    setCustomSizeFields(swapped.primary.details.custom);

    setAlternateSizeLabel(swapped.alternate.label);
    setAlternateSizeNote(swapped.alternate.note);
    setAlternateStructuredSizeValues(swapped.alternate.details.structured);
    setAlternateCustomSizeFields(swapped.alternate.details.custom);
  }

  function updateMaterialRow(
    rowId: string,
    field: "part_label" | "material_name" | "ratio",
    value: string,
  ) {
    setMaterialRows((current) =>
      current.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row,
      ),
    );
  }

  function addMaterialRow() {
    setMaterialRows((current) => [...current, createEmptyItemMaterialRow()]);
  }

  function removeMaterialRow(rowId: string) {
    setMaterialRows((current) => {
      const nextRows = current.filter((row) => row.id !== rowId);
      return nextRows.length > 0 ? nextRows : [createEmptyItemMaterialRow()];
    });
  }

  function buildPayload(): PurchaseCandidateUpsertPayload {
    if (isPurchasedLocked) {
      return {
        priority,
        release_date: releaseDate || null,
        sale_price: salePrice === "" ? null : Number(salePrice),
        sale_ends_at: saleEndsAt === "" ? null : saleEndsAt,
        discount_ends_at: discountEndsAt === "" ? null : discountEndsAt,
        purchase_url: normalizeNullableString(purchaseUrl) || null,
        memo: memo.trim() || null,
        wanted_reason: wantedReason.trim() || null,
      } as PurchaseCandidateUpsertPayload;
    }

    const colors: PurchaseCandidateUpsertPayload["colors"] = [];

    if (selectedMainColor) {
      colors.push({
        role: "main" as const,
        mode: useCustomMainColor ? "custom" : "preset",
        value: useCustomMainColor ? customMainHex : mainColor,
        hex: selectedMainColor.hex,
        label: selectedMainColor.label,
        custom_label: normalizeNullableString(mainColorCustomLabel) || null,
      });
    }

    if (selectedSubColor) {
      colors.push({
        role: "sub" as const,
        mode: useCustomSubColor ? "custom" : "preset",
        value: useCustomSubColor ? customSubHex : subColor,
        hex: selectedSubColor.hex,
        label: selectedSubColor.label,
      });
    }

    return {
      status,
      priority,
      name: name.trim(),
      category_id: categoryId,
      shape: resolvedItemCategory?.shouldShowShapeField ? shape || null : null,
      variant_source_candidate_id:
        mode === "create" ? variantSourceCandidateId : undefined,
      spec: (() => {
        if (isTopsSpecVisible) {
          const nextSpec: NonNullable<ItemSpec["tops"]> = {};

          if (topsSleeve) {
            nextSpec.sleeve = topsSleeve;
          }

          if (topsLength) {
            nextSpec.length = topsLength;
          }

          if (topsNeck) {
            nextSpec.neck = topsNeck;
          }

          if (topsDesign) {
            nextSpec.design = topsDesign;
          }

          if (topsFit !== DEFAULT_TOPS_FIT) {
            nextSpec.fit = topsFit;
          }

          if (Object.keys(nextSpec).length === 0) {
            return null;
          }

          return { tops: nextSpec } satisfies ItemSpec;
        }

        if (isBottomsSpecVisible) {
          // Phase 1: purchase candidate spec remains nullable.
          if (!bottomsLengthType && !bottomsRiseType) {
            return null;
          }

          return {
            bottoms: {
              length_type: bottomsLengthType || null,
              rise_type: bottomsRiseType || null,
            },
          } satisfies ItemSpec;
        }

        if (isSkirtSpecVisible) {
          if (!skirtLengthType && !skirtMaterialType && !skirtDesignType) {
            return null;
          }

          return {
            skirt: {
              length_type: skirtLengthType || null,
              material_type: skirtMaterialType || null,
              design_type: skirtDesignType || null,
            },
          } satisfies ItemSpec;
        }

        if (isLegwearSpecVisible) {
          // Phase 1: purchase candidate spec remains nullable.
          if (!legwearCoverageType) {
            return null;
          }

          return {
            legwear: {
              coverage_type: legwearCoverageType,
            },
          } satisfies ItemSpec;
        }

        return null;
      })(),
      brand_name: normalizeNullableString(brandName) || null,
      save_brand_as_candidate: saveBrandAsCandidate,
      price: price === "" ? null : Number(price),
      release_date: releaseDate || null,
      sale_price: salePrice === "" ? null : Number(salePrice),
      sale_ends_at: saleEndsAt === "" ? null : saleEndsAt,
      discount_ends_at: discountEndsAt === "" ? null : discountEndsAt,
      purchase_url: normalizeNullableString(purchaseUrl) || null,
      memo: memo.trim() || null,
      wanted_reason: wantedReason.trim() || null,
      size_gender: sizeGender || null,
      size_label: normalizeNullableString(sizeLabel) || null,
      size_note: sizeNote.trim() || null,
      size_details: buildItemSizeDetailsPayload(
        structuredSizeFieldDefinitions,
        structuredSizeValues,
        customSizeFields,
      ),
      alternate_size_label: normalizeNullableString(alternateSizeLabel) || null,
      alternate_size_note: alternateSizeNote.trim() || null,
      alternate_size_details: buildItemSizeDetailsPayload(
        structuredSizeFieldDefinitions,
        alternateStructuredSizeValues,
        alternateCustomSizeFields,
      ),
      is_rain_ok: isRainOk,
      sheerness: sheerness || null,
      colors,
      seasons: selectedSeasons,
      tpos: selectedTpos,
      materials: materialValidation.payload,
      duplicate_images:
        mode === "create" && duplicateImages.length > 0
          ? duplicateImages.map((image) => ({
              source_image_id: image.source_image_id,
              sort_order: image.sort_order,
              is_primary: image.is_primary,
            }))
          : undefined,
    };
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!isPurchasedLocked && !name.trim()) {
      nextErrors.name = "名前を入力してください。";
    }

    if (!isPurchasedLocked && !categoryId) {
      nextErrors.category_id = "種類を選択してください。";
    }

    if (
      !isPurchasedLocked &&
      resolvedItemCategory?.shouldShowShapeField &&
      !shape
    ) {
      nextErrors.shape = "形を選択してください。";
    }

    if (!isPurchasedLocked && !selectedMainColor) {
      nextErrors.colors = "メインカラーを選択してください。";
    }

    if (
      !isPurchasedLocked &&
      normalizeNullableString(mainColorCustomLabel).length > 50
    ) {
      nextErrors.main_color_custom_label =
        "色名は50文字以内で入力してください。";
    }

    if (
      !isPurchasedLocked &&
      useCustomMainColor &&
      !isValidHexColor(customMainHex)
    ) {
      nextErrors.colors =
        "メインカラーのカラーコードを #RRGGBB 形式で入力してください。";
    }

    if (
      !isPurchasedLocked &&
      useCustomSubColor &&
      !isValidHexColor(customSubHex)
    ) {
      nextErrors.sub_color =
        "サブカラーのカラーコードを #RRGGBB 形式で入力してください。";
    }

    if (!isPurchasedLocked) {
      Object.assign(nextErrors, materialValidation.errors);
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function uploadPendingImages(targetCandidateId: number) {
    const baseImageCount =
      mode === "create" && duplicateImages.length > 0
        ? duplicateImages.length
        : existingImages.length;

    for (let index = 0; index < pendingImages.length; index += 1) {
      const image = pendingImages[index];
      const formData = new FormData();
      formData.set("image", image);
      formData.set("sort_order", String(baseImageCount + index + 1));
      if (baseImageCount === 0 && index === 0) {
        formData.set("is_primary", "1");
      }

      const uploadResponse = await fetch(
        `/api/purchase-candidates/${targetCandidateId}/images`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        const uploadData = await uploadResponse.json().catch(() => null);
        throw new UserFacingFormError(
          getUserFacingSubmitErrorMessage(
            uploadData,
            PURCHASE_CANDIDATE_IMAGE_ADD_ERROR_MESSAGE,
          ),
        );
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setInitializationError(null);
    setInitializationSuccess(null);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        mode === "edit" && candidateId
          ? `/api/purchase-candidates/${candidateId}`
          : "/api/purchase-candidates",
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildPayload()),
        },
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setSubmitError("セッションが切れました。再度ログインしてください。");
        window.setTimeout(() => router.push("/login"), 800);
        return;
      }

      if (!response.ok) {
        const flattenedErrors = flattenValidationErrors(data);
        if (Object.keys(flattenedErrors).length > 0) {
          setErrors(flattenedErrors);
          setSubmitError(PURCHASE_CANDIDATE_VALIDATION_SUMMARY_MESSAGE);
        } else {
          setSubmitError(
            getUserFacingSubmitErrorMessage(
              data,
              PURCHASE_CANDIDATE_SAVE_ERROR_MESSAGE,
            ),
          );
        }
        return;
      }

      const nextCandidate = data?.purchaseCandidate as
        | PurchaseCandidateRecord
        | undefined;

      if (nextCandidate && pendingImages.length > 0) {
        await uploadPendingImages(nextCandidate.id);
      }

      setSubmitSuccess(
        mode === "edit" ? "更新に成功しました。" : "登録に成功しました。",
      );
      window.setTimeout(() => {
        router.push(
          nextCandidate
            ? `/purchase-candidates/${nextCandidate.id}`
            : "/purchase-candidates",
        );
        router.refresh();
      }, 800);
    } catch (error) {
      setSubmitError(
        error instanceof UserFacingFormError
          ? error.message
          : PURCHASE_CANDIDATE_SAVE_ERROR_MESSAGE,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteImage(imageId: number) {
    const response = await fetch(
      `/api/purchase-candidates/${candidateId}/images/${imageId}`,
      { method: "DELETE" },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setSubmitError(
        getUserFacingSubmitErrorMessage(
          data,
          PURCHASE_CANDIDATE_IMAGE_DELETE_ERROR_MESSAGE,
        ),
      );
      return;
    }

    setExistingImages((current) =>
      current.filter((image) => image.id !== imageId),
    );
  }

  function handleDeleteDraftImage(imageId: number) {
    setDuplicateImages((current) =>
      normalizeDraftDuplicateImages(
        current.filter((image) => image.id !== imageId),
      ),
    );
  }

  function handleMoveDraftImage(imageId: number, direction: "up" | "down") {
    setDuplicateImages((current) => {
      const nextImages = [...current];
      const currentIndex = nextImages.findIndex(
        (image) => image.id === imageId,
      );

      if (currentIndex < 0) {
        return current;
      }

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= nextImages.length) {
        return current;
      }

      [nextImages[currentIndex], nextImages[targetIndex]] = [
        nextImages[targetIndex],
        nextImages[currentIndex],
      ];

      return normalizeDraftDuplicateImages(nextImages);
    });
  }

  function handleMakePrimaryDraftImage(imageId: number) {
    setDuplicateImages((current) =>
      normalizeDraftDuplicateImages(
        current.map((image) => ({
          ...image,
          is_primary: image.id === imageId,
        })),
      ),
    );
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-gray-600">フォームを読み込んでいます...</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
        <p className="text-sm text-red-700">{loadError}</p>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-5"
    >
      {initializationError ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 lg:col-span-2">
          {initializationError}
        </section>
      ) : null}
      {initializationSuccess ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 shadow-sm lg:col-span-2">
          <div className="flex items-start gap-3">
            <TriangleAlert
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <p>{initializationSuccess}</p>
          </div>
        </section>
      ) : null}

      <ItemFormSection title="基本情報" className="lg:col-span-1">
        {isPurchasedLocked && (
          <p className="text-sm text-amber-700">
            購入済みの購入検討では、メモ・欲しい理由・優先度・発売日・販売期間情報・購入
            URL・画像のみ更新できます。アイテムには反映されません。
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-[minmax(0,28rem)_auto] md:items-end">
          <div>
            <FieldLabel htmlFor="status" label="ステータス" />
            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as PurchaseCandidateStatus)
              }
              disabled={isPurchasedLocked}
              className={getFormControlClassName({
                disabled: isPurchasedLocked,
              })}
            >
              <option value="considering">
                {PURCHASE_CANDIDATE_STATUS_LABELS.considering}
              </option>
              <option value="on_hold">
                {PURCHASE_CANDIDATE_STATUS_LABELS.on_hold}
              </option>
              <option value="purchased">
                {PURCHASE_CANDIDATE_STATUS_LABELS.purchased}
              </option>
              <option value="dropped">
                {PURCHASE_CANDIDATE_STATUS_LABELS.dropped}
              </option>
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="priority" label="優先度" />
            <select
              id="priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as PurchaseCandidatePriority)
              }
              className={getFormControlClassName()}
            >
              <option value="high">
                {PURCHASE_CANDIDATE_PRIORITY_LABELS.high}
              </option>
              <option value="medium">
                {PURCHASE_CANDIDATE_PRIORITY_LABELS.medium}
              </option>
              <option value="low">
                {PURCHASE_CANDIDATE_PRIORITY_LABELS.low}
              </option>
            </select>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="name" label="名前" required />
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPurchasedLocked}
            className={getFormControlClassName({
              invalid: Boolean(errors.name),
              disabled: isPurchasedLocked,
            })}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <BrandNameField
            inputId="brand-name"
            value={brandName}
            onChange={setBrandName}
            saveAsCandidate={saveBrandAsCandidate}
            onSaveAsCandidateChange={setSaveBrandAsCandidate}
            disabled={isPurchasedLocked}
            error={errors.brand_name ?? null}
          />
        </div>
      </ItemFormSection>
      <ItemFormSection title="購入情報" className="lg:col-span-1">
        <div className="grid gap-4 md:grid-cols-2">
          <div
            className={
              hasInheritedPrice
                ? "rounded-xl border border-amber-200 bg-amber-50/60 p-3"
                : undefined
            }
          >
            <div className="mb-1 flex items-center gap-1.5">
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                想定価格
              </label>
              {hasInheritedPrice ? <ReviewHintIcon /> : null}
            </div>
            <div
              className={getFormControlWrapperClassName(
                false,
                hasInheritedPrice ? "border-amber-300 bg-amber-50" : undefined,
              )}
            >
              <input
                id="price"
                type="number"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                disabled={isPurchasedLocked}
                className={FORM_CONTROL_INNER_INPUT_CLASS}
              />
              <span className="text-sm text-gray-500">円</span>
            </div>
          </div>

          <div className="hidden md:block" aria-hidden="true" />

          <div
            className={
              hasInheritedSalePrice
                ? "rounded-xl border border-amber-200 bg-amber-50/60 p-3"
                : undefined
            }
          >
            <div className="mb-1 flex items-center gap-1.5">
              <label
                htmlFor="sale_price"
                className="block text-sm font-medium text-gray-700"
              >
                セール価格
              </label>
              {hasInheritedSalePrice ? <ReviewHintIcon /> : null}
            </div>
            <div
              className={getFormControlWrapperClassName(
                false,
                hasInheritedSalePrice
                  ? "border-amber-300 bg-amber-50"
                  : undefined,
              )}
            >
              <input
                id="sale_price"
                type="number"
                min="0"
                value={salePrice}
                onChange={(event) => setSalePrice(event.target.value)}
                className={FORM_CONTROL_INNER_INPUT_CLASS}
              />
              <span className="text-sm text-gray-500">円</span>
            </div>
          </div>

          <div
            className={
              hasInheritedDiscountEndsAt
                ? "rounded-xl border border-amber-200 bg-amber-50/60 p-3"
                : undefined
            }
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="block text-sm font-medium text-gray-700">
                  セール終了日
                </span>
                {hasInheritedDiscountEndsAt ? <ReviewHintIcon /> : null}
              </div>
              <button
                type="button"
                onClick={() => setDiscountEndsAt("")}
                disabled={discountEndsAt === ""}
                className="text-xs font-medium text-gray-500 underline-offset-2 transition hover:text-gray-800 hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
              >
                リセット
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <input
                id="discount_ends_at_date"
                aria-label="セール終了日の日付"
                type="date"
                value={getDateInputValue(discountEndsAt)}
                onChange={(event) =>
                  setDiscountEndsAt(
                    resolveDateTimeFromDateInput(
                      event.target.value,
                      discountEndsAt,
                    ),
                  )
                }
                style={{ colorScheme: "light", accentColor: "#2563eb" }}
                className={getFormControlClassName({
                  shadow: true,
                  className: [
                    FORM_CONTROL_COLOR_SCHEME_CLASS,
                    hasInheritedDiscountEndsAt
                      ? "border-amber-300 bg-amber-50"
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(" "),
                })}
              />
              <input
                id="discount_ends_at_time"
                aria-label="セール終了日の時刻"
                type="time"
                value={getTimeInputValue(discountEndsAt)}
                onChange={(event) =>
                  setDiscountEndsAt(
                    resolveDateTimeFromTimeInput(
                      event.target.value,
                      discountEndsAt,
                    ),
                  )
                }
                disabled={getDateInputValue(discountEndsAt) === ""}
                style={{ colorScheme: "light", accentColor: "#2563eb" }}
                className={getFormControlClassName({
                  disabled: true,
                  shadow: true,
                  className: [
                    FORM_CONTROL_COLOR_SCHEME_CLASS,
                    hasInheritedDiscountEndsAt
                      ? "border-amber-300 bg-amber-50"
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(" "),
                })}
              />
            </div>
            {hasPurchaseCandidateDateTimeValue(discountEndsAt) ? (
              <p className="mt-2 text-xs text-gray-500">
                設定中:{" "}
                {formatPurchaseCandidateDateTime(discountEndsAt, "preview")}
              </p>
            ) : null}
          </div>

          <div
            className={
              hasInheritedReleaseDate
                ? "rounded-xl border border-amber-200 bg-amber-50/60 p-3"
                : undefined
            }
          >
            <div className="mb-1 flex items-center gap-1.5">
              <label
                htmlFor="release_date"
                className="block text-sm font-medium text-gray-700"
              >
                発売日
              </label>
              {hasInheritedReleaseDate ? <ReviewHintIcon /> : null}
            </div>
            <input
              id="release_date"
              type="date"
              value={releaseDate}
              onChange={(event) => setReleaseDate(event.target.value)}
              style={{ colorScheme: "light", accentColor: "#2563eb" }}
              className={getFormControlClassName({
                shadow: true,
                className: [
                  FORM_CONTROL_COLOR_SCHEME_CLASS,
                  hasInheritedReleaseDate
                    ? "border-amber-300 bg-amber-50"
                    : undefined,
                ]
                  .filter(Boolean)
                  .join(" "),
              })}
            />
          </div>

          <div
            className={
              hasInheritedSaleEndsAt
                ? "rounded-xl border border-amber-200 bg-amber-50/60 p-3"
                : undefined
            }
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="block text-sm font-medium text-gray-700">
                  販売終了日
                </span>
                {hasInheritedSaleEndsAt ? <ReviewHintIcon /> : null}
              </div>
              <button
                type="button"
                onClick={() => setSaleEndsAt("")}
                disabled={saleEndsAt === ""}
                className="text-xs font-medium text-gray-500 underline-offset-2 transition hover:text-gray-800 hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
              >
                リセット
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <input
                id="sale_ends_at_date"
                aria-label="販売終了日の日付"
                type="date"
                value={getDateInputValue(saleEndsAt)}
                onChange={(event) =>
                  setSaleEndsAt(
                    resolveDateTimeFromDateInput(
                      event.target.value,
                      saleEndsAt,
                    ),
                  )
                }
                style={{ colorScheme: "light", accentColor: "#2563eb" }}
                className={getFormControlClassName({
                  shadow: true,
                  className: [
                    FORM_CONTROL_COLOR_SCHEME_CLASS,
                    hasInheritedSaleEndsAt
                      ? "border-amber-300 bg-amber-50"
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(" "),
                })}
              />
              <input
                id="sale_ends_at_time"
                aria-label="販売終了日の時刻"
                type="time"
                value={getTimeInputValue(saleEndsAt)}
                onChange={(event) =>
                  setSaleEndsAt(
                    resolveDateTimeFromTimeInput(
                      event.target.value,
                      saleEndsAt,
                    ),
                  )
                }
                disabled={getDateInputValue(saleEndsAt) === ""}
                style={{ colorScheme: "light", accentColor: "#2563eb" }}
                className={getFormControlClassName({
                  disabled: true,
                  shadow: true,
                  className: [
                    FORM_CONTROL_COLOR_SCHEME_CLASS,
                    hasInheritedSaleEndsAt
                      ? "border-amber-300 bg-amber-50"
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(" "),
                })}
              />
            </div>
            {hasPurchaseCandidateDateTimeValue(saleEndsAt) ? (
              <p className="mt-2 text-xs text-gray-500">
                設定中: {formatPurchaseCandidateDateTime(saleEndsAt, "preview")}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label
            htmlFor="purchase_url"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            購入 URL
          </label>
          <input
            id="purchase_url"
            type="url"
            value={purchaseUrl}
            onChange={(event) => setPurchaseUrl(event.target.value)}
            className={getFormControlClassName()}
          />
        </div>

        <div>
          <label
            htmlFor="wanted_reason"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            欲しい理由
          </label>
          <textarea
            id="wanted_reason"
            value={wantedReason}
            onChange={(event) => setWantedReason(event.target.value)}
            rows={3}
            className={getFormControlClassName()}
          />
        </div>
      </ItemFormSection>
      <ItemFormSection title="分類" className="lg:col-span-2">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="category_group_id" label="カテゴリ" required />
            <select
              id="category_group_id"
              value={categoryGroupId}
              onChange={(event) => {
                const nextGroupId = event.target.value;
                setCategoryGroupId(nextGroupId);
                setCategoryId("");
                setShape("");
                resetSpecFormState();
              }}
              disabled={isPurchasedLocked}
              className={getFormControlClassName({
                disabled: isPurchasedLocked,
              })}
            >
              <option value="">選択してください</option>
              {categoryGroupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {categoryGroupId ? (
            <div>
              <FieldLabel htmlFor="category_id" label="種類" required />
              <select
                id="category_id"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setShape("");
                  resetSpecFormState();
                }}
                disabled={isPurchasedLocked}
                aria-invalid={errors.category_id ? "true" : "false"}
                aria-describedby={
                  errors.category_id ? "category_id_error" : undefined
                }
                className={getFormControlClassName({
                  invalid: Boolean(errors.category_id),
                  disabled: isPurchasedLocked,
                })}
              >
                <option value="">選択してください</option>
                {filteredCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p id="category_id_error" className="mt-2 text-sm text-red-600">
                  {errors.category_id}
                </p>
              )}
            </div>
          ) : null}

          {resolvedItemCategory?.shouldShowShapeField ? (
            <div>
              <FieldLabel htmlFor="shape" label="形" required />
              <select
                id="shape"
                value={shape}
                onChange={(event) => setShape(event.target.value)}
                disabled={isPurchasedLocked}
                className={getFormControlClassName({
                  invalid: Boolean(errors.shape),
                  disabled: isPurchasedLocked,
                })}
              >
                <option value="">選択してください</option>
                {availableShapeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.shape && (
                <p className="mt-2 text-sm text-red-600">{errors.shape}</p>
              )}
            </div>
          ) : null}
        </div>

        {(isTopsSpecVisible ||
          isBottomsSpecVisible ||
          isSkirtSpecVisible ||
          (isLegwearSpecVisible && legwearCoverageOptions.length > 0)) && (
          <div className="space-y-4 rounded-xl border border-gray-200/80 bg-gray-50/70 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-900">仕様・属性</h3>
              <p className="text-xs text-gray-500">
                カテゴリと種類に応じた補助情報です。
              </p>
            </div>
            {isTopsSpecVisible && (
              <div className="grid gap-4 md:grid-cols-2">
                {shouldShowTopsSleeveField && (
                  <div>
                    <FieldLabel htmlFor="spec-tops-sleeve" label="袖" />
                    <select
                      id="spec-tops-sleeve"
                      value={topsSleeve}
                      onChange={(event) =>
                        setTopsSleeve(
                          event.target.value as TopsSleeveValue | "",
                        )
                      }
                      disabled={isPurchasedLocked}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">選択してください</option>
                      {availableTopsSleeves.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {shouldShowTopsLengthField && (
                  <div>
                    <FieldLabel htmlFor="spec-tops-length" label="丈" />
                    <select
                      id="spec-tops-length"
                      value={topsLength}
                      onChange={(event) =>
                        setTopsLength(
                          event.target.value as TopsLengthValue | "",
                        )
                      }
                      disabled={isPurchasedLocked}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">選択してください</option>
                      {availableTopsLengths.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {shouldShowTopsNeckField && (
                  <div>
                    <FieldLabel htmlFor="spec-tops-neck" label="首回り" />
                    <select
                      id="spec-tops-neck"
                      value={topsNeck}
                      onChange={(event) =>
                        setTopsNeck(event.target.value as TopsNeckValue | "")
                      }
                      disabled={isPurchasedLocked}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">選択してください</option>
                      {availableTopsNecks.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {shouldShowTopsDesignField && (
                  <div>
                    <FieldLabel htmlFor="spec-tops-design" label="デザイン" />
                    <select
                      id="spec-tops-design"
                      value={topsDesign}
                      onChange={(event) =>
                        setTopsDesign(
                          event.target.value as TopsDesignValue | "",
                        )
                      }
                      disabled={isPurchasedLocked}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">選択してください</option>
                      {availableTopsDesigns.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {shouldShowTopsFitField && (
                  <div>
                    <FieldLabel htmlFor="spec-tops-fit" label="シルエット" />
                    <select
                      id="spec-tops-fit"
                      value={topsFit}
                      onChange={(event) =>
                        setTopsFit(event.target.value as TopsFitValue)
                      }
                      disabled={isPurchasedLocked}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {availableTopsFits.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {isBottomsSpecVisible && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="spec-bottoms-length-type" label="丈" />
                  <select
                    id="spec-bottoms-length-type"
                    value={bottomsLengthType}
                    onChange={(event) =>
                      setBottomsLengthType(
                        event.target.value as BottomsLengthType | "",
                      )
                    }
                    disabled={isPurchasedLocked}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">選択してください</option>
                    {BOTTOMS_LENGTH_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="spec-bottoms-rise-type" label="股上" />
                  <select
                    id="spec-bottoms-rise-type"
                    value={bottomsRiseType}
                    onChange={(event) =>
                      setBottomsRiseType(
                        event.target.value as BottomsRiseType | "",
                      )
                    }
                    disabled={isPurchasedLocked}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">股上を選択してください</option>
                    {BOTTOMS_RISE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {isSkirtSpecVisible && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="spec-skirt-length-type" label="丈" />
                  <select
                    id="spec-skirt-length-type"
                    value={skirtLengthType}
                    onChange={(event) =>
                      setSkirtLengthType(
                        event.target.value as SkirtLengthType | "",
                      )
                    }
                    disabled={isPurchasedLocked}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">選択してください</option>
                    {SKIRT_LENGTH_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel
                    htmlFor="spec-skirt-material-type"
                    label="素材感"
                  />
                  <select
                    id="spec-skirt-material-type"
                    value={skirtMaterialType}
                    onChange={(event) =>
                      setSkirtMaterialType(
                        event.target.value as SkirtMaterialType | "",
                      )
                    }
                    disabled={isPurchasedLocked}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">選択してください</option>
                    {SKIRT_MATERIAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel
                    htmlFor="spec-skirt-design-type"
                    label="デザイン"
                  />
                  <select
                    id="spec-skirt-design-type"
                    value={skirtDesignType}
                    onChange={(event) =>
                      setSkirtDesignType(
                        event.target.value as SkirtDesignType | "",
                      )
                    }
                    disabled={isPurchasedLocked}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">選択してください</option>
                    {SKIRT_DESIGN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {isLegwearSpecVisible && legwearCoverageOptions.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel
                    htmlFor="spec-legwear-coverage-type"
                    label={legwearCoverageLabel}
                  />
                  <select
                    id="spec-legwear-coverage-type"
                    value={legwearCoverageType}
                    onChange={(event) =>
                      setLegwearCoverageType(
                        event.target.value as LegwearCoverageType | "",
                      )
                    }
                    disabled={isPurchasedLocked}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">{legwearCoveragePlaceholder}</option>
                    {legwearCoverageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </ItemFormSection>

      <ItemFormSection title="色" className="lg:col-span-1 lg:order-4">
        {isColorVariantDraftSource ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-800">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                色違い追加のため、色は未設定です。メインカラーを選択してください。
              </p>
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div
            className={
              isColorVariantDraftSource
                ? "rounded-xl border border-sky-200 bg-sky-50/40 p-3"
                : undefined
            }
          >
            <FieldLabel label="メインカラー" required />
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  aria-label="メインカラーをカラーコードで入力"
                  checked={useCustomMainColor}
                  disabled={isPurchasedLocked}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setUseCustomMainColor(checked);
                    if (checked) {
                      setCustomMainHex(
                        resolveCustomColorHex(mainColor, customMainHex),
                      );
                      setMainColor("");
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                カラーコードを直接入力する
              </label>

              {useCustomMainColor ? (
                <div
                  className={getFormControlWrapperClassName(
                    Boolean(errors.colors),
                    "gap-3 rounded-lg px-3 pr-3",
                  )}
                >
                  <input
                    type="color"
                    aria-label="メインカラーコードカラーピッカー"
                    value={customMainHex}
                    onChange={(event) => setCustomMainHex(event.target.value)}
                    disabled={isPurchasedLocked}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
                  />
                  <input
                    type="text"
                    aria-label="メインカラーコード"
                    value={customMainHex}
                    onChange={(event) => setCustomMainHex(event.target.value)}
                    disabled={isPurchasedLocked}
                    className="w-full border-0 bg-transparent px-2 text-gray-900 outline-none"
                  />
                </div>
              ) : (
                <ColorSelect
                  value={mainColor}
                  onChange={setMainColor}
                  placeholder="メインカラーを選択"
                  disabled={isPurchasedLocked}
                />
              )}
              <div>
                <label
                  htmlFor="main_color_custom_label"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  色名
                </label>
                <input
                  id="main_color_custom_label"
                  type="text"
                  value={mainColorCustomLabel}
                  onChange={(event) =>
                    setMainColorCustomLabel(event.target.value)
                  }
                  placeholder="例: 00 WHITE / 31 BEIGE / 64 BLUE"
                  maxLength={50}
                  disabled={isPurchasedLocked || !selectedMainColor}
                  className={getFormControlClassName({
                    invalid: Boolean(errors.main_color_custom_label),
                    disabled: true,
                  })}
                />
              </div>
            </div>
          </div>
          <div>
            <FieldLabel label="サブカラー" />
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  aria-label="サブカラーをカラーコードで入力"
                  checked={useCustomSubColor}
                  disabled={isPurchasedLocked}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setUseCustomSubColor(checked);
                    if (checked) {
                      setCustomSubHex(
                        resolveCustomColorHex(subColor, customSubHex),
                      );
                      setSubColor("");
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                カラーコードを直接入力する
              </label>

              {useCustomSubColor ? (
                <div
                  className={getFormControlWrapperClassName(
                    Boolean(errors.sub_color),
                    "gap-3 rounded-lg px-3 pr-3",
                  )}
                >
                  <input
                    type="color"
                    aria-label="サブカラーコードカラーピッカー"
                    value={customSubHex}
                    onChange={(event) => setCustomSubHex(event.target.value)}
                    disabled={isPurchasedLocked}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
                  />
                  <input
                    type="text"
                    aria-label="サブカラーコード"
                    value={customSubHex}
                    onChange={(event) => setCustomSubHex(event.target.value)}
                    disabled={isPurchasedLocked}
                    className="w-full border-0 bg-transparent px-2 text-gray-900 outline-none"
                  />
                </div>
              ) : (
                <ColorSelect
                  value={subColor}
                  onChange={setSubColor}
                  placeholder="サブカラーを選択"
                  emptyOptionLabel="未設定"
                  disabled={isPurchasedLocked}
                />
              )}
            </div>
          </div>
        </div>
        {errors.colors && (
          <p className="text-sm text-red-600">{errors.colors}</p>
        )}
        {errors.sub_color && (
          <p className="text-sm text-red-600">{errors.sub_color}</p>
        )}
        {errors.main_color_custom_label && (
          <p className="text-sm text-red-600">
            {errors.main_color_custom_label}
          </p>
        )}
      </ItemFormSection>

      <ItemFormSection
        title="利用条件・特性"
        className="lg:col-span-1 lg:order-5"
      >
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">季節</p>
          <div className="flex flex-wrap gap-2">
            {SEASON_OPTIONS.map((option) => {
              const checked = selectedSeasons.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => toggleSeason(option)}
                  disabled={isPurchasedLocked}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    checked
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">TPO</p>
          <div className="flex flex-wrap gap-2">
            {TPO_OPTIONS.map((option) => {
              const checked = selectedTpos.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={checked}
                  onClick={() =>
                    toggleValue(option, selectedTpos, setSelectedTpos)
                  }
                  disabled={isPurchasedLocked}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    checked
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="inline-flex h-[50px] w-full items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              aria-label="雨対応"
              checked={isRainOk}
              onChange={(event) => setIsRainOk(event.target.checked)}
              disabled={isPurchasedLocked}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            雨対応
          </label>
        </div>

        <div>
          <label
            htmlFor="sheerness"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            透け感
          </label>
          <select
            id="sheerness"
            value={sheerness}
            onChange={(event) =>
              setSheerness(event.target.value as ItemSheerness | "")
            }
            disabled={isPurchasedLocked}
            className={getFormControlClassName()}
          >
            <option value=""></option>
            {Object.entries(ITEM_SHEERNESS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </ItemFormSection>

      <ItemFormSection
        title="サイズ・実寸"
        className="lg:col-span-2 lg:order-7"
      >
        <div className="max-w-md">
          <FieldLabel htmlFor="size_gender" label="サイズ区分" />
          <select
            id="size_gender"
            value={sizeGender}
            onChange={(event) =>
              setSizeGender(event.target.value as typeof sizeGender)
            }
            disabled={isPurchasedLocked}
            className={getFormControlClassName({
              disabled: isPurchasedLocked,
            })}
          >
            <option value=""></option>
            <option value="women">
              {PURCHASE_CANDIDATE_SIZE_GENDER_LABELS.women}
            </option>
            <option value="men">
              {PURCHASE_CANDIDATE_SIZE_GENDER_LABELS.men}
            </option>
            <option value="unisex">
              {PURCHASE_CANDIDATE_SIZE_GENDER_LABELS.unisex}
            </option>
          </select>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 pt-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div
                className="-mb-px flex min-w-0 flex-1 flex-wrap items-end gap-2"
                role="tablist"
                aria-label="サイズ候補"
              >
                {sizeCandidateTabs.map((tab) => {
                  const isActive = activeSizeCandidateTab === tab.key;
                  const displayLabel =
                    tab.label !== "" ? tab.label : "サイズ未入力";

                  return (
                    <button
                      key={tab.key}
                      id={`size-candidate-tab-${tab.key}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`size-candidate-panel-${tab.key}`}
                      onClick={() => setActiveSizeCandidateTab(tab.key)}
                      className={[
                        "flex min-w-[11rem] items-center gap-3 rounded-t-xl border px-4 py-2.5 text-left transition",
                        isActive
                          ? "relative -mb-px border-gray-200 border-b-white bg-white text-gray-900 after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-white"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
                      ].join(" ")}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium">{tab.title}</div>
                        <div className="truncate text-sm font-semibold">
                          {displayLabel}
                        </div>
                      </div>
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          tab.hasInput
                            ? isActive
                              ? "bg-blue-50 text-blue-700"
                              : "bg-emerald-50 text-emerald-700"
                            : "bg-white/80 text-gray-500",
                        ].join(" ")}
                      >
                        {tab.hasInput ? "入力あり" : "未入力"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {canSwapSizeCandidates ? (
                <div className="shrink-0 pb-3 md:text-right">
                  <button
                    type="button"
                    onClick={swapSizeCandidates}
                    disabled={isPurchasedLocked}
                    aria-label="サイズ候補を入れ替え"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <p className="mt-1 text-xs text-gray-500">
                    候補1と候補2を入れ替えます
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div
            id={`size-candidate-panel-${activeSizeCandidate.key}`}
            role="tabpanel"
            aria-labelledby={`size-candidate-tab-${activeSizeCandidate.key}`}
            className="space-y-4 p-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor={activeSizeCandidate.labelInputId}
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  サイズ表記
                </label>
                <input
                  id={activeSizeCandidate.labelInputId}
                  type="text"
                  placeholder={
                    activeSizeCandidate.key === "primary"
                      ? "例: M / 23.5cm"
                      : "例: L / 24.0cm"
                  }
                  value={activeSizeCandidate.label}
                  onChange={(event) =>
                    activeSizeCandidate.setLabel(event.target.value)
                  }
                  disabled={isPurchasedLocked}
                  className={getFormControlClassName({
                    disabled: isPurchasedLocked,
                  })}
                />
              </div>
              <div>
                <label
                  htmlFor={activeSizeCandidate.noteInputId}
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  サイズ感メモ
                </label>
                <textarea
                  id={activeSizeCandidate.noteInputId}
                  value={activeSizeCandidate.note}
                  onChange={(event) =>
                    activeSizeCandidate.setNote(event.target.value)
                  }
                  disabled={isPurchasedLocked}
                  rows={4}
                  placeholder={
                    activeSizeCandidate.key === "primary"
                      ? "例: 普段Mだが少し小さめ"
                      : "例: 普段Mだがゆったり着るならL"
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <ItemSizeDetailsFields
              structuredSizeFieldDefinitions={structuredSizeFieldDefinitions}
              structuredSizeValues={activeSizeCandidate.structuredSizeValues}
              customSizeFields={activeSizeCandidate.customSizeFields}
              hasDuplicateWarnings={activeSizeCandidate.hasDuplicateWarnings}
              disabled={isPurchasedLocked}
              compact
              onAddCustomSizeField={activeSizeCandidate.onAddCustomSizeField}
              onUpdateStructuredSizeValue={
                activeSizeCandidate.onUpdateStructuredSizeValue
              }
              onUpdateCustomSizeField={
                activeSizeCandidate.onUpdateCustomSizeField
              }
              onRemoveCustomSizeField={
                activeSizeCandidate.onRemoveCustomSizeField
              }
            />
          </div>
        </div>
      </ItemFormSection>
      <ItemFormSection title="素材・混率" className="lg:col-span-2 lg:order-8">
        {isPurchasedLocked && (
          <p className="text-sm text-amber-700">
            購入済みの購入検討では素材・混率は変更できません。
          </p>
        )}
        <ItemMaterialFields
          rows={materialRows}
          errors={errors}
          totals={materialValidation.totals}
          disabled={isPurchasedLocked}
          onChange={updateMaterialRow}
          onAddRow={addMaterialRow}
          onRemoveRow={removeMaterialRow}
        />
      </ItemFormSection>

      <ItemFormSection title="補足情報" className="lg:col-span-2 lg:order-9">
        <div
          className={
            hasInheritedMemo
              ? "rounded-xl border border-amber-200 bg-amber-50/60 p-3"
              : undefined
          }
        >
          <div className="mb-1 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="memo"
                className="block text-sm font-medium text-gray-700"
              >
                メモ
              </label>
              {hasInheritedMemo ? <ReviewHintIcon /> : null}
            </div>
            <p className="text-xs text-gray-500">
              このメモは購入後アイテムに引き継がれます。
            </p>
          </div>
          <textarea
            id="memo"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={4}
            className={getFormControlClassName({
              className: hasInheritedMemo
                ? "border-amber-300 bg-amber-50"
                : undefined,
            })}
          />
        </div>
      </ItemFormSection>
      <ItemFormSection title="画像" className="lg:col-span-2 lg:order-10">
        {hasInheritedImages ? (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-700">
            <div className="flex items-start gap-2">
              <ReviewHintIcon />
              <span>
                元の購入検討画像を仮で引き継いでいます。必要に応じて差し替えてください。
              </span>
            </div>
          </div>
        ) : null}
        <div
          className={
            hasInheritedImages
              ? "rounded-xl border border-amber-200 bg-amber-50/40 p-3"
              : undefined
          }
        >
          <PurchaseCandidateImageUploader
            existingImages={displayedImages}
            pendingImages={pendingImages}
            onPendingImagesChange={setPendingImages}
            onDeleteExistingImage={
              mode === "edit"
                ? (imageId) => void handleDeleteImage(imageId)
                : duplicateImages.length > 0
                  ? (imageId) => handleDeleteDraftImage(imageId)
                  : undefined
            }
            onMoveExistingImage={
              mode === "create" && duplicateImages.length > 0
                ? (image, direction) =>
                    handleMoveDraftImage(image.id, direction)
                : undefined
            }
            onMakePrimaryExistingImage={
              mode === "create" && duplicateImages.length > 0
                ? (image) => handleMakePrimaryDraftImage(image.id)
                : undefined
            }
            disabled={submitting}
            helperText={imageHelperText}
          />
        </div>
      </ItemFormSection>

      {submitMessage && (
        <section
          className={`rounded-xl border px-4 py-3 text-sm lg:col-span-2 lg:order-11 ${
            submitError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {submitMessage}
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 md:flex-row md:items-center md:justify-between lg:col-span-2 lg:order-12">
        <div>{footerAction}</div>
        <div className="flex items-center gap-3">
          <Link
            href={cancelHref}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {mode === "edit" ? "更新する" : "登録する"}
          </button>
        </div>
      </div>
    </form>
  );
}

function normalizeEditableSizeValue(
  currentValue: EditableSizeDetailValue | undefined,
  key: keyof ItemSizeDetailValue,
  nextValue: string,
): EditableSizeDetailValue {
  const baseValue = currentValue ?? createEmptyEditableSizeDetailValue();
  const normalizedValue = {
    ...baseValue,
    [key]: nextValue,
  };

  if (key === "value" && nextValue.trim()) {
    normalizedValue.min = "";
    normalizedValue.max = "";
  }

  if ((key === "min" || key === "max") && nextValue.trim()) {
    normalizedValue.value = "";
  }

  return normalizedValue;
}
