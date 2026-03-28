"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ITEM_CATEGORIES,
  ITEM_SHAPES,
  type ItemCategory,
} from "@/lib/master-data/item-shapes";
import { buildSupportedCategoryOptions, fetchCategoryGroups } from "@/lib/api/categories";
import { fetchCategoryVisibilitySettings, fetchUserTpos } from "@/lib/api/settings";
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
import type { CreateItemPayload, ItemCareStatus, ItemFormColor, ItemImageRecord } from "@/types/items";
import ItemPreviewCard from "@/components/items/item-preview-card";
import { SEASON_OPTIONS } from "@/lib/master-data/item-attributes";
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
  clearPurchaseCandidateItemDraft,
  loadPurchaseCandidateItemDraft,
  mapPurchaseCandidateItemDraft,
} from "@/lib/purchase-candidates/item-draft";
import {
  formatItemPrice,
  ITEM_CARE_STATUS_LABELS,
  ITEM_SIZE_GENDER_LABELS,
  mapPurchaseCandidateImagesToItemImages,
  normalizeItemImages,
} from "@/lib/items/metadata";
import type { UserTpoRecord } from "@/types/settings";

export default function NewItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [saveBrandAsCandidate, setSaveBrandAsCandidate] = useState(false);
  const [price, setPrice] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [careStatus, setCareStatus] = useState<ItemCareStatus | "">("");
  const [purchasedAt, setPurchasedAt] = useState("");
  const [sizeGender, setSizeGender] = useState<"women" | "men" | "unisex" | "">("");
  const [sizeLabel, setSizeLabel] = useState("");
  const [sizeNote, setSizeNote] = useState("");
  const [sizeDetailsNote, setSizeDetailsNote] = useState("");
  const [isRainOk, setIsRainOk] = useState(false);
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([...ITEM_CATEGORIES]);
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
  const [draftTpoNames, setDraftTpoNames] = useState<string[]>([]);

  const [topsShape, setTopsShape] = useState<TopsShapeValue | "">("");
  const [topsSleeve, setTopsSleeve] = useState<TopsSleeveValue | "">("");
  const [topsLength, setTopsLength] = useState<TopsLengthValue | "">("");
  const [topsNeck, setTopsNeck] = useState<TopsNeckValue | "">("");
  const [topsDesign, setTopsDesign] = useState<TopsDesignValue | "">("");
  const [topsFit, setTopsFit] = useState<TopsFitValue>(DEFAULT_TOPS_FIT);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [draftInfoMessage, setDraftInfoMessage] = useState<string | null>(null);
  const [sourcePurchaseCandidateId, setSourcePurchaseCandidateId] = useState<number | null>(null);
  const [itemImages, setItemImages] = useState<ItemImageRecord[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);

  const isTopsCategory = category === "tops";

  const shapeOptions = useMemo(() => {
    if (!category) return [];
    return ITEM_SHAPES[category];
  }, [category]);

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


  useEffect(() => {
    let active = true;

    Promise.all([
      fetchCategoryGroups(),
      fetchCategoryVisibilitySettings(),
      fetchUserTpos(true),
    ])
      .then(([groups, settings, tpoResponse]) => {
        if (!active) return;
        const nextOptions = buildSupportedCategoryOptions(
          groups,
          settings.visibleCategoryIds,
        );
        setCategoryOptions(nextOptions);
        setTpoOptions(tpoResponse.tpos);
      })
      .catch(() => {
        // フロントでは取得失敗時に固定 master data へフォールバックする
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("source") !== "purchase-candidate") {
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
    setSizeDetailsNote(draft.sizeDetails ?? "");
    setIsRainOk(draft.isRainOk);
    setCategory(draft.category as ItemCategory);
    setShape(draft.shape);
    setSelectedSeasons(draft.seasons);
    setDraftTpoNames(draft.tpos);
    setMainColor((mainDraftColor?.value as ItemColorValue | undefined) ?? "");
    setSubColor((subDraftColor?.value as ItemColorValue | undefined) ?? "");
    setItemImages(mapPurchaseCandidateImagesToItemImages(draft.images));
    setDraftInfoMessage("購入検討の内容を初期値として読み込みました。");

    clearPurchaseCandidateItemDraft();
  }, [searchParams]);

  useEffect(() => {
    if (draftTpoNames.length === 0 || tpoOptions.length === 0 || selectedTpoIds.length > 0) {
      return;
    }

    const matchedIds = tpoOptions
      .filter((tpo) => draftTpoNames.includes(tpo.name))
      .map((tpo) => tpo.id);

    setSelectedTpoIds(matchedIds);
  }, [draftTpoNames, selectedTpoIds.length, tpoOptions]);

  function resetTopsState() {
    setTopsShape("");
    setTopsSleeve("");
    setTopsLength("");
    setTopsNeck("");
    setTopsDesign("");
    setTopsFit(DEFAULT_TOPS_FIT);
  }

  function handleCategoryChange(nextCategory: string) {
    setCategory(nextCategory as ItemCategory | "");
    setShape("");

    if (nextCategory !== "tops") {
      resetTopsState();
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
      return;
    }

    const rule = TOPS_RULES[value];
    setTopsSleeve(rule.defaults?.sleeve ?? "");
    setTopsLength(rule.defaults?.length ?? "");
    setTopsNeck(rule.defaults?.neck ?? "");
    setTopsDesign(rule.defaults?.design ?? "");
    setTopsFit(rule.defaults?.fit ?? DEFAULT_TOPS_FIT);
    setShape(value);
  }

  function toggleValue<T>(value: T, current: T[], setter: (values: T[]) => void) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
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

    return {
      name,
      purchase_candidate_id: sourcePurchaseCandidateId,
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
      size_details: sizeDetailsNote.trim()
        ? {
            note: sizeDetailsNote.trim(),
          }
        : null,
      is_rain_ok: isRainOk,
      category,
      shape,
      colors,
      seasons: selectedSeasons,
      tpo_ids: selectedTpoIds,
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
            }
          : null,
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
        const uploadData = await uploadResponse.json().catch(() => null);
        throw new Error(uploadData?.message ?? uploadData?.errors?.image?.[0] ?? "画像の追加に失敗しました。");
      }
    }
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!category) nextErrors.category = "カテゴリを選択してください。";
    if (!shape) nextErrors.shape = "形を選択してください。";
    if (!selectedMainColor) nextErrors.mainColor = "メインカラーを選択してください。";

    setErrors(nextErrors);
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
        setSubmitError("セッションが切れました。再度ログインしてください。");
        setTimeout(() => router.push("/login"), 800);
        return;
      }

      if (!response.ok) {
        setSubmitError(data?.message ?? "登録に失敗しました。");
        return;
      }

      createdItemId = typeof data?.item?.id === "number" ? data.item.id : null;

      if (createdItemId !== null && pendingImages.length > 0) {
        await uploadPendingImages(createdItemId);
      }

      setSubmitSuccess("登録に成功しました。");
      setTimeout(() => {
        router.push("/items");
        router.refresh();
      }, 800);
    } catch (error) {
      if (createdItemId !== null) {
        setSubmitError(
          error instanceof Error
            ? `アイテム本体は登録しましたが、${error.message}`
            : "アイテム本体は登録しましたが、画像の追加に失敗しました。",
        );
        setTimeout(() => {
          router.push(`/items/${createdItemId}/edit`);
          router.refresh();
        }, 1200);
        return;
      }

      setSubmitError("通信に失敗しました。時間をおいて再度お試しください。");
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
  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">アイテム管理</p>
            <h1 className="text-2xl font-bold text-gray-900">新規作成</h1>
          </div>

          <Link href="/items" className="text-sm font-medium text-blue-600 hover:underline">
            一覧に戻る
          </Link>
        </div>

        {draftInfoMessage && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700 shadow-sm">
            <p>{draftInfoMessage}</p>
            {itemImages.length > 0 && (
              <p className="mt-1 text-blue-600">
                候補画像 {itemImages.length} 枚もあわせて引き継ぎ対象として保持しています。
              </p>
            )}
          </section>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
            <p className="text-sm text-gray-500">「必須」が付いた項目は登録に必要です。</p>

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

            <div className="grid gap-4 md:grid-cols-2">
              <BrandNameField
                inputId="brand-name"
                value={brandName}
                onChange={setBrandName}
                saveAsCandidate={saveBrandAsCandidate}
                onSaveAsCandidateChange={setSaveBrandAsCandidate}
                disabled={submitting}
              />

              <div>
                <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="purchase-url" className="mb-1 block text-sm font-medium text-gray-700">
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
                <label htmlFor="purchased-at" className="mb-1 block text-sm font-medium text-gray-700">
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
              <label htmlFor="memo" className="mb-1 block text-sm font-medium text-gray-700">
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

            <div>
              <label htmlFor="care-status" className="mb-1 block text-sm font-medium text-gray-700">
                ケア状態
              </label>
              <select
                id="care-status"
                value={careStatus}
                onChange={(e) => setCareStatus(e.target.value as ItemCareStatus | "")}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value=""></option>
                {Object.entries(ITEM_CARE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                クリーニング中でもコーデ候補や着用履歴候補からは除外されません。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="size-gender" className="mb-1 block text-sm font-medium text-gray-700">
                  サイズ区分
                </label>
                <select
                  id="size-gender"
                  value={sizeGender}
                  onChange={(e) => setSizeGender(e.target.value as "women" | "men" | "unisex" | "")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value=""></option>
                  {Object.entries(ITEM_SIZE_GENDER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="size-label" className="mb-1 block text-sm font-medium text-gray-700">
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

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <label htmlFor="size-note" className="mb-1 block text-sm font-medium text-gray-700">
                  サイズ補足
                </label>
                <input
                  id="size-note"
                  type="text"
                  value={sizeNote}
                  onChange={(e) => setSizeNote(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <div className="mb-1 block text-sm font-medium text-transparent" aria-hidden="true">
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
            </div>

            <div>
              <label htmlFor="size-details-note" className="mb-1 block text-sm font-medium text-gray-700">
                実寸メモ
              </label>
              <textarea
                id="size-details-note"
                value={sizeDetailsNote}
                onChange={(e) => setSizeDetailsNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
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
              {errors.category && <p className="mt-2 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <FieldLabel htmlFor="shape" label="形" required />
              <select
                id="shape"
                value={shape}
                onChange={(e) => setShape(e.target.value)}
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
              {errors.shape && <p className="mt-2 text-sm text-red-600">{errors.shape}</p>}
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">画像</h2>
              <p className="mt-1 text-sm text-gray-500">
                {draftInfoMessage
                  ? "購入検討から引き継いだ画像を確認しながら、追加画像も一緒に登録できます。"
                  : "保存対象の画像を追加できます。"}
              </p>
            </div>

            <ItemImageUploader
              existingImages={itemImages}
              pendingImages={pendingImages}
              onPendingImagesChange={setPendingImages}
              onDeleteExistingImage={(image) => {
                setItemImages((current) =>
                  normalizeItemImages(
                    current.filter((currentImage) => !(
                      currentImage.path === image.path &&
                      currentImage.sort_order === image.sort_order &&
                      currentImage.original_filename === image.original_filename
                    )),
                  ),
                );
              }}
              disabled={submitting}
              helperText="引き継いだ画像も保存前に取り除けます。"
              existingHeading={itemImages.length > 0 ? "保存対象の画像" : undefined}
            />
          </section>

          {isTopsCategory && (
            <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="text-sm font-medium text-gray-700">トップス仕様</p>
                <p className="mt-1 text-xs text-gray-500">
                  トップス選択時のみ、形・袖・丈・首回り・デザイン・シルエットを指定できます。
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="tops-shape" className="mb-1 block text-sm font-medium text-gray-700">
                    形
                  </label>
                  <select
                    id="tops-shape"
                    value={topsShape}
                    onChange={(e) => handleTopsShapeChange(e.target.value)}
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
                  <label htmlFor="tops-sleeve" className="mb-1 block text-sm font-medium text-gray-700">
                    袖
                  </label>
                  <select
                    id="tops-sleeve"
                    value={topsSleeve}
                    onChange={(e) => setTopsSleeve(e.target.value as TopsSleeveValue | "")}
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
                  <label htmlFor="tops-length" className="mb-1 block text-sm font-medium text-gray-700">
                    丈
                  </label>
                  <select
                    id="tops-length"
                    value={topsLength}
                    onChange={(e) => setTopsLength(e.target.value as TopsLengthValue | "")}
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
                  <label htmlFor="tops-neck" className="mb-1 block text-sm font-medium text-gray-700">
                    首回り
                  </label>
                  <select
                    id="tops-neck"
                    value={topsNeck}
                    onChange={(e) => setTopsNeck(e.target.value as TopsNeckValue | "")}
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
                  <label htmlFor="tops-design" className="mb-1 block text-sm font-medium text-gray-700">
                    デザイン
                  </label>
                  <select
                    id="tops-design"
                    value={topsDesign}
                    onChange={(e) => setTopsDesign(e.target.value as TopsDesignValue | "")}
                    disabled={!topsShape || availableTopsDesigns.length === 0}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">{availableTopsDesigns.length ? "未選択" : "選択肢がありません"}</option>
                    {availableTopsDesigns.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tops-fit" className="mb-1 block text-sm font-medium text-gray-700">
                    シルエット
                  </label>
                  <select
                    id="tops-fit"
                    value={topsFit}
                    onChange={(e) => setTopsFit(e.target.value as TopsFitValue)}
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
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">色</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <FieldLabel as="div" label="メインカラー" required className="" />
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
                    <input type="color" value={customMainHex} onChange={(e) => setCustomMainHex(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1" />
                    <input type="text" value={customMainHex} onChange={(e) => setCustomMainHex(e.target.value)} className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.mainColor ? "border-red-400" : "border-gray-300"}`} />
                  </div>
                ) : (
                  <ColorSelect
                    value={mainColor}
                    onChange={setMainColor}
                    placeholder="選択してください"
                  />
                )}
                {errors.mainColor && <p className="mt-2 text-sm text-red-600">{errors.mainColor}</p>}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">サブカラー</label>
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
                    <input type="color" value={customSubHex} onChange={(e) => setCustomSubHex(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1" />
                    <input type="text" value={customSubHex} onChange={(e) => setCustomSubHex(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
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

            {(selectedMainColor || selectedSubColor) && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-sm font-medium text-gray-700">選択中の色</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMainColor && <ColorChip label={selectedMainColor.label} hex={selectedMainColor.hex} tone="main" />}
                  {selectedSubColor && <ColorChip label={selectedSubColor.label} hex={selectedSubColor.hex} tone="sub" />}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">季節・TPO</h2>

            <div>
              <p className="mb-2 text-sm font-medium">季節</p>
              <div className="flex flex-wrap gap-3">
                {SEASON_OPTIONS.map((season) => {
                  const checked = selectedSeasons.includes(season);
                  return (
                    <label key={season} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${checked ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-700"}`}>
                      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={() => toggleValue(season, selectedSeasons, setSelectedSeasons)} />
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
                    <label key={tpo.id} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${checked ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-700"}`}>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => toggleValue(tpo.id, selectedTpoIds, setSelectedTpoIds)}
                      />
                      {tpo.name}
                    </label>
                  );
                })}
                {tpoOptions.length === 0 ? (
                  <p className="text-sm text-gray-500">有効な TPO はまだありません。設定から追加できます。</p>
                ) : null}
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? "作成中..." : "作成する"}
            </button>

            <Link href="/items" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              キャンセル
            </Link>
          </div>
        </form>

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
        />

        {submitError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</div>}
        {submitSuccess && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{submitSuccess}</div>}
      </div>
    </main>
  );
}
