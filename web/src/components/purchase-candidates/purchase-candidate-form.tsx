"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import FieldLabel from "@/components/forms/field-label";
import ColorChip from "@/components/items/color-chip";
import ColorSelect from "@/components/items/color-select";
import PurchaseCandidateImageUploader from "@/components/purchase-candidates/purchase-candidate-image-uploader";
import { fetchCategoryGroups } from "@/lib/api/categories";
import { fetchCategoryVisibilitySettings } from "@/lib/api/settings";
import { ITEM_CATEGORIES } from "@/lib/master-data/item-shapes";
import { SEASON_OPTIONS, TPO_OPTIONS } from "@/lib/master-data/item-attributes";
import {
  ITEM_COLORS,
  type ItemColorValue,
} from "@/lib/master-data/item-colors";
import {
  PURCHASE_CANDIDATE_PRIORITY_LABELS,
  PURCHASE_CANDIDATE_SIZE_GENDER_LABELS,
  PURCHASE_CANDIDATE_STATUS_LABELS,
} from "@/lib/purchase-candidates/labels";
import type {
  CategoryGroupRecord,
  CategoryOption,
} from "@/types/categories";
import type {
  PurchaseCandidateDetailResponse,
  PurchaseCandidateImageRecord,
  PurchaseCandidatePriority,
  PurchaseCandidateRecord,
  PurchaseCandidateStatus,
  PurchaseCandidateUpsertPayload,
} from "@/types/purchase-candidates";

type PurchaseCandidateFormProps = {
  mode: "create" | "edit";
  candidateId?: string;
  cancelHref?: string;
  footerAction?: ReactNode;
};

const SUPPORTED_GROUP_IDS = new Set<string>(ITEM_CATEGORIES.map((item) => item.value));

function buildCategoryOptions(
  groups: CategoryGroupRecord[],
  visibleCategoryIds?: string[],
): CategoryOption[] {
  const visibleSet = visibleCategoryIds ? new Set(visibleCategoryIds) : null;

  return groups
    .filter((group) => SUPPORTED_GROUP_IDS.has(group.id))
    .flatMap((group) =>
      group.categories
        .filter((category) => {
          if (!visibleSet) {
            return true;
          }

          return visibleSet.has(category.id);
        })
        .map((category) => ({
          value: category.id,
          label: `${group.name} / ${category.name}`,
        })),
    );
}

function normalizeNullableString(value: string): string {
  return value.trim();
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

function extractFirstErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim() !== "") {
      const errors = (data as { errors?: Record<string, unknown> }).errors;
      if (!errors || message !== "The given data was invalid.") {
        return message;
      }
    }

    const errors = (data as { errors?: Record<string, unknown> }).errors;
    if (errors && typeof errors === "object") {
      for (const value of Object.values(errors)) {
        const first = Array.isArray(value) ? value[0] : value;
        if (typeof first === "string" && first.trim() !== "") {
          return first;
        }
      }
    }
  }

  return fallback;
}

export default function PurchaseCandidateForm({
  mode,
  candidateId,
  cancelHref = "/purchase-candidates",
  footerAction,
}: PurchaseCandidateFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState<PurchaseCandidateStatus>("considering");
  const [priority, setPriority] = useState<PurchaseCandidatePriority>("medium");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [wantedReason, setWantedReason] = useState("");
  const [memo, setMemo] = useState("");
  const [sizeGender, setSizeGender] = useState<"women" | "men" | "unisex" | "unknown" | "">("");
  const [sizeLabel, setSizeLabel] = useState("");
  const [sizeNote, setSizeNote] = useState("");
  const [isRainOk, setIsRainOk] = useState(false);

  const [mainColor, setMainColor] = useState<ItemColorValue | "">("");
  const [subColor, setSubColor] = useState<ItemColorValue | "">("");
  const [useCustomMainColor, setUseCustomMainColor] = useState(false);
  const [useCustomSubColor, setUseCustomSubColor] = useState(false);
  const [customMainHex, setCustomMainHex] = useState("#3B82F6");
  const [customSubHex, setCustomSubHex] = useState("#9CA3AF");
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedTpos, setSelectedTpos] = useState<string[]>([]);

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [existingImages, setExistingImages] = useState<PurchaseCandidateImageRecord[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setLoadError(null);

      try {
        const [groups, settings] = await Promise.all([
          fetchCategoryGroups(),
          fetchCategoryVisibilitySettings(),
        ]);

        setCategoryOptions(buildCategoryOptions(groups, settings.visibleCategoryIds));

        if (mode === "edit" && candidateId) {
          const response = await fetch(`/api/purchase-candidates/${candidateId}`, {
            headers: { Accept: "application/json" },
          });

          if (response.status === 401) {
            router.push("/login");
            return;
          }

          if (!response.ok) {
            router.push("/purchase-candidates");
            return;
          }

          const data = (await response.json()) as PurchaseCandidateDetailResponse;
          const candidate = data.purchaseCandidate;

          setStatus(candidate.status);
          setPriority(candidate.priority);
          setName(candidate.name);
          setCategoryId(candidate.category_id);
          setBrandName(candidate.brand_name ?? "");
          setPrice(candidate.price === null ? "" : String(candidate.price));
          setPurchaseUrl(candidate.purchase_url ?? "");
          setWantedReason(candidate.wanted_reason ?? "");
          setMemo(candidate.memo ?? "");
          setSizeGender(candidate.size_gender ?? "");
          setSizeLabel(candidate.size_label ?? "");
          setSizeNote(candidate.size_note ?? "");
          setIsRainOk(candidate.is_rain_ok);
          const main = candidate.colors.find((color) => color.role === "main");
          const sub = candidate.colors.find((color) => color.role === "sub");

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
          setExistingImages(candidate.images);
        }
      } catch {
        setLoadError("購入検討フォームの初期化に失敗しました。");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [candidateId, mode, router]);

  function toggleValue(value: string, current: string[], setter: (values: string[]) => void) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
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

  function buildPayload(): PurchaseCandidateUpsertPayload {
    const colors: PurchaseCandidateUpsertPayload["colors"] = [];

    if (selectedMainColor) {
      colors.push({
        role: "main" as const,
        mode: useCustomMainColor ? "custom" : "preset",
        value: useCustomMainColor ? customMainHex : mainColor,
        hex: selectedMainColor.hex,
        label: selectedMainColor.label,
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
      brand_name: normalizeNullableString(brandName) || null,
      price: price === "" ? null : Number(price),
      purchase_url: normalizeNullableString(purchaseUrl) || null,
      memo: memo.trim() || null,
      wanted_reason: wantedReason.trim() || null,
      size_gender: sizeGender || null,
      size_label: normalizeNullableString(sizeLabel) || null,
      size_note: sizeNote.trim() || null,
      is_rain_ok: isRainOk,
      colors,
      seasons: selectedSeasons,
      tpos: selectedTpos,
    };
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = "名前を入力してください。";
    }

    if (!categoryId) {
      nextErrors.category_id = "カテゴリを選択してください。";
    }

    if (!selectedMainColor) {
      nextErrors.colors = "メインカラーを選択してください。";
    }

    if (useCustomMainColor && !isValidHexColor(customMainHex)) {
      nextErrors.colors = "メインカラーのカラーコードを #RRGGBB 形式で入力してください。";
    }

    if (useCustomSubColor && !isValidHexColor(customSubHex)) {
      nextErrors.sub_color = "サブカラーのカラーコードを #RRGGBB 形式で入力してください。";
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

      const uploadResponse = await fetch(`/api/purchase-candidates/${targetCandidateId}/images`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const uploadData = await uploadResponse.json().catch(() => null);
        throw new Error(extractFirstErrorMessage(uploadData, "画像の追加に失敗しました。"));
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
        setSubmitError(data?.message ?? "保存に失敗しました。");
        if (data?.errors && typeof data.errors === "object") {
          const flattenedErrors: Record<string, string> = {};
          for (const [key, value] of Object.entries(data.errors)) {
            const first = Array.isArray(value) ? value[0] : value;
            if (typeof first === "string") {
              flattenedErrors[key] = first;
            }
          }
          setErrors((current) => ({ ...current, ...flattenedErrors }));
        }
        return;
      }

      const nextCandidate = data?.purchaseCandidate as PurchaseCandidateRecord | undefined;

      if (nextCandidate && pendingImages.length > 0) {
        await uploadPendingImages(nextCandidate.id);
      }

      setSubmitSuccess(mode === "edit" ? "更新に成功しました。" : "登録に成功しました。");
      window.setTimeout(() => {
        router.push(nextCandidate ? `/purchase-candidates/${nextCandidate.id}` : "/purchase-candidates");
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

  async function handleDeleteImage(imageId: number) {
    const response = await fetch(
      `/api/purchase-candidates/${candidateId}/images/${imageId}`,
      { method: "DELETE" },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setSubmitError(data?.message ?? "画像の削除に失敗しました。");
      return;
    }

    setExistingImages((current) => current.filter((image) => image.id !== imageId));
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
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
        <p className="text-sm text-gray-500">「必須」が付いた項目は登録に必要です。</p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="status" label="ステータス" />
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as PurchaseCandidateStatus)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="considering">{PURCHASE_CANDIDATE_STATUS_LABELS.considering}</option>
              <option value="on_hold">{PURCHASE_CANDIDATE_STATUS_LABELS.on_hold}</option>
              <option value="purchased">{PURCHASE_CANDIDATE_STATUS_LABELS.purchased}</option>
              <option value="dropped">{PURCHASE_CANDIDATE_STATUS_LABELS.dropped}</option>
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="priority" label="優先度" />
            <select
              id="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as PurchaseCandidatePriority)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="high">{PURCHASE_CANDIDATE_PRIORITY_LABELS.high}</option>
              <option value="medium">{PURCHASE_CANDIDATE_PRIORITY_LABELS.medium}</option>
              <option value="low">{PURCHASE_CANDIDATE_PRIORITY_LABELS.low}</option>
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
            className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.name ? "border-red-400" : "border-gray-300"}`}
          />
          {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <FieldLabel htmlFor="category_id" label="カテゴリ" required />
          <select
            id="category_id"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.category_id ? "border-red-400" : "border-gray-300"}`}
          >
            <option value="">選択してください</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="mt-2 text-sm text-red-600">{errors.category_id}</p>}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">購入情報</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="brand_name" className="mb-1 block text-sm font-medium text-gray-700">
              ブランド
            </label>
            <input
              id="brand_name"
              type="text"
              value={brandName}
              onChange={(event) => setBrandName(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
              想定価格
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 bg-white pr-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <input
                id="price"
                type="number"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="w-full rounded-lg bg-transparent px-4 py-3 text-gray-900 outline-none"
              />
              <span className="text-sm text-gray-500">円</span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="purchase_url" className="mb-1 block text-sm font-medium text-gray-700">
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
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">メモ</h2>

        <div>
          <label htmlFor="wanted_reason" className="mb-1 block text-sm font-medium text-gray-700">
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

        <div>
          <label htmlFor="memo" className="mb-1 block text-sm font-medium text-gray-700">
            メモ
          </label>
          <textarea
            id="memo"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">サイズ・属性</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <FieldLabel htmlFor="size_gender" label="サイズ区分" />
            <select
              id="size_gender"
              value={sizeGender}
              onChange={(event) => setSizeGender(event.target.value as typeof sizeGender)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">未設定</option>
              <option value="women">{PURCHASE_CANDIDATE_SIZE_GENDER_LABELS.women}</option>
              <option value="men">{PURCHASE_CANDIDATE_SIZE_GENDER_LABELS.men}</option>
              <option value="unisex">{PURCHASE_CANDIDATE_SIZE_GENDER_LABELS.unisex}</option>
              <option value="unknown">{PURCHASE_CANDIDATE_SIZE_GENDER_LABELS.unknown}</option>
            </select>
          </div>

          <div>
            <label htmlFor="size_label" className="mb-1 block text-sm font-medium text-gray-700">
              サイズ表記
            </label>
            <input
              id="size_label"
              type="text"
              value={sizeLabel}
              onChange={(event) => setSizeLabel(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <label className="inline-flex h-[50px] items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={isRainOk}
              onChange={(event) => setIsRainOk(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            雨対応
          </label>
        </div>

        <div>
          <label htmlFor="size_note" className="mb-1 block text-sm font-medium text-gray-700">
            サイズメモ
          </label>
          <textarea
            id="size_note"
            value={sizeNote}
            onChange={(event) => setSizeNote(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">色 / 季節 / TPO</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel label="メインカラー" required />
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  aria-label="メインカラーをカラーコードで入力"
                  checked={useCustomMainColor}
                  onChange={(event) => {
                    setUseCustomMainColor(event.target.checked);
                    if (event.target.checked) {
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
                    className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
                  />
                  <input
                    type="text"
                    aria-label="メインカラーコード"
                    value={customMainHex}
                    onChange={(event) => setCustomMainHex(event.target.value)}
                    className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.colors ? "border-red-400" : "border-gray-300"}`}
                  />
                </div>
              ) : (
                <ColorSelect
                  value={mainColor}
                  onChange={setMainColor}
                  placeholder="メインカラーを選択"
                />
              )}
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
                  onChange={(event) => {
                    setUseCustomSubColor(event.target.checked);
                    if (event.target.checked) {
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
                    className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
                  />
                  <input
                    type="text"
                    aria-label="サブカラーコード"
                    value={customSubHex}
                    onChange={(event) => setCustomSubHex(event.target.value)}
                    className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.sub_color ? "border-red-400" : "border-gray-300"}`}
                  />
                </div>
              ) : (
                <ColorSelect
                  value={subColor}
                  onChange={setSubColor}
                  placeholder="サブカラーを選択"
                  emptyOptionLabel="未設定"
                />
              )}
            </div>
          </div>
        </div>
        {errors.colors && <p className="text-sm text-red-600">{errors.colors}</p>}
        {errors.sub_color && <p className="text-sm text-red-600">{errors.sub_color}</p>}

        {(selectedMainColor || selectedSubColor) && (
          <div className="flex flex-wrap gap-2">
            {selectedMainColor && (
              <ColorChip label={selectedMainColor.label} hex={selectedMainColor.hex} tone="main" />
            )}
            {selectedSubColor && (
              <ColorChip label={selectedSubColor.label} hex={selectedSubColor.hex} tone="sub" />
            )}
          </div>
        )}

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
                  onClick={() => toggleValue(option, selectedTpos, setSelectedTpos)}
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
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">画像</h2>
          <p className="mt-1 text-sm text-gray-500">
            5枚まで登録できます。作成 / 更新後に追加画像を反映します。
          </p>
        </div>
        <PurchaseCandidateImageUploader
          existingImages={existingImages}
          pendingImages={pendingImages}
          onPendingImagesChange={setPendingImages}
          onDeleteExistingImage={mode === "edit" ? (imageId) => void handleDeleteImage(imageId) : undefined}
          disabled={submitting}
          helperText="一覧では代表画像を表示し、詳細や編集では画像全体を見やすく表示します。"
        />
      </section>

      {(submitError || submitSuccess) && (
        <section
          className={`rounded-xl border px-4 py-3 text-sm ${
            submitError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {submitError ?? submitSuccess}
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 md:flex-row md:items-center md:justify-between">
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
