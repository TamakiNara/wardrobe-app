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
import FieldLabel from "@/components/forms/field-label";
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
  getLegwearCoverageFieldLabel,
  getLegwearCoverageOptions,
  getLegwearCoveragePlaceholder,
  resolveBottomsLengthType,
  resolveLegwearCoverageType,
  type BottomsLengthType,
  type BottomsRiseType,
  type LegwearCoverageType,
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
import {
  buildEditableItemMaterials,
  createEmptyItemMaterialRow,
  validateItemMaterials,
  type EditableItemMaterial,
} from "@/lib/items/materials";
import {
  buildItemSizeDetailsPayload,
  buildSizeDetailDuplicateWarnings,
  getStructuredSizeFieldDefinitionsFromContext,
  normalizeItemSizeDetails,
  type EditableCustomSizeField,
} from "@/lib/items/size-details";
import { resolvePurchaseCandidateItemClassification } from "@/lib/items/classification";
import {
  PURCHASE_CANDIDATE_PRIORITY_LABELS,
  PURCHASE_CANDIDATE_SIZE_GENDER_LABELS,
  PURCHASE_CANDIDATE_STATUS_LABELS,
} from "@/lib/purchase-candidates/labels";
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
import type { ItemSpec, StructuredSizeFieldName } from "@/types/items";

type PurchaseCandidateFormProps = {
  mode: "create" | "edit";
  candidateId?: string;
  cancelHref?: string;
  footerAction?: ReactNode;
};

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
  legwearCoverageType: LegwearCoverageType | "";
};

function resolvePurchaseCandidateSpecFormState(
  categoryId: string,
  spec?: ItemSpec | null,
): PurchaseCandidateSpecFormState {
  const resolvedCategory =
    resolvePurchaseCandidateItemClassification(categoryId);

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
    legwearCoverageType:
      (resolveLegwearCoverageType(
        resolvedCategory?.category ?? null,
        resolvedCategory?.shape ?? null,
        spec?.legwear?.coverage_type ?? null,
        resolvedCategory?.subcategory ?? null,
      ) as LegwearCoverageType | null) ?? "",
  };
}

function buildCategoryOptions(
  groups: CategoryGroupRecord[],
  visibleCategoryIds?: string[],
): PurchaseCandidateCategoryOption[] {
  const visibleSet = visibleCategoryIds ? new Set(visibleCategoryIds) : null;

  return groups.flatMap((group) =>
    group.categories
      .filter((category) => {
        if (!visibleSet) {
          return true;
        }

        return visibleSet.has(category.id);
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

function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMinutes = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offsetMinutes * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function getSaleEndsAtDateValue(value: string): string {
  return value.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}$/)?.[1] ?? "";
}

function getSaleEndsAtTimeValue(value: string): string {
  return value.match(/^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})$/)?.[1] ?? "";
}

export function resolveSaleEndsAtFromDateInput(
  dateValue: string,
  currentValue: string,
): string {
  if (dateValue === "") {
    return "";
  }

  return `${dateValue}T${getSaleEndsAtTimeValue(currentValue) || "00:00"}`;
}

export function resolveSaleEndsAtFromTimeInput(
  timeValue: string,
  currentValue: string,
): string {
  const dateValue = getSaleEndsAtDateValue(currentValue);
  if (dateValue === "") {
    return currentValue;
  }

  return `${dateValue}T${timeValue || "00:00"}`;
}

function createEditableCustomSizeFieldId(index: number): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) {
    return `custom-${randomUuid}`;
  }

  return `custom-${Date.now()}-${index}`;
}

export default function PurchaseCandidateForm({
  mode,
  candidateId,
  cancelHref = "/purchase-candidates",
  footerAction,
}: PurchaseCandidateFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasAppliedDuplicateDraftRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState<PurchaseCandidateStatus>("considering");
  const [priority, setPriority] = useState<PurchaseCandidatePriority>("medium");
  const [name, setName] = useState("");
  const [categoryGroupId, setCategoryGroupId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [variantSourceCandidateId, setVariantSourceCandidateId] = useState<
    number | null
  >(null);
  const [brandName, setBrandName] = useState("");
  const [saveBrandAsCandidate, setSaveBrandAsCandidate] = useState(false);
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleEndsAt, setSaleEndsAt] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [wantedReason, setWantedReason] = useState("");
  const [memo, setMemo] = useState("");
  const [sizeGender, setSizeGender] = useState<"women" | "men" | "unisex" | "">(
    "",
  );
  const [sizeLabel, setSizeLabel] = useState("");
  const [sizeNote, setSizeNote] = useState("");
  const [structuredSizeValues, setStructuredSizeValues] = useState<
    Partial<Record<StructuredSizeFieldName, string>>
  >({});
  const [customSizeFields, setCustomSizeFields] = useState<
    EditableCustomSizeField[]
  >([]);
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
  const [legwearCoverageType, setLegwearCoverageType] = useState<
    LegwearCoverageType | ""
  >("");
  const [isRainOk, setIsRainOk] = useState(false);
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isPurchasedLocked = mode === "edit" && status === "purchased";

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
    () => resolvePurchaseCandidateItemClassification(categoryId),
    [categoryId],
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
      resolvedTopsShape
        ? TOPS_RULES[resolvedTopsShape]
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
  const materialValidation = useMemo(
    () => validateItemMaterials(materialRows),
    [materialRows],
  );
  const imageHelperText =
    duplicateImages.length > 0
      ? [
          "購入検討から引き継ぐ画像です。",
          "保存すると新しい購入検討へ画像をコピーします。",
        ].join("")
      : [
          "一覧では代表画像を表示し、",
          "詳細や編集では画像全体を見やすく表示します。",
        ].join("");
  const initializationMessage = initializationError ?? initializationSuccess;
  const submitMessage = submitError ?? submitSuccess;

  function resetSpecFormState() {
    setTopsSleeve("");
    setTopsLength("");
    setTopsNeck("");
    setTopsDesign("");
    setTopsFit(DEFAULT_TOPS_FIT);
    setBottomsLengthType("");
    setBottomsRiseType("");
    setLegwearCoverageType("");
  }

  function applySpecFormState(categoryIdValue: string, spec?: ItemSpec | null) {
    const nextState = resolvePurchaseCandidateSpecFormState(
      categoryIdValue,
      spec,
    );
    setTopsSleeve(nextState.topsSleeve);
    setTopsLength(nextState.topsLength);
    setTopsNeck(nextState.topsNeck);
    setTopsDesign(nextState.topsDesign);
    setTopsFit(nextState.topsFit);
    setBottomsLengthType(nextState.bottomsLengthType);
    setBottomsRiseType(nextState.bottomsRiseType);
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
        );

        setCategoryOptions(nextCategoryOptions);

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
          setVariantSourceCandidateId(null);
          setBrandName(candidate.brand_name ?? "");
          setSaveBrandAsCandidate(false);
          setPrice(candidate.price === null ? "" : String(candidate.price));
          setSalePrice(
            candidate.sale_price === null ? "" : String(candidate.sale_price),
          );
          setSaleEndsAt(toDateTimeLocalValue(candidate.sale_ends_at));
          setPurchaseUrl(candidate.purchase_url ?? "");
          setWantedReason(candidate.wanted_reason ?? "");
          setMemo(candidate.memo ?? "");
          setSizeGender(candidate.size_gender ?? "");
          setSizeLabel(candidate.size_label ?? "");
          setSizeNote(candidate.size_note ?? "");
          const normalizedSizeDetails = normalizeItemSizeDetails(
            candidate.size_details,
          );
          setStructuredSizeValues(
            normalizedSizeDetails?.structured
              ? Object.fromEntries(
                  Object.entries(normalizedSizeDetails.structured).map(
                    ([fieldName, fieldValue]) => [
                      fieldName,
                      String(fieldValue),
                    ],
                  ),
                )
              : {},
          );
          setCustomSizeFields(
            normalizedSizeDetails?.custom_fields?.map((field, index) => ({
              id: `existing-${index}`,
              label: field.label,
              value: String(field.value),
            })) ?? [],
          );
          setIsRainOk(candidate.is_rain_ok);
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
          setExistingImages(candidate.images);
          setDuplicateImages([]);
          applySpecFormState(candidate.category_id, candidate.spec);
        }
      } catch {
        setLoadError("購入検討フォームの初期化に失敗しました。");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [candidateId, mode, router]);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    const source = searchParams.get("source");
    const isDuplicateSource = source === "duplicate";
    const isColorVariantSource = source === "color-variant";

    if (!isDuplicateSource && !isColorVariantSource) {
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

    if (!payload) {
      setInitializationError(
        "複製の初期値を読み込めませんでした。通常の新規作成として続けてください。",
      );
      return;
    }

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
    setVariantSourceCandidateId(
      isColorVariantSource
        ? (payload.variant_source_candidate_id ?? null)
        : null,
    );
    setBrandName(payload.brand_name ?? "");
    setSaveBrandAsCandidate(false);
    setPrice(payload.price === null ? "" : String(payload.price));
    setSalePrice(payload.sale_price === null ? "" : String(payload.sale_price));
    setSaleEndsAt(toDateTimeLocalValue(payload.sale_ends_at));
    setPurchaseUrl(payload.purchase_url ?? "");
    setWantedReason(payload.wanted_reason ?? "");
    setMemo(payload.memo ?? "");
    setSizeGender(payload.size_gender ?? "");
    setSizeLabel(payload.size_label ?? "");
    setSizeNote(payload.size_note ?? "");

    const normalizedSizeDetails = normalizeItemSizeDetails(
      payload.size_details,
    );
    setStructuredSizeValues(
      normalizedSizeDetails?.structured
        ? Object.fromEntries(
            Object.entries(normalizedSizeDetails.structured).map(
              ([fieldName, fieldValue]) => [fieldName, String(fieldValue)],
            ),
          )
        : {},
    );
    setCustomSizeFields(
      normalizedSizeDetails?.custom_fields?.map((field, index) => ({
        id: `duplicate-${index}`,
        label: field.label,
        value: String(field.value),
      })) ?? [],
    );
    setIsRainOk(payload.is_rain_ok);

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
    setExistingImages(payload.images);
    setDuplicateImages(payload.images);
    setPendingImages([]);
    applySpecFormState(payload.category_id, payload.spec);
    setErrors({});
    setInitializationSuccess(
      isColorVariantSource
        ? "色違いの初期値を読み込みました。保存前に色や画像を調整してください。"
        : "複製元の内容を初期値として読み込みました。",
    );
  }, [categoryOptions, loading, mode, router, searchParams]);

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

  function updateStructuredSizeValue(
    fieldName: StructuredSizeFieldName,
    value: string,
  ) {
    setStructuredSizeValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  function updateCustomSizeField(
    fieldId: string,
    field: "label" | "value",
    value: string,
  ) {
    setCustomSizeFields((current) =>
      current.map((item) =>
        item.id === fieldId ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addCustomSizeField() {
    setCustomSizeFields((current) => [
      ...current,
      {
        id: createEditableCustomSizeFieldId(current.length),
        label: "",
        value: "",
      },
    ]);
  }

  function removeCustomSizeField(fieldId: string) {
    setCustomSizeFields((current) =>
      current.filter((field) => field.id !== fieldId),
    );
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
        sale_price: salePrice === "" ? null : Number(salePrice),
        sale_ends_at: saleEndsAt === "" ? null : saleEndsAt,
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
      sale_price: salePrice === "" ? null : Number(salePrice),
      sale_ends_at: saleEndsAt === "" ? null : saleEndsAt,
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
      is_rain_ok: isRainOk,
      colors,
      seasons: selectedSeasons,
      tpos: selectedTpos,
      materials: materialValidation.payload,
      duplicate_images:
        mode === "create" && duplicateImages.length > 0
          ? duplicateImages.map((image) => ({
              source_image_id: image.source_image_id,
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

    if (!isPurchasedLocked && !selectedMainColor) {
      nextErrors.colors = "メインカラーを選択してください。";
    }

    if (
      !isPurchasedLocked &&
      normalizeNullableString(mainColorCustomLabel).length > 50
    ) {
      nextErrors.main_color_custom_label =
        "色名（任意）は50文字以内で入力してください。";
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
    for (let index = 0; index < pendingImages.length; index += 1) {
      const image = pendingImages[index];
      const formData = new FormData();
      formData.set("image", image);
      formData.set("sort_order", String(existingImages.length + index + 1));
      if (existingImages.length === 0 && index === 0) {
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
      {initializationMessage && (
        <section
          className={`rounded-xl border px-4 py-3 text-sm lg:col-span-2 ${
            initializationError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {initializationMessage}
        </section>
      )}

      <ItemFormSection title="基本情報" className="lg:col-span-1 lg:order-1">
        {isPurchasedLocked && (
          <p className="text-sm text-amber-700">
            購入済みの購入検討では、メモ・欲しい理由・優先度・セール情報・購入
            URL・画像のみ更新できます。アイテムには反映されません。
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="status" label="ステータス" />
            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as PurchaseCandidateStatus)
              }
              disabled={isPurchasedLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.name ? "border-red-400" : "border-gray-300"}`}
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
      <ItemFormSection title="分類" className="lg:col-span-1 lg:order-2">
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
                resetSpecFormState();
              }}
              disabled={isPurchasedLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">選択してください</option>
              {categoryGroupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="category_id" label="種類" required />
            <select
              id="category_id"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                resetSpecFormState();
              }}
              disabled={isPurchasedLocked || !categoryGroupId}
              className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.category_id ? "border-red-400" : "border-gray-300"}`}
            >
              <option value="">
                {categoryGroupId
                  ? "選択してください"
                  : "カテゴリを先に選択してください"}
              </option>
              {filteredCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-2 text-sm text-red-600">{errors.category_id}</p>
            )}
          </div>
        </div>

        {(isTopsSpecVisible ||
          isBottomsSpecVisible ||
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

      <ItemFormSection title="購入情報" className="lg:col-span-1 lg:order-3">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="price"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              想定価格
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 bg-white pr-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <input
                id="price"
                type="number"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                disabled={isPurchasedLocked}
                className="w-full rounded-lg bg-transparent px-4 py-3 text-gray-900 outline-none"
              />
              <span className="text-sm text-gray-500">円</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="sale_price"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              セール価格
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 bg-white pr-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <input
                id="sale_price"
                type="number"
                min="0"
                value={salePrice}
                onChange={(event) => setSalePrice(event.target.value)}
                className="w-full rounded-lg bg-transparent px-4 py-3 text-gray-900 outline-none"
              />
              <span className="text-sm text-gray-500">円</span>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="block text-sm font-medium text-gray-700">
                セール終了予定
              </span>
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
                aria-label="セール終了予定の日付"
                type="date"
                value={getSaleEndsAtDateValue(saleEndsAt)}
                onChange={(event) =>
                  setSaleEndsAt(
                    resolveSaleEndsAtFromDateInput(
                      event.target.value,
                      saleEndsAt,
                    ),
                  )
                }
                style={{ colorScheme: "light", accentColor: "#2563eb" }}
                className="h-[50px] w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-950 shadow-sm outline-none transition [color-scheme:light] focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <input
                id="sale_ends_at_time"
                aria-label="セール終了予定の時刻"
                type="time"
                value={getSaleEndsAtTimeValue(saleEndsAt)}
                onChange={(event) =>
                  setSaleEndsAt(
                    resolveSaleEndsAtFromTimeInput(
                      event.target.value,
                      saleEndsAt,
                    ),
                  )
                }
                disabled={getSaleEndsAtDateValue(saleEndsAt) === ""}
                style={{ colorScheme: "light", accentColor: "#2563eb" }}
                className="h-[50px] w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-950 shadow-sm outline-none transition [color-scheme:light] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </ItemFormSection>

      <ItemFormSection title="色" className="lg:col-span-1 lg:order-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
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
                <div className="flex gap-3">
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
                    className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.colors ? "border-red-400" : "border-gray-300"}`}
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
                  色名（任意）
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
                  className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${errors.main_color_custom_label ? "border-red-400" : "border-gray-300"}`}
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
                <div className="flex gap-3">
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
                    className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.sub_color ? "border-red-400" : "border-gray-300"}`}
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
        title="利用条件・状態"
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
      </ItemFormSection>

      <ItemFormSection
        title="サイズ・実寸"
        className="lg:col-span-2 lg:order-7"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="size_gender" label="サイズ区分" />
            <select
              id="size_gender"
              value={sizeGender}
              onChange={(event) =>
                setSizeGender(event.target.value as typeof sizeGender)
              }
              disabled={isPurchasedLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

          <div>
            <label
              htmlFor="size_label"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              サイズ表記
            </label>
            <input
              id="size_label"
              type="text"
              placeholder="例: M / 23.5cm"
              value={sizeLabel}
              onChange={(event) => setSizeLabel(event.target.value)}
              disabled={isPurchasedLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="size_note"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            サイズ感メモ
          </label>
          <textarea
            id="size_note"
            value={sizeNote}
            onChange={(event) => setSizeNote(event.target.value)}
            disabled={isPurchasedLocked}
            rows={3}
            placeholder="例: 普段Mだが小さめ"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <ItemSizeDetailsFields
          structuredSizeFieldDefinitions={structuredSizeFieldDefinitions}
          structuredSizeValues={structuredSizeValues}
          customSizeFields={customSizeFields}
          hasDuplicateWarnings={
            sizeDetailDuplicateWarnings.hasStructuredDuplicates ||
            sizeDetailDuplicateWarnings.hasCustomDuplicates
          }
          disabled={isPurchasedLocked}
          onAddCustomSizeField={addCustomSizeField}
          onUpdateStructuredSizeValue={updateStructuredSizeValue}
          onUpdateCustomSizeField={updateCustomSizeField}
          onRemoveCustomSizeField={removeCustomSizeField}
        />
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

      <ItemFormSection title="補足情報" className="lg:col-span-1 lg:order-6">
        <div>
          <div className="mb-1 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <label
              htmlFor="memo"
              className="block text-sm font-medium text-gray-700"
            >
              メモ
            </label>
            <p className="text-xs text-gray-500">
              このメモは購入後アイテムに引き継がれます。
            </p>
          </div>
          <textarea
            id="memo"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </ItemFormSection>
      <ItemFormSection title="画像" className="lg:col-span-2 lg:order-9">
        <PurchaseCandidateImageUploader
          existingImages={existingImages}
          pendingImages={pendingImages}
          onPendingImagesChange={setPendingImages}
          onDeleteExistingImage={
            mode === "edit"
              ? (imageId) => void handleDeleteImage(imageId)
              : undefined
          }
          disabled={submitting}
          helperText={imageHelperText}
        />
      </ItemFormSection>

      {submitMessage && (
        <section
          className={`rounded-xl border px-4 py-3 text-sm lg:col-span-2 lg:order-10 ${
            submitError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {submitMessage}
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 md:flex-row md:items-center md:justify-between lg:col-span-2 lg:order-11">
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
