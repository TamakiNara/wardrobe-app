"use client";

import { Info, Save, TriangleAlert } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormPageHeader } from "@/components/shared/form-page-header";
import {
  FORM_CONTROL_INNER_INPUT_CLASS,
  getFormControlClassName,
  getFormControlWrapperClassName,
} from "@/components/forms/control-styles";
import {
  findItemShapeLabel,
  ITEM_CATEGORIES,
  getItemShapeOptions,
  type ItemCategory,
} from "@/lib/master-data/item-shapes";
import {
  getItemSubcategoryOptions,
  isItemSubcategoryRequired,
  resolveItemSubcategoryForForm,
  resolveCurrentItemSubcategoryValue,
  shouldShowItemSubcategoryField,
  shouldUseItemSubcategoryRadioField,
} from "@/lib/master-data/item-subcategories";
import {
  buildSupportedCategoryOptions,
  fetchCategoryGroups,
  resolveCurrentItemCategoryValue,
} from "@/lib/api/categories";
import { ApiClientError } from "@/lib/api/client";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";
import {
  fetchCategoryVisibilitySettings,
  fetchUserTpos,
} from "@/lib/api/settings";
import type { CategoryOption } from "@/types/categories";
import {
  ITEM_COLORS,
  resolveCustomColorHex,
  type ItemColorValue,
} from "@/lib/master-data/item-colors";
import FieldLabel from "@/components/forms/field-label";
import BrandNameField from "@/components/items/brand-name-field";
import ColorSelect from "@/components/items/color-select";
import ItemClassificationGroup from "@/components/items/item-classification-group";
import ItemFormSection from "@/components/items/item-form-section";
import ItemMaterialFields from "@/components/items/item-material-fields";
import ItemImageUploader from "@/components/items/item-image-uploader";
import ItemSizeDetailsFields from "@/components/items/item-size-details-fields";
import type {
  CreateItemPayload,
  ItemCareStatus,
  ItemFormColor,
  ItemImageRecord,
  ItemSizeDetailValue,
  ItemSheerness,
  StructuredSizeFieldName,
} from "@/types/items";
import { SEASON_OPTIONS } from "@/lib/master-data/item-attributes";
import {
  DEFAULT_TOPS_FIT,
  TOPS_DESIGNS,
  TOPS_FITS,
  TOPS_LENGTHS,
  TOPS_NECKS,
  TOPS_RULES,
  TOPS_SLEEVES,
  getTopsShapeOptions,
  type TopsDesignValue,
  type TopsFitValue,
  type TopsLengthValue,
  type TopsNeckValue,
  type TopsShapeValue,
  type TopsSleeveValue,
} from "@/lib/master-data/item-tops";
import {
  BOTTOMS_LENGTH_OPTIONS,
  BOTTOMS_RISE_OPTIONS,
  SKIRT_DESIGN_OPTIONS,
  SKIRT_LENGTH_OPTIONS,
  SKIRT_MATERIAL_OPTIONS,
  getLegwearCoverageFieldLabel,
  getLegwearCoverageOptions,
  getLegwearCoveragePlaceholder,
  isBottomsSpecCategory,
  isBottomsLengthTypeRequired,
  isBottomsRiseTypeSupported,
  isLegwearCoverageTypeRequired,
  isLegwearSpecCategory,
  isSkirtLengthTypeRequired,
  resolveBottomsLengthType,
  resolveLegwearCoverageType,
  shouldShowLegwearCoverageSelect,
  type BottomsLengthType,
  type BottomsRiseType,
  type LegwearCoverageType,
  type SkirtDesignType,
  type SkirtLengthType,
  type SkirtMaterialType,
} from "@/lib/master-data/item-skin-exposure";
import {
  clearItemDuplicatePayload,
  loadItemDuplicatePayload,
} from "@/lib/items/duplicate";
import {
  clearPurchaseCandidateItemDraft,
  loadPurchaseCandidateItemDraft,
  mapPurchaseCandidateItemDraft,
} from "@/lib/purchase-candidates/item-draft";
import {
  ITEM_CARE_STATUS_LABELS,
  ITEM_SHEERNESS_LABELS,
  ITEM_SIZE_GENDER_LABELS,
  mapPurchaseCandidateImagesToItemImages,
  normalizeItemImages,
} from "@/lib/items/metadata";
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
import {
  buildEditableItemMaterials,
  createEmptyItemMaterialRow,
  validateItemMaterials,
  type EditableItemMaterial,
} from "@/lib/items/materials";
import {
  buildItemShapeForSubmit,
  buildItemSpecForSubmit,
  isItemShapeRequired,
  resolveItemShapeForSubmit,
  shouldShowItemShapeField,
} from "@/lib/items/input-requirements";
import type { UserTpoRecord } from "@/types/settings";

function ReviewHintIcon() {
  return (
    <Info
      className="h-4 w-4 text-amber-600"
      aria-label="元データから引き継いだため確認してください"
    />
  );
}

export default function NewItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const isPurchaseCandidateSource = source === "purchase-candidate";
  const isDuplicateSource = source === "duplicate";
  const isColorVariantSource = source === "color-variant";
  const isItemDraftSource = isDuplicateSource || isColorVariantSource;
  const requestedReturnTo = searchParams.get("returnTo");
  const requestedCategoryParam = searchParams.get("category");
  const requestedInitialCategory = useMemo(() => {
    const nextCategory = resolveCurrentItemCategoryValue(
      requestedCategoryParam,
      null,
    );

    if (!nextCategory) {
      return "";
    }

    return ITEM_CATEGORIES.some((item) => item.value === nextCategory)
      ? (nextCategory as ItemCategory)
      : "";
  }, [requestedCategoryParam]);
  const cancelHref =
    requestedReturnTo &&
    requestedReturnTo.startsWith("/") &&
    !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : isPurchaseCandidateSource
        ? "/purchase-candidates"
        : "/items";
  const backLinkLabel = requestedReturnTo
    ? "元の画面に戻る"
    : isPurchaseCandidateSource
      ? "購入検討一覧に戻る"
      : "一覧に戻る";

  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [saveBrandAsCandidate, setSaveBrandAsCandidate] = useState(false);
  const [price, setPrice] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [careStatus, setCareStatus] = useState<ItemCareStatus | "">("");
  const [sheerness, setSheerness] = useState<ItemSheerness | "">("");
  const [purchasedAt, setPurchasedAt] = useState("");
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
  const [materialRows, setMaterialRows] = useState<EditableItemMaterial[]>(() =>
    buildEditableItemMaterials(),
  );
  const [isRainOk, setIsRainOk] = useState(false);
  const [category, setCategory] = useState<ItemCategory | "">(
    requestedInitialCategory,
  );
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([
    ...ITEM_CATEGORIES,
  ]);
  const [subcategory, setSubcategory] = useState(
    resolveItemSubcategoryForForm(requestedInitialCategory, null) ?? "",
  );
  const [shape, setShape] = useState("");

  const [mainColor, setMainColor] = useState<ItemColorValue | "">("");
  const [mainColorCustomLabel, setMainColorCustomLabel] = useState("");
  const [subColor, setSubColor] = useState<ItemColorValue | "">("");
  const [useCustomMainColor, setUseCustomMainColor] = useState(false);
  const [useCustomSubColor, setUseCustomSubColor] = useState(false);
  const [customMainHex, setCustomMainHex] = useState("#3B82F6");
  const [customSubHex, setCustomSubHex] = useState("#3B82F6");

  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedTpoIds, setSelectedTpoIds] = useState<number[]>([]);
  const [tpoOptions, setTpoOptions] = useState<UserTpoRecord[]>([]);
  const [tpoLoadError, setTpoLoadError] = useState<string | null>(null);
  const [draftTpoNames, setDraftTpoNames] = useState<string[]>([]);

  const [topsShape, setTopsShape] = useState<TopsShapeValue | "">("");
  const [topsSleeve, setTopsSleeve] = useState<TopsSleeveValue | "">("");
  const [topsLength, setTopsLength] = useState<TopsLengthValue | "">("");
  const [topsNeck, setTopsNeck] = useState<TopsNeckValue | "">("");
  const [topsDesign, setTopsDesign] = useState<TopsDesignValue | "">("");
  const [topsFit, setTopsFit] = useState<TopsFitValue>(DEFAULT_TOPS_FIT);
  const [bottomsLengthType, setBottomsLengthType] = useState<
    BottomsLengthType | ""
  >("");
  const [skirtLengthType, setSkirtLengthType] = useState<SkirtLengthType | "">(
    "",
  );
  const [skirtMaterialType, setSkirtMaterialType] = useState<
    SkirtMaterialType | ""
  >("");
  const [skirtDesignType, setSkirtDesignType] = useState<SkirtDesignType | "">(
    "",
  );
  const [bottomsRiseType, setBottomsRiseType] = useState<BottomsRiseType | "">(
    "",
  );
  const [legwearCoverageType, setLegwearCoverageType] = useState<
    LegwearCoverageType | ""
  >("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [draftInfoMessage, setDraftInfoMessage] = useState<string | null>(null);
  const [sourcePurchaseCandidateId, setSourcePurchaseCandidateId] = useState<
    number | null
  >(null);
  const [variantSourceItemId, setVariantSourceItemId] = useState<number | null>(
    null,
  );
  const [itemImages, setItemImages] = useState<ItemImageRecord[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const hasInheritedPrice = isItemDraftSource && price.trim() !== "";
  const hasInheritedPurchasedAt =
    isItemDraftSource && purchasedAt.trim() !== "";
  const hasInheritedMemo = isItemDraftSource && memo.trim() !== "";
  const hasInheritedImages = isItemDraftSource && itemImages.length > 0;

  const isTopsCategory = category === "tops";
  const effectiveSubcategory = useMemo(
    () => resolveItemSubcategoryForForm(category, subcategory),
    [category, subcategory],
  );
  const normalizedSubcategory = effectiveSubcategory;
  const isBottomsSpecVisible = isBottomsSpecCategory(category);
  const isSkirtCategory = category === "skirts";
  const lengthTypeFieldLabel = "丈";
  const lengthTypeErrorKey = isSkirtCategory
    ? "spec.skirt.length_type"
    : "spec.bottoms.length_type";
  const currentLengthOptions = isSkirtCategory
    ? SKIRT_LENGTH_OPTIONS
    : BOTTOMS_LENGTH_OPTIONS;
  const currentLengthValue = isSkirtCategory
    ? skirtLengthType
    : bottomsLengthType;
  const isLengthTypeRequired = isSkirtCategory
    ? isSkirtLengthTypeRequired(category)
    : isBottomsLengthTypeRequired(category);
  const isLegwearSpecVisible =
    isLegwearSpecCategory(category) && Boolean(shape);
  const isLegwearCoverageSelectVisible = shouldShowLegwearCoverageSelect(
    category,
    shape,
    normalizedSubcategory,
  );
  const legwearCoverageOptions = useMemo(
    () => getLegwearCoverageOptions(shape, normalizedSubcategory),
    [normalizedSubcategory, shape],
  );
  const legwearCoverageFieldLabel = useMemo(
    () => getLegwearCoverageFieldLabel(shape, normalizedSubcategory),
    [normalizedSubcategory, shape],
  );
  const legwearCoveragePlaceholder = useMemo(
    () => getLegwearCoveragePlaceholder(shape, normalizedSubcategory),
    [normalizedSubcategory, shape],
  );
  const isLegwearCoverageRequired = isLegwearCoverageTypeRequired(
    category,
    shape,
    normalizedSubcategory,
  );
  const baseShapeOptions = useMemo(() => {
    if (!category) return [];
    return getItemShapeOptions(category, effectiveSubcategory);
  }, [category, effectiveSubcategory]);
  const shapeOptions = useMemo(() => {
    if (!shape || baseShapeOptions.some((item) => item.value === shape)) {
      return baseShapeOptions;
    }

    return [
      ...baseShapeOptions,
      {
        value: shape,
        label: findItemShapeLabel(category, shape),
      },
    ];
  }, [baseShapeOptions, category, shape]);
  const shouldShowSubcategoryField = useMemo(
    () => shouldShowItemSubcategoryField(category),
    [category],
  );
  const shouldUseRadioSubcategoryField = useMemo(
    () => shouldUseItemSubcategoryRadioField(category),
    [category],
  );
  const subcategoryOptions = useMemo(
    () =>
      shouldShowSubcategoryField ? getItemSubcategoryOptions(category) : [],
    [category, shouldShowSubcategoryField],
  );
  const isSubcategoryRequired =
    shouldShowSubcategoryField && isItemSubcategoryRequired(category);
  const topsShapeOptions = useMemo(
    () => getTopsShapeOptions(effectiveSubcategory),
    [effectiveSubcategory],
  );
  const currentShapeOptions = isTopsCategory ? topsShapeOptions : shapeOptions;
  const currentShapeValue = isTopsCategory ? topsShape : shape;
  const isShapeRequired = useMemo(
    () => isItemShapeRequired(category, normalizedSubcategory),
    [category, normalizedSubcategory],
  );
  const isShapeAutoSelected =
    currentShapeOptions.length === 1 &&
    currentShapeOptions[0]?.value === currentShapeValue;
  const shouldShowShapeField = shouldShowItemShapeField(
    category,
    effectiveSubcategory,
  );

  const selectedMainColor = useMemo(() => {
    if (useCustomMainColor) {
      return {
        label: "カスタムカラー",
        hex: customMainHex,
      };
    }

    return ITEM_COLORS.find((color) => color.value === mainColor) ?? null;
  }, [useCustomMainColor, customMainHex, mainColor]);

  const selectedSubColor = useMemo(() => {
    if (useCustomSubColor) {
      return {
        label: "カスタムカラー",
        hex: customSubHex,
      };
    }

    return ITEM_COLORS.find((color) => color.value === subColor) ?? null;
  }, [useCustomSubColor, customSubHex, subColor]);

  const topsRule = useMemo(() => {
    if (!isTopsCategory || !topsShape) return null;
    return TOPS_RULES[topsShape];
  }, [isTopsCategory, topsShape]);

  const availableTopsSleeves = useMemo(() => {
    if (!topsRule) return [];
    return TOPS_SLEEVES.filter((item) => topsRule.sleeves.includes(item.value));
  }, [topsRule]);

  const availableTopsLengths = useMemo(() => {
    if (!topsRule) return [];
    return TOPS_LENGTHS.filter((item) => topsRule.lengths.includes(item.value));
  }, [topsRule]);

  const availableTopsNecks = useMemo(() => {
    if (!topsRule) return [];
    return TOPS_NECKS.filter((item) => topsRule.necks.includes(item.value));
  }, [topsRule]);

  const availableTopsDesigns = useMemo(() => {
    if (!topsRule) return [];
    return TOPS_DESIGNS.filter((item) => topsRule.designs.includes(item.value));
  }, [topsRule]);

  const availableTopsFits = useMemo(() => {
    if (!topsRule) return [];
    return TOPS_FITS.filter((item) => topsRule.fits.includes(item.value));
  }, [topsRule]);
  const shouldShowTopsSleeveField = availableTopsSleeves.length > 1;
  const shouldShowTopsLengthField = availableTopsLengths.length > 1;
  const shouldShowTopsNeckField = availableTopsNecks.length > 1;
  const shouldShowTopsDesignField = availableTopsDesigns.length > 1;
  const shouldShowTopsFitField =
    availableTopsFits.length > 1 && topsShape !== "tanktop";
  const isTopsDetailsVisible =
    shouldShowTopsSleeveField ||
    shouldShowTopsLengthField ||
    shouldShowTopsNeckField ||
    shouldShowTopsDesignField ||
    shouldShowTopsFitField;
  const resolvedSizeDetailsShape = useMemo(
    () =>
      resolveItemShapeForSubmit(
        category,
        normalizedSubcategory,
        currentShapeValue,
      ),
    [category, currentShapeValue, normalizedSubcategory],
  );
  const structuredSizeFieldDefinitions = useMemo(
    () =>
      getStructuredSizeFieldDefinitionsFromContext({
        category,
        shape: resolvedSizeDetailsShape,
      }),
    [category, resolvedSizeDetailsShape],
  );
  const sizeDetailDuplicateWarnings = useMemo(
    () =>
      buildSizeDetailDuplicateWarnings(
        structuredSizeFieldDefinitions,
        customSizeFields.map((field) => field.label),
      ),
    [customSizeFields, structuredSizeFieldDefinitions],
  );
  const materialValidationPreview = useMemo(
    () => validateItemMaterials(materialRows),
    [materialRows],
  );

  const applyDraftColors = useCallback((draftColors: ItemFormColor[]) => {
    const mainDraftColor = draftColors.find((color) => color.role === "main");
    const subDraftColor = draftColors.find((color) => color.role === "sub");

    setMainColorCustomLabel(mainDraftColor?.custom_label ?? "");

    if (mainDraftColor?.mode === "custom") {
      setUseCustomMainColor(true);
      setCustomMainHex(mainDraftColor.hex || mainDraftColor.value || "#3B82F6");
      setMainColor("");
    } else {
      setUseCustomMainColor(false);
      setCustomMainHex("#3B82F6");
      setMainColor((mainDraftColor?.value as ItemColorValue | undefined) ?? "");
    }

    if (subDraftColor?.mode === "custom") {
      setUseCustomSubColor(true);
      setCustomSubHex(subDraftColor.hex || subDraftColor.value || "#3B82F6");
      setSubColor("");
    } else {
      setUseCustomSubColor(false);
      setCustomSubHex("#3B82F6");
      setSubColor((subDraftColor?.value as ItemColorValue | undefined) ?? "");
    }
  }, []);

  const applyDraftBaseFields = useCallback(
    (draft: {
      name: string;
      brandName?: string | null;
      price?: number | null;
      purchaseUrl?: string | null;
      memo?: string | null;
      purchasedAt?: string | null;
      sizeGender?: "women" | "men" | "unisex" | null;
      sizeLabel?: string | null;
      sizeNote?: string | null;
      sizeDetails?: CreateItemPayload["size_details"];
      isRainOk: boolean;
      sheerness?: ItemSheerness | null;
      category: string;
      subcategory?: string | null;
      shape: string;
      colors: ItemFormColor[];
      seasons: string[];
      tpos: string[];
      materials: CreateItemPayload["materials"];
      spec?: CreateItemPayload["spec"];
    }) => {
      setName(draft.name);
      setBrandName(draft.brandName ?? "");
      setPrice(
        draft.price === null || draft.price === undefined
          ? ""
          : String(draft.price),
      );
      setPurchaseUrl(draft.purchaseUrl ?? "");
      setMemo(draft.memo ?? "");
      setPurchasedAt(draft.purchasedAt ?? "");
      setSizeGender(draft.sizeGender ?? "");
      setSizeLabel(draft.sizeLabel ?? "");
      setSizeNote(draft.sizeNote ?? "");

      const normalizedSizeDetails = normalizeItemSizeDetails(draft.sizeDetails);
      setStructuredSizeValues(
        Object.fromEntries(
          Object.entries(normalizedSizeDetails?.structured ?? {}).map(
            ([fieldName, fieldValue]) => [
              fieldName,
              buildEditableSizeDetailValue(fieldValue),
            ],
          ),
        ) as Partial<Record<StructuredSizeFieldName, EditableSizeDetailValue>>,
      );
      setCustomSizeFields(
        (normalizedSizeDetails?.custom_fields ?? []).map((field, index) => ({
          id: `draft-size-field-${index}`,
          label: field.label,
          ...buildEditableSizeDetailValue(field),
        })),
      );

      setIsRainOk(draft.isRainOk);
      setCareStatus("");
      setSheerness(draft.sheerness ?? "");
      setCategory(draft.category as ItemCategory);
      setSubcategory(
        resolveCurrentItemSubcategoryValue(
          draft.category,
          draft.shape,
          draft.subcategory,
        ) ?? "",
      );
      setShape(draft.shape);
      setTopsShape((draft.shape as TopsShapeValue | undefined) || "");
      setTopsSleeve(
        (draft.spec?.tops?.sleeve as TopsSleeveValue | undefined) ?? "",
      );
      setTopsLength(
        (draft.spec?.tops?.length as TopsLengthValue | undefined) ?? "",
      );
      setTopsNeck((draft.spec?.tops?.neck as TopsNeckValue | undefined) ?? "");
      setTopsDesign(
        (draft.spec?.tops?.design as TopsDesignValue | undefined) ?? "",
      );
      setTopsFit(
        (draft.spec?.tops?.fit as TopsFitValue | undefined) ?? DEFAULT_TOPS_FIT,
      );
      setBottomsLengthType(
        (resolveBottomsLengthType(
          draft.spec?.bottoms?.length_type ?? null,
        ) as BottomsLengthType | null) ?? "",
      );
      setBottomsRiseType(
        (draft.spec?.bottoms?.rise_type as BottomsRiseType | undefined) ?? "",
      );
      setSkirtLengthType(
        (draft.spec?.skirt?.length_type as SkirtLengthType | undefined) ?? "",
      );
      setSkirtMaterialType(
        (draft.spec?.skirt?.material_type as SkirtMaterialType | undefined) ??
          "",
      );
      setSkirtDesignType(
        (draft.spec?.skirt?.design_type as SkirtDesignType | undefined) ?? "",
      );
      setLegwearCoverageType(
        (resolveLegwearCoverageType(
          draft.category,
          draft.shape,
          draft.spec?.legwear?.coverage_type ?? null,
          draft.subcategory,
        ) as LegwearCoverageType | null) ?? "",
      );
      setSelectedSeasons(draft.seasons);
      setDraftTpoNames(draft.tpos);
      setSelectedTpoIds([]);
      setMaterialRows(buildEditableItemMaterials(draft.materials ?? []));
      applyDraftColors(draft.colors);
    },
    [applyDraftColors],
  );

  useEffect(() => {
    let active = true;

    const isUnauthorized = (error: unknown): boolean =>
      error instanceof ApiClientError && error.status === 401;

    Promise.allSettled([
      fetchCategoryGroups(),
      fetchCategoryVisibilitySettings(),
      fetchUserTpos(true),
    ]).then(([groupsResult, settingsResult, tpoResult]) => {
      if (!active) return;

      if (
        (settingsResult.status === "rejected" &&
          isUnauthorized(settingsResult.reason)) ||
        (tpoResult.status === "rejected" && isUnauthorized(tpoResult.reason))
      ) {
        router.push("/login");
        return;
      }

      if (
        groupsResult.status === "fulfilled" &&
        settingsResult.status === "fulfilled"
      ) {
        const nextOptions = buildSupportedCategoryOptions(
          groupsResult.value,
          settingsResult.value.visibleCategoryIds,
        );
        setCategoryOptions(nextOptions);
      }

      if (tpoResult.status === "fulfilled") {
        setTpoOptions(tpoResult.value.tpos);
        setTpoLoadError(null);
      } else {
        setTpoOptions([]);
        setTpoLoadError(
          "TPO の取得に失敗しました。再読み込みしても改善しない場合は設定を確認してください。",
        );
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!isItemDraftSource) {
      return;
    }

    const draft = loadItemDuplicatePayload();

    if (!draft) {
      return;
    }

    setSourcePurchaseCandidateId(null);
    setVariantSourceItemId(draft.variant_source_item_id ?? null);
    setSaveBrandAsCandidate(false);
    setPendingImages([]);
    applyDraftBaseFields({
      name: draft.name,
      brandName: draft.brand_name,
      price: draft.price,
      purchaseUrl: draft.purchase_url,
      memo: draft.memo,
      purchasedAt: draft.purchased_at,
      sizeGender: draft.size_gender,
      sizeLabel: draft.size_label,
      sizeNote: draft.size_note,
      sizeDetails: draft.size_details,
      isRainOk: draft.is_rain_ok,
      sheerness: draft.sheerness ?? null,
      category: draft.category,
      subcategory: draft.subcategory ?? null,
      shape: draft.shape,
      colors: draft.colors,
      seasons: draft.seasons,
      tpos: draft.tpos ?? [],
      materials: draft.materials ?? [],
      spec: draft.spec ?? null,
    });
    setItemImages(normalizeItemImages(draft.images ?? []));
    setDraftInfoMessage(
      isColorVariantSource
        ? "元データの情報を引き継いでいます。黄色で示した項目は、必要に応じて見直してください。色違い追加では、新しい色を選択してください。"
        : "元データの情報を引き継いでいます。黄色で示した項目は、必要に応じて見直してください。",
    );

    clearItemDuplicatePayload();
  }, [applyDraftBaseFields, isColorVariantSource, isItemDraftSource]);

  useEffect(() => {
    if (!isPurchaseCandidateSource) {
      return;
    }

    const payload = loadPurchaseCandidateItemDraft();

    if (!payload) {
      return;
    }

    const draft = mapPurchaseCandidateItemDraft(payload);
    const mainDraftColor = draft.colors.find((color) => color.role === "main");
    const subDraftColor = draft.colors.find((color) => color.role === "sub");

    setName(draft.name);
    setSourcePurchaseCandidateId(draft.sourceCandidateId);
    setBrandName(draft.brandName ?? "");
    setPrice(draft.price === null ? "" : String(draft.price));
    setPurchaseUrl(draft.purchaseUrl ?? "");
    setMemo(draft.memo ?? "");
    setPurchasedAt(draft.purchasedAt ?? "");
    setSizeGender(draft.sizeGender ?? "");
    setSizeLabel(draft.sizeLabel ?? "");
    setSizeNote(draft.sizeNote ?? "");
    const normalizedSizeDetails = normalizeItemSizeDetails(draft.sizeDetails);
    setStructuredSizeValues(
      Object.fromEntries(
        Object.entries(normalizedSizeDetails?.structured ?? {}).map(
          ([fieldName, fieldValue]) => [
            fieldName,
            buildEditableSizeDetailValue(fieldValue),
          ],
        ),
      ) as Partial<Record<StructuredSizeFieldName, EditableSizeDetailValue>>,
    );
    setCustomSizeFields(
      (normalizedSizeDetails?.custom_fields ?? []).map((field, index) => ({
        id: `draft-size-field-${index}`,
        label: field.label,
        ...buildEditableSizeDetailValue(field),
      })),
    );
    setIsRainOk(draft.isRainOk);
    setSheerness(draft.sheerness ?? "");
    setCategory(draft.category as ItemCategory);
    setSubcategory(
      resolveCurrentItemSubcategoryValue(
        draft.category,
        draft.shape,
        draft.subcategory,
      ) ?? "",
    );
    setShape(draft.shape);
    setMainColorCustomLabel(mainDraftColor?.custom_label ?? "");
    // `shape` を分類軸の正本として復元する。
    setTopsShape((draft.shape as TopsShapeValue | undefined) || "");
    setTopsSleeve(
      (draft.spec?.tops?.sleeve as TopsSleeveValue | undefined) ?? "",
    );
    setTopsLength(
      (draft.spec?.tops?.length as TopsLengthValue | undefined) ?? "",
    );
    setTopsNeck((draft.spec?.tops?.neck as TopsNeckValue | undefined) ?? "");
    setTopsDesign(
      (draft.spec?.tops?.design as TopsDesignValue | undefined) ?? "",
    );
    setTopsFit(
      (draft.spec?.tops?.fit as TopsFitValue | undefined) ?? DEFAULT_TOPS_FIT,
    );
    setBottomsLengthType(
      (resolveBottomsLengthType(
        draft.spec?.bottoms?.length_type ?? null,
      ) as BottomsLengthType | null) ?? "",
    );
    setBottomsRiseType(
      (draft.spec?.bottoms?.rise_type as BottomsRiseType | undefined) ?? "",
    );
    setLegwearCoverageType(
      (resolveLegwearCoverageType(
        draft.category,
        draft.shape,
        draft.spec?.legwear?.coverage_type ?? null,
        draft.subcategory,
      ) as LegwearCoverageType | null) ?? "",
    );
    setSelectedSeasons(draft.seasons);
    setDraftTpoNames(draft.tpos);
    setMaterialRows(buildEditableItemMaterials(draft.materials));
    setMainColor((mainDraftColor?.value as ItemColorValue | undefined) ?? "");
    setSubColor((subDraftColor?.value as ItemColorValue | undefined) ?? "");
    setItemImages(mapPurchaseCandidateImagesToItemImages(draft.images));
    setDraftInfoMessage("購入検討の内容を初期値として読み込みました。");

    clearPurchaseCandidateItemDraft();
  }, [applyDraftBaseFields, isPurchaseCandidateSource]);

  useEffect(() => {
    if (
      draftTpoNames.length === 0 ||
      tpoOptions.length === 0 ||
      selectedTpoIds.length > 0
    ) {
      return;
    }

    const matchedIds = tpoOptions
      .filter((tpo) => draftTpoNames.includes(tpo.name))
      .map((tpo) => tpo.id);

    setSelectedTpoIds(matchedIds);
  }, [draftTpoNames, selectedTpoIds.length, tpoOptions]);

  useEffect(() => {
    if ((category !== "swimwear" && category !== "kimono") || subcategory) {
      return;
    }

    const defaultSubcategory = resolveItemSubcategoryForForm(
      category,
      subcategory,
    );

    if (!defaultSubcategory) {
      return;
    }

    setSubcategory(defaultSubcategory);
    clearErrorsFor(["subcategory"]);
  }, [category, subcategory]);

  useEffect(() => {
    if (!category || !subcategory) {
      return;
    }

    if (isTopsCategory) {
      const allowedValues = topsShapeOptions.map((item) => item.value);
      const nextShape = allowedValues[0] ?? "";

      if (allowedValues.length === 1 && topsShape !== nextShape) {
        const rule = TOPS_RULES[nextShape];
        setTopsShape(nextShape as TopsShapeValue);
        setTopsSleeve(rule?.defaults?.sleeve ?? "");
        setTopsLength(rule?.defaults?.length ?? "");
        setTopsNeck(rule?.defaults?.neck ?? "");
        setTopsDesign(rule?.defaults?.design ?? "");
        setTopsFit(rule?.defaults?.fit ?? DEFAULT_TOPS_FIT);
        setShape(nextShape);
        clearErrorsFor(["shape"]);
        return;
      }

      if (topsShape && !allowedValues.includes(topsShape)) {
        if (!nextShape) {
          resetTopsState();
          setShape("");
        } else {
          const rule = TOPS_RULES[nextShape];
          setTopsShape(nextShape as TopsShapeValue);
          setTopsSleeve(rule?.defaults?.sleeve ?? "");
          setTopsLength(rule?.defaults?.length ?? "");
          setTopsNeck(rule?.defaults?.neck ?? "");
          setTopsDesign(rule?.defaults?.design ?? "");
          setTopsFit(rule?.defaults?.fit ?? DEFAULT_TOPS_FIT);
          setShape(nextShape);
        }
        clearErrorsFor(["shape"]);
      }

      return;
    }

    const allowedValues = baseShapeOptions.map((item) => item.value);
    const nextShape = allowedValues[0] ?? "";
    const emptyOptionFallbackShape =
      category === "inner" && normalizedSubcategory === "other"
        ? "roomwear"
        : "";

    if (allowedValues.length === 0) {
      if (emptyOptionFallbackShape) {
        if (shape !== emptyOptionFallbackShape) {
          setShape(emptyOptionFallbackShape);
          clearErrorsFor(["shape", "spec.legwear.coverage_type"]);
          resetLegwearSpecState();
        }
        return;
      }

      if (shape) {
        setShape("");
        clearErrorsFor(["shape", "spec.legwear.coverage_type"]);
        resetLegwearSpecState();
      }
      return;
    }

    if (allowedValues.length === 1 && shape !== nextShape) {
      setShape(nextShape);
      clearErrorsFor(["shape", "spec.legwear.coverage_type"]);
      if (isLegwearSpecCategory(category)) {
        setLegwearCoverageType(
          (resolveLegwearCoverageType(
            category,
            nextShape,
            legwearCoverageType,
            normalizedSubcategory,
          ) as LegwearCoverageType | null) ?? "",
        );
      } else {
        resetLegwearSpecState();
      }
      return;
    }

    if (
      shape &&
      !allowedValues.includes(shape as (typeof allowedValues)[number])
    ) {
      setShape(nextShape);
      clearErrorsFor(["shape", "spec.legwear.coverage_type"]);
      if (isLegwearSpecCategory(category) && nextShape) {
        setLegwearCoverageType(
          (resolveLegwearCoverageType(
            category,
            nextShape,
            legwearCoverageType,
            normalizedSubcategory,
          ) as LegwearCoverageType | null) ?? "",
        );
      } else {
        resetLegwearSpecState();
      }
    }
  }, [
    category,
    legwearCoverageType,
    isTopsCategory,
    normalizedSubcategory,
    shape,
    baseShapeOptions,
    subcategory,
    topsShape,
    topsShapeOptions,
  ]);

  function resetTopsState() {
    setTopsShape("");
    setTopsSleeve("");
    setTopsLength("");
    setTopsNeck("");
    setTopsDesign("");
    setTopsFit(DEFAULT_TOPS_FIT);
  }

  function resetBottomsSpecState() {
    setBottomsLengthType("");
    setSkirtLengthType("");
    setSkirtMaterialType("");
    setSkirtDesignType("");
    setBottomsRiseType("");
  }

  function resetLegwearSpecState() {
    setLegwearCoverageType("");
  }

  function clearErrorsFor(keys: string[]) {
    setErrors((current) => {
      const next = { ...current };
      keys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
  }

  function handleCategoryChange(nextCategory: string) {
    setCategory(nextCategory as ItemCategory | "");
    setSubcategory(resolveItemSubcategoryForForm(nextCategory, null) ?? "");
    setShape("");
    clearErrorsFor([
      "subcategory",
      "shape",
      "spec.bottoms.length_type",
      "spec.skirt.length_type",
      "spec.bottoms.rise_type",
      "spec.legwear.coverage_type",
    ]);

    if (nextCategory !== "tops") {
      resetTopsState();
    }
    if (!isBottomsSpecCategory(nextCategory)) {
      resetBottomsSpecState();
    }
    if (!isLegwearSpecCategory(nextCategory)) {
      resetLegwearSpecState();
    }
  }

  function handleSubcategoryChange(nextSubcategory: string) {
    if (nextSubcategory === "other") {
      if (category === "tops") {
        resetTopsState();
      }

      if (category === "skirts") {
        setShape("");
      }

      setShape("");
    }

    setSubcategory(nextSubcategory);
    clearErrorsFor(["subcategory", "shape"]);
  }

  function handleTopsShapeChange(nextShape: string) {
    const value = nextShape as TopsShapeValue | "";
    setTopsShape(value);

    if (!value) {
      setTopsSleeve("");
      setTopsLength("");
      setTopsNeck("");
      setTopsDesign("");
      setTopsFit(DEFAULT_TOPS_FIT);
      setShape("");
      clearErrorsFor(["shape"]);
      return;
    }

    const rule = TOPS_RULES[value];
    setTopsSleeve(rule.defaults?.sleeve ?? "");
    setTopsLength(rule.defaults?.length ?? "");
    setTopsNeck(rule.defaults?.neck ?? "");
    setTopsDesign(rule.defaults?.design ?? "");
    setTopsFit(rule.defaults?.fit ?? DEFAULT_TOPS_FIT);
    setShape(value);
    clearErrorsFor(["shape"]);
  }

  function handleShapeChange(nextShape: string) {
    setShape(nextShape);
    clearErrorsFor(["shape", "spec.legwear.coverage_type"]);

    if (!isLegwearSpecCategory(category)) {
      resetLegwearSpecState();
      return;
    }

    setLegwearCoverageType(
      (resolveLegwearCoverageType(
        category,
        nextShape,
        legwearCoverageType,
        normalizedSubcategory,
      ) as LegwearCoverageType | null) ?? "",
    );
  }

  function toggleValue<T>(
    value: T,
    current: T[],
    setter: (values: T[]) => void,
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

  function createCustomSizeField(): EditableCustomSizeField {
    return {
      id: `size-field-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      label: "",
      ...createEmptyEditableSizeDetailValue(),
    };
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

  function updateCustomSizeField(
    fieldId: string,
    key: "label" | keyof ItemSizeDetailValue,
    value: string,
  ) {
    setCustomSizeFields((current) =>
      current.map((field) =>
        field.id === fieldId
          ? key === "label"
            ? { ...field, label: value }
            : { ...field, ...normalizeEditableSizeValue(field, key, value) }
          : field,
      ),
    );
  }

  function addCustomSizeField() {
    setCustomSizeFields((current) => [...current, createCustomSizeField()]);
  }

  function removeCustomSizeField(fieldId: string) {
    setCustomSizeFields((current) =>
      current.filter((field) => field.id !== fieldId),
    );
  }

  function buildPayload(): CreateItemPayload {
    const colors: ItemFormColor[] = [];

    if (selectedMainColor) {
      colors.push({
        role: "main",
        mode: useCustomMainColor ? "custom" : "preset",
        value: useCustomMainColor ? customMainHex : mainColor,
        hex: selectedMainColor.hex,
        label: selectedMainColor.label,
        custom_label: mainColorCustomLabel.trim() || null,
      });
    }

    if (selectedSubColor) {
      colors.push({
        role: "sub",
        mode: useCustomSubColor ? "custom" : "preset",
        value: useCustomSubColor ? customSubHex : subColor,
        hex: selectedSubColor.hex,
        label: selectedSubColor.label,
      });
    }

    const resolvedLegwearCoverageType = resolveLegwearCoverageType(
      category,
      shape,
      legwearCoverageType,
      normalizedSubcategory,
    );
    const materials = validateItemMaterials(materialRows).payload;
    const skirtSpecPayload =
      category === "skirts" &&
      (skirtLengthType || skirtMaterialType || skirtDesignType)
        ? {
            length_type: skirtLengthType || undefined,
            material_type: skirtMaterialType || undefined,
            design_type: skirtDesignType || undefined,
          }
        : null;
    const submitShape = buildItemShapeForSubmit(
      category,
      normalizedSubcategory,
      currentShapeValue,
    );
    const submitSpec = buildItemSpecForSubmit({
      category,
      tops: isTopsCategory
        ? {
            sleeve: topsSleeve || null,
            length: topsLength || null,
            neck: topsNeck || null,
            design: topsDesign || null,
            fit: topsFit || null,
          }
        : null,
      bottoms:
        isBottomsSpecVisible && (bottomsLengthType || bottomsRiseType)
          ? {
              length_type: bottomsLengthType || undefined,
              rise_type:
                category === "pants" ? bottomsRiseType || undefined : undefined,
            }
          : null,
      skirt: skirtSpecPayload,
      legwear: resolvedLegwearCoverageType
        ? {
            coverage_type: resolvedLegwearCoverageType,
          }
        : null,
    });

    return {
      name,
      purchase_candidate_id: sourcePurchaseCandidateId,
      variant_source_item_id: variantSourceItemId,
      brand_name: brandName.trim() || null,
      save_brand_as_candidate: saveBrandAsCandidate,
      price: price === "" ? null : Number(price),
      purchase_url: purchaseUrl.trim() || null,
      memo: memo.trim() || null,
      care_status: careStatus || null,
      sheerness: sheerness || null,
      purchased_at: purchasedAt || null,
      size_gender: sizeGender || null,
      size_label: sizeLabel.trim() || null,
      size_note: sizeNote.trim() || null,
      size_details: buildItemSizeDetailsPayload(
        structuredSizeFieldDefinitions,
        structuredSizeValues,
        customSizeFields,
      ),
      is_rain_ok: isRainOk,
      category,
      subcategory: normalizedSubcategory,
      shape: submitShape,
      colors,
      seasons: selectedSeasons,
      tpo_ids: selectedTpoIds,
      materials,
      spec: submitSpec,
      images: itemImages,
    };
  }

  async function uploadPendingImages(targetItemId: number) {
    for (let index = 0; index < pendingImages.length; index += 1) {
      const image = pendingImages[index];
      const formData = new FormData();
      formData.set("image", image);
      formData.set("sort_order", String(itemImages.length + index + 1));
      if (itemImages.length === 0 && index === 0) {
        formData.set("is_primary", "1");
      }

      const uploadResponse = await fetch(`/api/items/${targetItemId}/images`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("IMAGE_UPLOAD_FAILED");
      }
    }
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {
      ...materialValidationPreview.errors,
    };
    const resolvedLegwearCoverageType = resolveLegwearCoverageType(
      category,
      shape,
      legwearCoverageType,
      normalizedSubcategory,
    );

    if (!category) nextErrors.category = "カテゴリを選択してください。";
    if (isSubcategoryRequired && !normalizedSubcategory) {
      nextErrors.subcategory = "種類を選択してください。";
    }
    if (isShapeRequired && !currentShapeValue) {
      nextErrors.shape = "形を選択してください。";
    }
    if (!selectedMainColor)
      nextErrors.mainColor = "メインカラーを選択してください。";
    if (selectedMainColor && mainColorCustomLabel.trim().length > 50) {
      nextErrors.main_color_custom_label =
        "色名は50文字以内で入力してください。";
    }
    if (isBottomsLengthTypeRequired(category) && !bottomsLengthType) {
      nextErrors["spec.bottoms.length_type"] = "丈を選択してください。";
    }
    if (isSkirtLengthTypeRequired(category) && !skirtLengthType) {
      nextErrors["spec.skirt.length_type"] = "丈を選択してください。";
    }
    if (
      isLegwearCoverageTypeRequired(category, shape, normalizedSubcategory) &&
      !resolvedLegwearCoverageType
    ) {
      nextErrors["spec.legwear.coverage_type"] =
        "レッグウェアの種類を選択してください。";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
    }
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm()) return;

    setSubmitting(true);
    let createdItemId: number | null = null;

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setSubmitError("ログインが必要です。再度ログインしてください。");
        setTimeout(() => router.push("/login"), 800);
        return;
      }

      if (!response.ok) {
        const nextErrors = flattenApiErrors(data?.errors);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          scrollToFirstError(nextErrors);
          setSubmitError("入力内容を確認してください。");
          return;
        }
        setSubmitError(
          getUserFacingSubmitErrorMessage(
            data,
            "アイテムの登録に失敗しました。時間をおいて再度お試しください。",
          ),
        );
        return;
      }

      createdItemId = typeof data?.item?.id === "number" ? data.item.id : null;

      if (createdItemId !== null && pendingImages.length > 0) {
        await uploadPendingImages(createdItemId);
      }

      setSubmitSuccess("アイテムを登録しました。");
      setTimeout(() => {
        router.push("/items");
        router.refresh();
      }, 800);
    } catch (error) {
      if (
        createdItemId !== null &&
        error instanceof Error &&
        error.message === "IMAGE_UPLOAD_FAILED"
      ) {
        setSubmitError(
          "アイテムは登録済みですが、画像の追加に失敗しました。時間をおいて再度お試しください。",
        );
        setTimeout(() => {
          router.push(`/items/${createdItemId}/edit`);
          router.refresh();
        }, 1200);
        return;
      }

      setSubmitError(
        "アイテムの登録に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const shouldShowDetailsSection =
    isTopsCategory || isBottomsSpecVisible || isLegwearCoverageSelectVisible;

  function scrollToFirstError(nextErrors: Record<string, string>) {
    const errorOrder = [
      "category",
      "shape",
      "spec.skirt.length_type",
      "spec.bottoms.length_type",
      "spec.legwear.coverage_type",
      "mainColor",
      "materials",
    ];
    const firstErrorKey = errorOrder.find((key) => nextErrors[key]);
    if (!firstErrorKey) return;

    const target = document.querySelector<HTMLElement>(
      `[data-error-key="${firstErrorKey}"]`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  function flattenApiErrors(rawErrors: unknown): Record<string, string> {
    if (!rawErrors || typeof rawErrors !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(rawErrors as Record<string, unknown>)
        .map(([key, value]) => {
          if (Array.isArray(value) && typeof value[0] === "string") {
            return [key, value[0]];
          }

          if (typeof value === "string") {
            return [key, value];
          }

          return null;
        })
        .filter((entry): entry is [string, string] => entry !== null),
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 pb-28 md:p-10 md:pb-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <FormPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "アイテム一覧", href: "/items" },
            { label: "新規作成" },
          ]}
          eyebrow="アイテム管理"
          title="新規作成"
          description="基本情報や分類を入力して、新しいアイテムを登録します。"
          actions={
            <Link
              href={cancelHref}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {backLinkLabel}
            </Link>
          }
        />

        {draftInfoMessage && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 shadow-sm">
            <div className="flex items-start gap-3">
              <TriangleAlert
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <p>{draftInfoMessage}</p>
            </div>
          </section>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
            <ItemFormSection title="基本情報" className="lg:col-span-2">
              <div>
                <FieldLabel htmlFor="name" label="名前" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <BrandNameField
                inputId="brand-name"
                value={brandName}
                onChange={setBrandName}
                saveAsCandidate={saveBrandAsCandidate}
                onSaveAsCandidateChange={setSaveBrandAsCandidate}
                disabled={submitting}
              />
            </ItemFormSection>

            <ItemClassificationGroup
              className="lg:col-span-2"
              attributeSection={
                shouldShowDetailsSection ? (
                  <div className="space-y-4">
                    {isTopsCategory && isTopsDetailsVisible && (
                      <div className="space-y-4 rounded-xl border border-gray-200/80 bg-gray-50/70 p-4">
                        <h3 className="text-sm font-medium text-gray-900">
                          仕様・属性
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {shouldShowTopsSleeveField ? (
                            <div>
                              <label
                                htmlFor="tops-sleeve"
                                className="mb-1 block text-sm font-medium text-gray-700"
                              >
                                袖
                              </label>
                              <select
                                id="tops-sleeve"
                                value={topsSleeve}
                                onChange={(e) =>
                                  setTopsSleeve(
                                    e.target.value as TopsSleeveValue | "",
                                  )
                                }
                                disabled={!topsShape}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="">選択してください</option>
                                {availableTopsSleeves.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}

                          {shouldShowTopsLengthField ? (
                            <div>
                              <label
                                htmlFor="tops-length"
                                className="mb-1 block text-sm font-medium text-gray-700"
                              >
                                丈
                              </label>
                              <select
                                id="tops-length"
                                value={topsLength}
                                onChange={(e) =>
                                  setTopsLength(
                                    e.target.value as TopsLengthValue | "",
                                  )
                                }
                                disabled={!topsShape}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="">選択してください</option>
                                {availableTopsLengths.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}

                          {shouldShowTopsNeckField ? (
                            <div>
                              <label
                                htmlFor="tops-neck"
                                className="mb-1 block text-sm font-medium text-gray-700"
                              >
                                首回り
                              </label>
                              <select
                                id="tops-neck"
                                value={topsNeck}
                                onChange={(e) =>
                                  setTopsNeck(
                                    e.target.value as TopsNeckValue | "",
                                  )
                                }
                                disabled={!topsShape}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="">選択してください</option>
                                {availableTopsNecks.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}

                          {shouldShowTopsDesignField ? (
                            <div>
                              <label
                                htmlFor="tops-design"
                                className="mb-1 block text-sm font-medium text-gray-700"
                              >
                                デザイン
                              </label>
                              <select
                                id="tops-design"
                                value={topsDesign}
                                onChange={(e) =>
                                  setTopsDesign(
                                    e.target.value as TopsDesignValue | "",
                                  )
                                }
                                disabled={!topsShape}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="">選択してください</option>
                                {availableTopsDesigns.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}

                          {shouldShowTopsFitField ? (
                            <div>
                              <label
                                htmlFor="tops-fit"
                                className="mb-1 block text-sm font-medium text-gray-700"
                              >
                                シルエット
                              </label>
                              <select
                                id="tops-fit"
                                value={topsFit}
                                onChange={(e) =>
                                  setTopsFit(e.target.value as TopsFitValue)
                                }
                                disabled={!topsShape}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              >
                                {availableTopsFits.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                    {isBottomsSpecVisible ? (
                      <div className="space-y-4 rounded-xl border border-gray-200/80 bg-gray-50/70 p-4">
                        <h3 className="text-sm font-medium text-gray-900">
                          仕様・属性
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 md:items-start">
                          <div>
                            <FieldLabel
                              htmlFor="bottoms-length-type"
                              label={lengthTypeFieldLabel}
                              required={isLengthTypeRequired}
                            />
                            <select
                              id="bottoms-length-type"
                              value={currentLengthValue}
                              onChange={(e) => {
                                if (isSkirtCategory) {
                                  setSkirtLengthType(
                                    e.target.value as SkirtLengthType | "",
                                  );
                                } else {
                                  setBottomsLengthType(
                                    e.target.value as BottomsLengthType | "",
                                  );
                                }
                              }}
                              onBlur={() =>
                                clearErrorsFor([lengthTypeErrorKey])
                              }
                              onChangeCapture={() =>
                                clearErrorsFor([lengthTypeErrorKey])
                              }
                              className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors[lengthTypeErrorKey] ? "border-red-400" : "border-gray-300"}`}
                            >
                              <option value="">選択してください</option>
                              {currentLengthOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                            {errors[lengthTypeErrorKey] && (
                              <p className="mt-2 text-sm text-red-600">
                                {errors[lengthTypeErrorKey]}
                              </p>
                            )}
                          </div>
                          {isSkirtCategory ? (
                            <>
                              <div>
                                <FieldLabel
                                  htmlFor="skirt-material-type"
                                  label="素材"
                                />
                                <select
                                  id="skirt-material-type"
                                  value={skirtMaterialType}
                                  onChange={(e) =>
                                    setSkirtMaterialType(
                                      e.target.value as SkirtMaterialType | "",
                                    )
                                  }
                                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                  <option value="">選択してください</option>
                                  {SKIRT_MATERIAL_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                      {item.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <FieldLabel
                                  htmlFor="skirt-design-type"
                                  label="デザイン"
                                />
                                <select
                                  id="skirt-design-type"
                                  value={skirtDesignType}
                                  onChange={(e) =>
                                    setSkirtDesignType(
                                      e.target.value as SkirtDesignType | "",
                                    )
                                  }
                                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                  <option value="">選択してください</option>
                                  {SKIRT_DESIGN_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                      {item.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </>
                          ) : null}

                          {isBottomsRiseTypeSupported(category) ? (
                            <div>
                              <FieldLabel
                                htmlFor="bottoms-rise-type"
                                label="股上"
                              />
                              <select
                                id="bottoms-rise-type"
                                value={bottomsRiseType}
                                onChange={(e) =>
                                  setBottomsRiseType(
                                    e.target.value as BottomsRiseType | "",
                                  )
                                }
                                onBlur={() =>
                                  clearErrorsFor(["spec.bottoms.rise_type"])
                                }
                                onChangeCapture={() =>
                                  clearErrorsFor(["spec.bottoms.rise_type"])
                                }
                                className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors["spec.bottoms.rise_type"] ? "border-red-400" : "border-gray-300"}`}
                              >
                                <option value="">股上を選択してください</option>
                                {BOTTOMS_RISE_OPTIONS.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                              {errors["spec.bottoms.rise_type"] && (
                                <p className="mt-2 text-sm text-red-600">
                                  {errors["spec.bottoms.rise_type"]}
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {isLegwearSpecVisible ? (
                      <div className="space-y-4 rounded-xl border border-gray-200/80 bg-gray-50/70 p-4">
                        <h3 className="text-sm font-medium text-gray-900">
                          仕様・属性
                        </h3>
                        {isLegwearCoverageSelectVisible ? (
                          <div className="grid gap-4 md:grid-cols-2 md:items-start">
                            <div data-error-key="spec.legwear.coverage_type">
                              <FieldLabel
                                htmlFor="legwear-coverage-type"
                                label={legwearCoverageFieldLabel}
                                required={isLegwearCoverageRequired}
                              />
                              <select
                                id="legwear-coverage-type"
                                value={legwearCoverageType}
                                onChange={(e) =>
                                  setLegwearCoverageType(
                                    e.target.value as LegwearCoverageType | "",
                                  )
                                }
                                onBlur={() =>
                                  clearErrorsFor(["spec.legwear.coverage_type"])
                                }
                                onChangeCapture={() =>
                                  clearErrorsFor(["spec.legwear.coverage_type"])
                                }
                                className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors["spec.legwear.coverage_type"] ? "border-red-400" : "border-gray-300"}`}
                              >
                                <option value="">
                                  {legwearCoveragePlaceholder}
                                </option>
                                {legwearCoverageOptions.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                              {errors["spec.legwear.coverage_type"] && (
                                <p className="mt-2 text-sm text-red-600">
                                  {errors["spec.legwear.coverage_type"]}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : undefined
              }
            >
              <div data-error-key="category">
                <FieldLabel htmlFor="category" label="カテゴリ" required />
                <select
                  id="category"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={getFormControlClassName({
                    invalid: Boolean(errors.category),
                  })}
                >
                  <option value="">選択してください</option>
                  {categoryOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-2 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {shouldShowSubcategoryField && subcategoryOptions.length > 0 ? (
                <div data-error-key="subcategory">
                  <FieldLabel
                    as={shouldUseRadioSubcategoryField ? "div" : "label"}
                    htmlFor={
                      shouldUseRadioSubcategoryField ? undefined : "subcategory"
                    }
                    label="種類"
                    required={isSubcategoryRequired}
                  />
                  {shouldUseRadioSubcategoryField ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {subcategoryOptions.map((item) => {
                        const inputId = `subcategory-${item.value}`;
                        return (
                          <label
                            key={item.value}
                            htmlFor={inputId}
                            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                              subcategory === item.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-300 bg-white text-gray-700"
                            }`}
                          >
                            <input
                              id={inputId}
                              type="radio"
                              name="subcategory"
                              value={item.value}
                              checked={subcategory === item.value}
                              onChange={(e) =>
                                handleSubcategoryChange(e.target.value)
                              }
                              disabled={!category}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <select
                      id="subcategory"
                      value={subcategory}
                      onChange={(e) => handleSubcategoryChange(e.target.value)}
                      disabled={!category}
                      className={getFormControlClassName({
                        invalid: Boolean(errors.subcategory),
                        disabled: true,
                      })}
                    >
                      <option value="">選択してください</option>
                      {subcategoryOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.subcategory && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.subcategory}
                    </p>
                  )}
                </div>
              ) : null}

              {shouldShowShapeField ? (
                <div data-error-key="shape">
                  <FieldLabel
                    htmlFor="shape"
                    label="形"
                    required={isShapeRequired && !isShapeAutoSelected}
                  />
                  <select
                    id="shape"
                    value={currentShapeValue}
                    onChange={(e) =>
                      isTopsCategory
                        ? handleTopsShapeChange(e.target.value)
                        : handleShapeChange(e.target.value)
                    }
                    disabled={
                      !category ||
                      currentShapeOptions.length === 0 ||
                      isShapeAutoSelected
                    }
                    className={getFormControlClassName({
                      invalid: Boolean(errors.shape),
                      disabled: true,
                    })}
                  >
                    <option value="">選択してください</option>
                    {currentShapeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {isShapeAutoSelected && (
                    <p className="mt-2 text-xs text-gray-500">
                      種類に応じて自動で設定されます。
                    </p>
                  )}
                  {errors.shape && (
                    <p className="mt-2 text-sm text-red-600">{errors.shape}</p>
                  )}
                </div>
              ) : null}
            </ItemClassificationGroup>

            <ItemFormSection title="色" className="lg:col-span-2">
              {isColorVariantSource ? (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-800">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <p>
                    色違い追加のため、色は未設定です。メインカラーを選択してください。
                  </p>
                </div>
              ) : null}
              <div className="grid gap-6 md:grid-cols-2">
                <div
                  className={`space-y-3 ${
                    isColorVariantSource
                      ? "rounded-xl border border-sky-200 bg-sky-50/40 p-4"
                      : ""
                  }`}
                  data-error-key="mainColor"
                >
                  <FieldLabel
                    as="div"
                    label="メインカラー"
                    required
                    className=""
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={useCustomMainColor}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUseCustomMainColor(checked);
                        if (checked) {
                          setCustomMainHex(
                            resolveCustomColorHex(mainColor, customMainHex),
                          );
                          setMainColor("");
                        }
                      }}
                      className="h-4 w-4"
                    />
                    カスタムカラーを使う
                  </label>

                  {useCustomMainColor ? (
                    <div
                      className={getFormControlWrapperClassName(
                        Boolean(errors.mainColor),
                        "gap-3 rounded-lg px-3 pr-3",
                      )}
                    >
                      <input
                        type="color"
                        value={customMainHex}
                        onChange={(e) => setCustomMainHex(e.target.value)}
                        className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
                      />
                      <input
                        type="text"
                        value={customMainHex}
                        onChange={(e) => setCustomMainHex(e.target.value)}
                        className="w-full border-0 bg-transparent px-2 text-gray-900 outline-none"
                      />
                    </div>
                  ) : (
                    <ColorSelect
                      value={mainColor}
                      onChange={setMainColor}
                      placeholder="選択してください"
                    />
                  )}
                  {errors.mainColor && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.mainColor}
                    </p>
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
                      onChange={(event) => {
                        setMainColorCustomLabel(event.target.value);
                        clearErrorsFor(["main_color_custom_label"]);
                      }}
                      placeholder="例: 00 WHITE / 31 BEIGE / 64 BLUE"
                      maxLength={50}
                      disabled={!selectedMainColor}
                      className={getFormControlClassName({
                        invalid: Boolean(errors.main_color_custom_label),
                        disabled: true,
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    サブカラー
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={useCustomSubColor}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUseCustomSubColor(checked);
                        if (checked) {
                          setCustomSubHex(
                            resolveCustomColorHex(subColor, customSubHex),
                          );
                          setSubColor("");
                        }
                      }}
                      className="h-4 w-4"
                    />
                    カスタムカラーを使う
                  </label>

                  {useCustomSubColor ? (
                    <div
                      className={getFormControlWrapperClassName(
                        false,
                        "gap-3 rounded-lg px-3 pr-3",
                      )}
                    >
                      <input
                        type="color"
                        value={customSubHex}
                        onChange={(e) => setCustomSubHex(e.target.value)}
                        className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
                      />
                      <input
                        type="text"
                        value={customSubHex}
                        onChange={(e) => setCustomSubHex(e.target.value)}
                        className="w-full border-0 bg-transparent px-2 text-gray-900 outline-none"
                      />
                    </div>
                  ) : (
                    <ColorSelect
                      value={subColor}
                      onChange={setSubColor}
                      placeholder="未選択"
                      emptyOptionLabel="色を選ばない"
                    />
                  )}
                </div>
              </div>
              {errors.main_color_custom_label && (
                <p className="text-sm text-red-600">
                  {errors.main_color_custom_label}
                </p>
              )}
            </ItemFormSection>

            <ItemFormSection title="利用条件・特性" className="lg:col-span-2">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">季節</p>
                <div className="flex flex-wrap gap-2">
                  {SEASON_OPTIONS.map((season) => {
                    const checked = selectedSeasons.includes(season);
                    return (
                      <button
                        key={season}
                        type="button"
                        aria-pressed={checked}
                        onClick={() => toggleSeason(season)}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          checked
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {season}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">TPO</p>
                <div className="flex flex-wrap gap-2">
                  {tpoOptions.map((tpo) => {
                    const checked = selectedTpoIds.includes(tpo.id);
                    return (
                      <button
                        key={tpo.id}
                        type="button"
                        aria-pressed={checked}
                        onClick={() =>
                          toggleValue(tpo.id, selectedTpoIds, setSelectedTpoIds)
                        }
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          checked
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {tpo.name}
                      </button>
                    );
                  })}
                  {tpoLoadError ? (
                    <p className="text-sm text-red-600">{tpoLoadError}</p>
                  ) : tpoOptions.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      有効な TPO はまだありません。設定から追加できます。
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="mb-1 h-5" aria-hidden="true" />
                  <label className="inline-flex h-[50px] w-full items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      aria-label="雨対応"
                      checked={isRainOk}
                      onChange={(e) => setIsRainOk(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    雨対応
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="care-status"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    ケア状態
                  </label>
                  <select
                    id="care-status"
                    value={careStatus}
                    onChange={(e) =>
                      setCareStatus(e.target.value as ItemCareStatus | "")
                    }
                    className={getFormControlClassName()}
                  >
                    <option value=""></option>
                    {Object.entries(ITEM_CARE_STATUS_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    クリーニング中でもコーデ候補や着用履歴候補からは除外されません。
                  </p>
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
                    onChange={(e) =>
                      setSheerness(e.target.value as ItemSheerness | "")
                    }
                    className={getFormControlClassName()}
                  >
                    <option value=""></option>
                    {Object.entries(ITEM_SHEERNESS_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
            </ItemFormSection>

            <ItemFormSection title="サイズ・実寸" className="lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="size-gender"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    サイズ区分
                  </label>
                  <select
                    id="size-gender"
                    value={sizeGender}
                    onChange={(e) =>
                      setSizeGender(
                        e.target.value as "women" | "men" | "unisex" | "",
                      )
                    }
                    className={getFormControlClassName()}
                  >
                    <option value=""></option>
                    {Object.entries(ITEM_SIZE_GENDER_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="size-label"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    サイズ表記
                  </label>
                  <input
                    id="size-label"
                    type="text"
                    placeholder="例: M / 23.5cm"
                    value={sizeLabel}
                    onChange={(e) => setSizeLabel(e.target.value)}
                    className={getFormControlClassName()}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="size-note"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  サイズ感メモ
                </label>
                <input
                  id="size-note"
                  type="text"
                  value={sizeNote}
                  onChange={(e) => setSizeNote(e.target.value)}
                  placeholder="例: 普段Mだが小さめ"
                  className={getFormControlClassName()}
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
                onAddCustomSizeField={addCustomSizeField}
                onUpdateStructuredSizeValue={updateStructuredSizeValue}
                onUpdateCustomSizeField={updateCustomSizeField}
                onRemoveCustomSizeField={removeCustomSizeField}
              />
            </ItemFormSection>

            <ItemFormSection
              title="素材・混率"
              description="分かる場合だけ入力します。区分ごとの合計が100%になるように設定してください。"
              className="lg:col-span-2"
            >
              <ItemMaterialFields
                rows={materialRows}
                errors={errors}
                totals={materialValidationPreview.totals}
                onChange={updateMaterialRow}
                onAddRow={addMaterialRow}
                onRemoveRow={removeMaterialRow}
              />
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
                      実購入価格
                    </label>
                    {hasInheritedPrice ? <ReviewHintIcon /> : null}
                  </div>
                  <div
                    className={getFormControlWrapperClassName(
                      false,
                      hasInheritedPrice
                        ? "border-amber-300 bg-amber-50"
                        : undefined,
                    )}
                  >
                    <input
                      id="price"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className={FORM_CONTROL_INNER_INPUT_CLASS}
                    />
                    <span className="text-sm text-gray-500">円</span>
                  </div>
                </div>

                <div
                  className={
                    hasInheritedPurchasedAt
                      ? "rounded-xl border border-amber-200 bg-amber-50/60 p-3"
                      : undefined
                  }
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <label
                      htmlFor="purchased-at"
                      className="block text-sm font-medium text-gray-700"
                    >
                      購入日
                    </label>
                    {hasInheritedPurchasedAt ? <ReviewHintIcon /> : null}
                  </div>
                  <input
                    id="purchased-at"
                    type="date"
                    value={purchasedAt}
                    onChange={(e) => setPurchasedAt(e.target.value)}
                    className={getFormControlClassName({
                      className: hasInheritedPurchasedAt
                        ? "border-amber-300 bg-amber-50"
                        : undefined,
                    })}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="purchase-url"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  購入 URL
                </label>
                <input
                  id="purchase-url"
                  type="url"
                  value={purchaseUrl}
                  onChange={(e) => setPurchaseUrl(e.target.value)}
                  className={getFormControlClassName()}
                />
              </div>
            </ItemFormSection>

            <ItemFormSection title="補足情報" className="lg:col-span-1">
              <div
                className={
                  hasInheritedMemo
                    ? "rounded-xl border border-amber-200 bg-amber-50/60 p-3"
                    : undefined
                }
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <label
                    htmlFor="memo"
                    className="block text-sm font-medium text-gray-700"
                  >
                    メモ
                  </label>
                  {hasInheritedMemo ? <ReviewHintIcon /> : null}
                </div>
                <textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={4}
                  className={getFormControlClassName({
                    className: hasInheritedMemo
                      ? "border-amber-300 bg-amber-50"
                      : undefined,
                  })}
                />
              </div>
            </ItemFormSection>

            <ItemFormSection
              title="画像"
              description="画像の追加や削除などの操作は、画像セクションで行います。"
              className="lg:col-span-2"
            >
              {hasInheritedImages ? (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-700">
                  <div className="flex items-start gap-2">
                    <ReviewHintIcon />
                    <span>
                      元データの画像を仮で引き継いでいます。必要に応じて差し替えてください。
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
                <ItemImageUploader
                  existingImages={itemImages}
                  pendingImages={pendingImages}
                  onPendingImagesChange={setPendingImages}
                  onDeleteExistingImage={(image) => {
                    setItemImages((current) =>
                      normalizeItemImages(
                        current.filter(
                          (currentImage) =>
                            !(
                              currentImage.path === image.path &&
                              currentImage.sort_order === image.sort_order &&
                              currentImage.original_filename ===
                                image.original_filename
                            ),
                        ),
                      ),
                    );
                  }}
                  disabled={submitting}
                  helperText="不要な画像は保存前に取り除けます。"
                  existingHeading={
                    itemImages.length > 0 ? "操作対象の画像" : undefined
                  }
                />
              </div>
            </ItemFormSection>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-5 py-4 shadow-sm lg:col-span-2">
              {Object.keys(errors).length > 0 ? (
                <p className="mb-3 text-sm font-medium text-red-600">
                  入力内容を確認してください。
                </p>
              ) : null}
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  {submitting ? "作成中..." : "作成する"}
                </button>

                <Link
                  href={cancelHref}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  キャンセル
                </Link>
              </div>
            </div>
          </div>
        </form>

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}
        {submitSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {submitSuccess}
          </div>
        )}
      </div>
    </main>
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
