"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormPageHeader } from "@/components/shared/form-page-header";
import {
  findItemCategoryLabel,
  ITEM_CATEGORIES,
  ITEM_SHAPES,
  type ItemCategory,
} from "@/lib/master-data/item-shapes";
import {
  buildSupportedCategoryOptions,
  fetchCategoryGroups,
} from "@/lib/api/categories";
import {
  fetchCategoryVisibilitySettings,
  fetchUserPreferences,
  fetchUserTpos,
} from "@/lib/api/settings";
import type { CategoryOption } from "@/types/categories";
import {
  ITEM_COLORS,
  type ItemColorValue,
} from "@/lib/master-data/item-colors";
import FieldLabel from "@/components/forms/field-label";
import BrandNameField from "@/components/items/brand-name-field";
import ColorChip from "@/components/items/color-chip";
import ColorSelect from "@/components/items/color-select";
import ItemImageUploader from "@/components/items/item-image-uploader";
import ItemFormPreviewPanel from "@/components/items/item-form-preview-panel";
import ItemFormSection from "@/components/items/item-form-section";
import ItemMaterialFields from "@/components/items/item-material-fields";
import ItemPreviewCard from "@/components/items/item-preview-card";
import ItemSizeDetailsFields from "@/components/items/item-size-details-fields";
import { SEASON_OPTIONS } from "@/lib/master-data/item-attributes";
import { DEFAULT_SKIN_TONE_PRESET } from "@/lib/master-data/skin-tone-presets";
import type {
  CreateItemPayload,
  ItemCareStatus,
  ItemFormColor,
  ItemImageRecord,
  ItemRecord,
} from "@/types/items";
import {
  buildTopsSpecLabels,
  buildTopsSpecRaw,
  DEFAULT_TOPS_FIT,
  TOPS_DESIGNS,
  TOPS_FITS,
  TOPS_LENGTHS,
  TOPS_NECKS,
  TOPS_RULES,
  TOPS_SHAPES,
  TOPS_SLEEVES,
  type TopsDesignValue,
  type TopsFitValue,
  type TopsLengthValue,
  type TopsNeckValue,
  type TopsShapeValue,
  type TopsSleeveValue,
} from "@/lib/master-data/item-tops";
import {
  BOTTOMS_LENGTH_OPTIONS,
  getLegwearCoverageOptions,
  isBottomsSpecCategory,
  isBottomsLengthTypeRequired,
  isLegwearCoverageTypeRequired,
  isLegwearSpecCategory,
  resolveLegwearCoverageType,
  shouldShowLegwearCoverageSelect,
  type BottomsLengthType,
  type LegwearCoverageType,
} from "@/lib/master-data/item-skin-exposure";
import {
  formatItemPrice,
  ITEM_CARE_STATUS_LABELS,
  ITEM_SIZE_GENDER_LABELS,
  normalizeItemImages,
} from "@/lib/items/metadata";
import {
  buildItemSizeDetailsPayload,
  buildSizeDetailDuplicateWarnings,
  formatSizeDetailValue,
  getStructuredSizeFieldDefinitions,
  normalizeItemSizeDetails,
  type EditableCustomSizeField,
} from "@/lib/items/size-details";
import {
  buildEditableItemMaterials,
  createEmptyItemMaterialRow,
  validateItemMaterials,
  type EditableItemMaterial,
} from "@/lib/items/materials";
import type { SkinTonePreset, UserTpoRecord } from "@/types/settings";
import type { StructuredSizeFieldName } from "@/types/items";

export default function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [itemId, setItemId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [saveBrandAsCandidate, setSaveBrandAsCandidate] = useState(false);
  const [price, setPrice] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [careStatus, setCareStatus] = useState<ItemCareStatus | "">("");
  const [purchasedAt, setPurchasedAt] = useState("");
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
  const [materialRows, setMaterialRows] = useState<EditableItemMaterial[]>(() =>
    buildEditableItemMaterials(),
  );
  const [isRainOk, setIsRainOk] = useState(false);
  const [itemImages, setItemImages] = useState<ItemImageRecord[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([
    ...ITEM_CATEGORIES,
  ]);
  const [shape, setShape] = useState("");

  const [mainColor, setMainColor] = useState<ItemColorValue | "">("");
  const [subColor, setSubColor] = useState<ItemColorValue | "">("");
  const [useCustomMainColor, setUseCustomMainColor] = useState(false);
  const [useCustomSubColor, setUseCustomSubColor] = useState(false);
  const [customMainHex, setCustomMainHex] = useState("#3B82F6");
  const [customSubHex, setCustomSubHex] = useState("#9CA3AF");

  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedTpoIds, setSelectedTpoIds] = useState<number[]>([]);
  const [tpoOptions, setTpoOptions] = useState<UserTpoRecord[]>([]);
  const [tpoLoadError, setTpoLoadError] = useState<string | null>(null);
  const [skinTonePreset, setSkinTonePreset] = useState<SkinTonePreset>(
    DEFAULT_SKIN_TONE_PRESET,
  );

  const [topsShape, setTopsShape] = useState<TopsShapeValue | "">("");
  const [topsSleeve, setTopsSleeve] = useState<TopsSleeveValue | "">("");
  const [topsLength, setTopsLength] = useState<TopsLengthValue | "">("");
  const [topsNeck, setTopsNeck] = useState<TopsNeckValue | "">("");
  const [topsDesign, setTopsDesign] = useState<TopsDesignValue | "">("");
  const [topsFit, setTopsFit] = useState<TopsFitValue>(DEFAULT_TOPS_FIT);
  const [bottomsLengthType, setBottomsLengthType] = useState<
    BottomsLengthType | ""
  >("");
  const [legwearCoverageType, setLegwearCoverageType] = useState<
    LegwearCoverageType | ""
  >("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const isTopsCategory = category === "tops";
  const isBottomsSpecVisible = isBottomsSpecCategory(category);
  const isLegwearSpecVisible =
    isLegwearSpecCategory(category) && Boolean(shape);
  const isLegwearCoverageSelectVisible = shouldShowLegwearCoverageSelect(
    category,
    shape,
  );
  const legwearCoverageOptions = useMemo(
    () => getLegwearCoverageOptions(shape),
    [shape],
  );
  const isLegwearCoverageRequired = isLegwearCoverageTypeRequired(
    category,
    shape,
  );

  const shapeOptions = useMemo(() => {
    if (!category) return [];
    return ITEM_SHAPES[category];
  }, [category]);

  const selectedMainColor = useMemo(() => {
    if (useCustomMainColor) {
      return { label: "カスタムカラー", hex: customMainHex };
    }

    return ITEM_COLORS.find((color) => color.value === mainColor) ?? null;
  }, [useCustomMainColor, customMainHex, mainColor]);

  const selectedSubColor = useMemo(() => {
    if (useCustomSubColor) {
      return { label: "カスタムカラー", hex: customSubHex };
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
  const structuredSizeFieldDefinitions = useMemo(
    () => getStructuredSizeFieldDefinitions(category, shape),
    [category, shape],
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

  useEffect(() => {
    let active = true;

    Promise.all([fetchCategoryGroups(), fetchCategoryVisibilitySettings()])
      .then(([groups, settings]) => {
        if (!active) return;
        const nextOptions = buildSupportedCategoryOptions(
          groups,
          settings.visibleCategoryIds,
        );
        setCategoryOptions(nextOptions);
      })
      .catch(() => {
        // フロントでは取得失敗時に固定 master data へフォールバックする
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!category) return;

    setCategoryOptions((current) => {
      if (current.some((option) => option.value === category)) {
        return current;
      }

      const currentOption = ITEM_CATEGORIES.find(
        (option) => option.value === category,
      );
      if (currentOption) {
        return [...current, currentOption];
      }

      return [
        ...current,
        {
          value: category,
          label: findItemCategoryLabel(category),
        },
      ];
    });
  }, [category]);
  useEffect(() => {
    async function loadItem() {
      const { id } = await params;
      setItemId(Number(id));

      try {
        const response = await fetch(`/api/items/${id}`, {
          headers: { Accept: "application/json" },
        });
        const [tpoResult, preferencesResult] = await Promise.allSettled([
          fetchUserTpos(true),
          fetchUserPreferences(),
        ]);

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          router.push("/items");
          return;
        }

        const data = await response.json();
        const item: ItemRecord = data.item;

        setName(item.name ?? "");
        setBrandName(item.brand_name ?? "");
        setPrice(item.price === null ? "" : String(item.price));
        setPurchaseUrl(item.purchase_url ?? "");
        setMemo(item.memo ?? "");
        setCareStatus(item.care_status ?? "");
        setPurchasedAt(item.purchased_at ? item.purchased_at.slice(0, 10) : "");
        setSizeGender(item.size_gender ?? "");
        setSizeLabel(item.size_label ?? "");
        setSizeNote(item.size_note ?? "");
        const normalizedSizeDetails = normalizeItemSizeDetails(
          item.size_details,
        );
        setStructuredSizeValues(
          Object.fromEntries(
            Object.entries(normalizedSizeDetails?.structured ?? {}).map(
              ([fieldName, fieldValue]) => [
                fieldName,
                formatSizeDetailValue(fieldValue),
              ],
            ),
          ) as Partial<Record<StructuredSizeFieldName, string>>,
        );
        setCustomSizeFields(
          (normalizedSizeDetails?.custom_fields ?? []).map((field, index) => ({
            id: `edit-size-field-${index}`,
            label: field.label,
            value: formatSizeDetailValue(field.value),
          })),
        );
        setIsRainOk(item.is_rain_ok ?? false);
        setItemImages(normalizeItemImages(item.images ?? []));
        setMaterialRows(buildEditableItemMaterials(item.materials));
        setCategory(item.category as ItemCategory);
        setShape(item.shape);
        setSelectedSeasons(item.seasons ?? []);
        setSelectedTpoIds(item.tpo_ids ?? []);
        const selectedInactiveTpos = (item.tpo_ids ?? []).map(
          (tpoId, index) => ({
            id: tpoId,
            name: item.tpos?.[index] ?? `TPO ${tpoId}`,
            sortOrder: 10_000 + index,
            isActive: false,
            isPreset: false,
          }),
        );
        const activeTpoOptions =
          tpoResult.status === "fulfilled" ? tpoResult.value.tpos : [];
        setTpoOptions(
          [...activeTpoOptions, ...selectedInactiveTpos].reduce<
            UserTpoRecord[]
          >((carry, tpo) => {
            if (carry.some((current) => current.id === tpo.id)) {
              return carry;
            }

            return [...carry, tpo];
          }, []),
        );
        setTpoLoadError(
          tpoResult.status === "rejected"
            ? "TPO の取得に失敗しました。再読み込みしても改善しない場合は設定を確認してください。"
            : null,
        );
        setSkinTonePreset(
          preferencesResult.status === "fulfilled"
            ? preferencesResult.value.preferences.skinTonePreset
            : DEFAULT_SKIN_TONE_PRESET,
        );

        const main = item.colors.find((color) => color.role === "main");
        const sub = item.colors.find((color) => color.role === "sub");
        const tops = item.spec?.tops;
        const bottoms = item.spec?.bottoms;
        const legwear = item.spec?.legwear;

        if (main) {
          if (main.mode === "custom") {
            setUseCustomMainColor(true);
            setCustomMainHex(main.hex);
          } else {
            setMainColor(main.value as ItemColorValue);
          }
        }

        if (sub) {
          if (sub.mode === "custom") {
            setUseCustomSubColor(true);
            setCustomSubHex(sub.hex);
          } else {
            setSubColor(sub.value as ItemColorValue);
          }
        }

        if (item.category === "tops") {
          const resolvedShape = (tops?.shape ?? item.shape) as TopsShapeValue;
          setTopsShape(resolvedShape);

          const rule = TOPS_RULES[resolvedShape];
          setTopsSleeve(
            (tops?.sleeve as TopsSleeveValue | null | undefined) ??
              rule?.defaults?.sleeve ??
              "",
          );
          setTopsLength(
            (tops?.length as TopsLengthValue | null | undefined) ??
              rule?.defaults?.length ??
              "",
          );
          setTopsNeck(
            (tops?.neck as TopsNeckValue | null | undefined) ??
              rule?.defaults?.neck ??
              "",
          );
          setTopsDesign(
            (tops?.design as TopsDesignValue | null | undefined) ??
              rule?.defaults?.design ??
              "",
          );
          setTopsFit(
            (tops?.fit as TopsFitValue | null | undefined) ??
              rule?.defaults?.fit ??
              DEFAULT_TOPS_FIT,
          );
        }

        if (isBottomsSpecCategory(item.category)) {
          setBottomsLengthType(
            (bottoms?.length_type as BottomsLengthType | null | undefined) ??
              "",
          );
        }

        if (item.category === "legwear") {
          setLegwearCoverageType(
            (resolveLegwearCoverageType(
              item.category,
              item.shape,
              legwear?.coverage_type as LegwearCoverageType | null | undefined,
            ) as LegwearCoverageType | null) ?? "",
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [params, router]);

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
    setShape("");
    clearErrorsFor([
      "shape",
      "spec.bottoms.length_type",
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

  function createCustomSizeField(): EditableCustomSizeField {
    return {
      id: `size-field-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      label: "",
      value: "",
    };
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
    key: "label" | "value",
    value: string,
  ) {
    setCustomSizeFields((current) =>
      current.map((field) =>
        field.id === fieldId ? { ...field, [key]: value } : field,
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
    );
    const materials = validateItemMaterials(materialRows).payload;

    return {
      name,
      brand_name: brandName.trim() || null,
      save_brand_as_candidate: saveBrandAsCandidate,
      price: price === "" ? null : Number(price),
      purchase_url: purchaseUrl.trim() || null,
      memo: memo.trim() || null,
      care_status: careStatus || null,
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
      shape,
      colors,
      seasons: selectedSeasons,
      tpo_ids: selectedTpoIds,
      materials,
      spec:
        isTopsCategory && topsShape
          ? {
              tops: {
                shape: topsShape,
                sleeve: topsSleeve || null,
                length: topsLength || null,
                neck: topsNeck || null,
                design: topsDesign || null,
                fit: topsFit || null,
              },
              ...(isBottomsSpecVisible && bottomsLengthType
                ? {
                    bottoms: {
                      length_type: bottomsLengthType,
                    },
                  }
                : {}),
              ...(resolvedLegwearCoverageType
                ? {
                    legwear: {
                      coverage_type: resolvedLegwearCoverageType,
                    },
                  }
                : {}),
            }
          : isBottomsSpecVisible && bottomsLengthType
            ? {
                bottoms: {
                  length_type: bottomsLengthType,
                },
                ...(resolvedLegwearCoverageType
                  ? {
                      legwear: {
                        coverage_type: resolvedLegwearCoverageType,
                      },
                    }
                  : {}),
              }
            : resolvedLegwearCoverageType
              ? {
                  legwear: {
                    coverage_type: resolvedLegwearCoverageType,
                  },
                }
              : null,
      images: itemImages.map((image) => ({
        disk: image.disk,
        path: image.path,
        original_filename: image.original_filename,
        mime_type: image.mime_type,
        file_size: image.file_size,
        sort_order: image.sort_order,
        is_primary: image.is_primary,
      })),
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
        const uploadData = await uploadResponse.json().catch(() => null);
        throw new Error(
          uploadData?.message ??
            uploadData?.errors?.image?.[0] ??
            "画像の追加に失敗しました。",
        );
      }
    }
  }

  async function handleDeleteImage(imageId: number) {
    if (!itemId) {
      return;
    }

    const response = await fetch(`/api/items/${itemId}/images/${imageId}`, {
      method: "DELETE",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setSubmitError(data?.message ?? "画像の削除に失敗しました。");
      return;
    }

    setItemImages((current) =>
      normalizeItemImages(
        current.filter((currentImage) => currentImage.id !== imageId),
      ),
    );
  }

  function handleMoveImage(
    targetImage: ItemImageRecord,
    direction: "up" | "down",
  ) {
    setItemImages((current) => {
      const currentIndex = current.findIndex(
        (image) => image.id === targetImage.id,
      );
      if (currentIndex < 0) {
        return current;
      }

      const nextIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextImages = [...current];
      const [movedImage] = nextImages.splice(currentIndex, 1);
      nextImages.splice(nextIndex, 0, movedImage);

      return normalizeItemImages(nextImages);
    });
  }

  function handleMakePrimaryImage(targetImage: ItemImageRecord) {
    setItemImages((current) =>
      normalizeItemImages(
        current.map((image) => ({
          ...image,
          is_primary: image.id === targetImage.id,
        })),
      ),
    );
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {
      ...materialValidationPreview.errors,
    };
    const resolvedLegwearCoverageType = resolveLegwearCoverageType(
      category,
      shape,
      legwearCoverageType,
    );

    if (!category) nextErrors.category = "カテゴリを選択してください。";
    if (!shape) nextErrors.shape = "形を選択してください。";
    if (!selectedMainColor)
      nextErrors.mainColor = "メインカラーを選択してください。";
    if (isBottomsLengthTypeRequired(category) && !bottomsLengthType) {
      nextErrors["spec.bottoms.length_type"] = "ボトムス丈を選択してください。";
    }
    if (
      isLegwearCoverageTypeRequired(category, shape) &&
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

    if (!validateForm() || !itemId) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setSubmitError("セッションが切れました。再度ログインしてください。");
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
        setSubmitError(data?.message ?? "更新に失敗しました。");
        return;
      }

      if (pendingImages.length > 0) {
        await uploadPendingImages(itemId);
      }

      setSubmitSuccess("更新に成功しました。");
      setTimeout(() => {
        router.push(`/items/${itemId}`);
        router.refresh();
      }, 800);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "通信に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const previewTopsSpec = isTopsCategory
    ? buildTopsSpecLabels({
        shape: topsShape || undefined,
        sleeve: topsSleeve || undefined,
        length: topsLength || undefined,
        neck: topsNeck || undefined,
        design: topsDesign || undefined,
        fit: topsFit || undefined,
      })
    : null;

  const previewTopsSpecRaw = isTopsCategory
    ? buildTopsSpecRaw({
        shape: topsShape || undefined,
        sleeve: topsSleeve || undefined,
        length: topsLength || undefined,
        neck: topsNeck || undefined,
        design: topsDesign || undefined,
        fit: topsFit || undefined,
      })
    : null;
  const previewSpec = {
    tops: previewTopsSpecRaw,
    bottoms: isBottomsSpecCategory(category)
      ? { length_type: bottomsLengthType || undefined }
      : undefined,
    legwear: isLegwearSpecCategory(category)
      ? {
          coverage_type:
            resolveLegwearCoverageType(category, shape, legwearCoverageType) ??
            undefined,
        }
      : undefined,
  };
  const previewSummary =
    selectedMainColor || selectedSubColor ? (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 text-sm font-medium text-gray-700">選択中の色</p>
        <div className="flex flex-wrap gap-2">
          {selectedMainColor && (
            <ColorChip
              label={selectedMainColor.label}
              hex={selectedMainColor.hex}
              tone="main"
            />
          )}
          {selectedSubColor && (
            <ColorChip
              label={selectedSubColor.label}
              hex={selectedSubColor.hex}
              tone="sub"
            />
          )}
        </div>
      </div>
    ) : null;
  const shouldShowDetailsSection =
    isTopsCategory || isBottomsSpecVisible || isLegwearCoverageSelectVisible;

  function scrollToFirstError(nextErrors: Record<string, string>) {
    const errorOrder = [
      "category",
      "shape",
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6 pb-28 md:p-10 md:pb-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-gray-600">読み込み中です...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 pb-28 md:p-10 md:pb-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <FormPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "アイテム一覧", href: "/items" },
            ...(itemId ? [{ label: "詳細", href: `/items/${itemId}` }] : []),
            { label: "編集" },
          ]}
          eyebrow="アイテム管理"
          title="編集"
          description="登録済みのアイテム情報を見直して更新します。"
          actions={
            <Link
              href={itemId ? `/items/${itemId}` : "/items"}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              詳細に戻る
            </Link>
          }
        />

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6"
        >
          <div className="hidden lg:col-start-2 lg:row-start-1 lg:block lg:sticky lg:top-6 lg:self-start">
            <ItemFormPreviewPanel
              showHeader={false}
              summary={previewSummary}
              preview={
                <ItemPreviewCard
                  name={name}
                  category={category}
                  shape={shape}
                  mainColorHex={selectedMainColor?.hex}
                  mainColorLabel={selectedMainColor?.label}
                  subColorHex={selectedSubColor?.hex}
                  subColorLabel={selectedSubColor?.label}
                  topsSpec={previewTopsSpec}
                  topsSpecRaw={previewTopsSpecRaw}
                  spec={previewSpec}
                  images={itemImages}
                  skinTonePreset={skinTonePreset}
                  showDebugDetails={false}
                />
              }
            />
          </div>
          <div className="space-y-5 lg:col-start-1">
            <ItemFormSection title="基本情報">
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

            <ItemFormSection title="分類">
              <div data-error-key="category">
                <FieldLabel htmlFor="category" label="カテゴリ" required />
                <select
                  id="category"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.category ? "border-red-400" : "border-gray-300"}`}
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

              <div data-error-key="shape">
                <FieldLabel htmlFor="shape" label="形" required />
                <select
                  id="shape"
                  value={shape}
                  onChange={(e) => handleShapeChange(e.target.value)}
                  disabled={!category || isTopsCategory}
                  className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.shape ? "border-red-400" : "border-gray-300"}`}
                >
                  <option value="">選択してください</option>
                  {shapeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {errors.shape && (
                  <p className="mt-2 text-sm text-red-600">{errors.shape}</p>
                )}
              </div>
            </ItemFormSection>

            {shouldShowDetailsSection ? (
              <ItemFormSection title="詳細属性">
                {isTopsCategory && (
                  <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div data-error-key="spec.bottoms.length_type">
                      <p className="text-sm font-medium text-gray-700">
                        トップス仕様
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        保存済みのトップス仕様を編集しながら、preview
                        に反映します。
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="tops-shape"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          形
                        </label>
                        <select
                          id="tops-shape"
                          value={topsShape}
                          onChange={(e) =>
                            handleTopsShapeChange(e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">選択してください</option>
                          {TOPS_SHAPES.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

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

                      <div>
                        <label
                          htmlFor="tops-neck"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          首元
                        </label>
                        <select
                          id="tops-neck"
                          value={topsNeck}
                          onChange={(e) =>
                            setTopsNeck(e.target.value as TopsNeckValue | "")
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
                          disabled={
                            !topsShape || availableTopsDesigns.length === 0
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">
                            {availableTopsDesigns.length
                              ? "選択してください"
                              : "選択肢がありません"}
                          </option>
                          {availableTopsDesigns.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

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
                    </div>
                  </div>
                )}

                {isBottomsSpecVisible ? (
                  <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-700">
                      ボトムス仕様
                    </p>
                    <div>
                      <FieldLabel
                        htmlFor="bottoms-length-type"
                        label="ボトムス丈"
                        required={isBottomsLengthTypeRequired(category)}
                      />
                      <p className="mb-2 text-xs text-gray-500">
                        ボトムスを選んだ場合は、丈を選択してください。
                      </p>
                      <select
                        id="bottoms-length-type"
                        value={bottomsLengthType}
                        onChange={(e) =>
                          setBottomsLengthType(
                            e.target.value as BottomsLengthType | "",
                          )
                        }
                        onBlur={() =>
                          clearErrorsFor(["spec.bottoms.length_type"])
                        }
                        onChangeCapture={() =>
                          clearErrorsFor(["spec.bottoms.length_type"])
                        }
                        className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors["spec.bottoms.length_type"] ? "border-red-400" : "border-gray-300"}`}
                      >
                        <option value="">丈を選択してください</option>
                        {BOTTOMS_LENGTH_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      {errors["spec.bottoms.length_type"] && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors["spec.bottoms.length_type"]}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}

                {isLegwearSpecVisible ? (
                  <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-700">
                      レッグウェア仕様
                    </p>
                    {isLegwearCoverageSelectVisible ? (
                      <div data-error-key="spec.legwear.coverage_type">
                        <FieldLabel
                          htmlFor="legwear-coverage-type"
                          label="レッグウェア"
                          required={isLegwearCoverageRequired}
                        />
                        <p className="mb-2 text-xs text-gray-500">
                          {shape === "leggings"
                            ? "レギンスの長さを選択してください。"
                            : "ソックスの長さを選択してください。"}
                        </p>
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
                          <option value="">種類を選択してください</option>
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
                    ) : null}
                  </div>
                ) : null}
              </ItemFormSection>
            ) : null}

            <ItemFormSection title="色とプレビュー">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3" data-error-key="mainColor">
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
                        setUseCustomMainColor(e.target.checked);
                        if (e.target.checked) setMainColor("");
                      }}
                      className="h-4 w-4"
                    />
                    カスタムカラーを使う
                  </label>

                  {useCustomMainColor ? (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3">
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
                        className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.mainColor ? "border-red-400" : "border-gray-300"}`}
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
                        setUseCustomSubColor(e.target.checked);
                        if (e.target.checked) setSubColor("");
                      }}
                      className="h-4 w-4"
                    />
                    カスタムカラーを使う
                  </label>

                  {useCustomSubColor ? (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3">
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
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

              <div className="lg:hidden">
                <ItemFormPreviewPanel
                  compact
                  showHeader={false}
                  summary={previewSummary}
                  preview={
                    <ItemPreviewCard
                      name={name}
                      category={category}
                      shape={shape}
                      mainColorHex={selectedMainColor?.hex}
                      mainColorLabel={selectedMainColor?.label}
                      subColorHex={selectedSubColor?.hex}
                      subColorLabel={selectedSubColor?.label}
                      topsSpec={previewTopsSpec}
                      topsSpecRaw={previewTopsSpecRaw}
                      spec={previewSpec}
                      images={itemImages}
                      skinTonePreset={skinTonePreset}
                      compact
                      showDebugDetails={false}
                    />
                  }
                />
              </div>
            </ItemFormSection>

            <ItemFormSection title="利用条件・状態">
              <div>
                <p className="mb-2 text-sm font-medium">季節</p>
                <div className="flex flex-wrap gap-3">
                  {SEASON_OPTIONS.map((season) => {
                    const checked = selectedSeasons.includes(season);
                    return (
                      <label
                        key={season}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${checked ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-700"}`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={() =>
                            toggleValue(
                              season,
                              selectedSeasons,
                              setSelectedSeasons,
                            )
                          }
                        />
                        {season}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">TPO</p>
                <div className="flex flex-wrap gap-3">
                  {tpoOptions.map((tpo) => {
                    const checked = selectedTpoIds.includes(tpo.id);
                    return (
                      <label
                        key={tpo.id}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${checked ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-700"} ${!tpo.isActive ? "border-amber-300 bg-amber-50 text-amber-800" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={() =>
                            toggleValue(
                              tpo.id,
                              selectedTpoIds,
                              setSelectedTpoIds,
                            )
                          }
                        />
                        {tpo.name}
                      </label>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div
                    className="mb-1 block text-sm font-medium text-gray-700"
                    aria-hidden="true"
                  >
                    雨対応
                  </div>
                  <label className="inline-flex h-[50px] w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              </div>
            </ItemFormSection>

            <ItemFormSection title="サイズ">
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                onAddCustomSizeField={addCustomSizeField}
                onUpdateStructuredSizeValue={updateStructuredSizeValue}
                onUpdateCustomSizeField={updateCustomSizeField}
                onRemoveCustomSizeField={removeCustomSizeField}
              />
            </ItemFormSection>

            <ItemFormSection
              title="素材・混率"
              description="分かる場合だけ入力します。区分ごとの合計が100%になるように設定してください。"
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

            <ItemFormSection title="購入・補足">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="price"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    実購入価格
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-300 bg-white pr-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <input
                      id="price"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full rounded-lg bg-transparent px-4 py-3 text-gray-900 outline-none"
                    />
                    <span className="text-sm text-gray-500">円</span>
                  </div>
                  {price !== "" && (
                    <p className="mt-1 text-xs text-gray-500">
                      表示: {formatItemPrice(Number(price))}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="purchased-at"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    購入日
                  </label>
                  <input
                    id="purchased-at"
                    type="date"
                    value={purchasedAt}
                    onChange={(e) => setPurchasedAt(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="memo"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  メモ
                </label>
                <textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </ItemFormSection>

            <ItemFormSection
              title="画像"
              description="画像の追加・削除・並び替えは、画像セクションで行います。"
            >
              <ItemImageUploader
                existingImages={itemImages}
                pendingImages={pendingImages}
                onPendingImagesChange={setPendingImages}
                onMoveExistingImage={handleMoveImage}
                onMakePrimaryExistingImage={handleMakePrimaryImage}
                onDeleteExistingImage={(image) => {
                  if (!image.id) {
                    return;
                  }

                  void handleDeleteImage(image.id);
                }}
                disabled={submitting}
                helperText="既存画像は並び替えと代表画像の切り替えができます。保存前の追加画像はまとめて反映されます。"
                existingHeading={
                  itemImages.length > 0 ? "操作対象の画像" : undefined
                }
              />
            </ItemFormSection>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-5 py-4 shadow-sm">
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
                  {submitting ? "更新中..." : "更新する"}
                </button>

                <Link
                  href={itemId ? `/items/${itemId}` : "/items"}
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
