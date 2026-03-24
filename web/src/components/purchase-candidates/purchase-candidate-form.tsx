"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import ColorChip from "@/components/items/color-chip";
import ColorSelect from "@/components/items/color-select";
import { fetchCategoryGroups } from "@/lib/api/categories";
import { fetchCategoryVisibilitySettings } from "@/lib/api/settings";
import { ITEM_CATEGORIES } from "@/lib/master-data/item-shapes";
import { SEASON_OPTIONS, TPO_OPTIONS } from "@/lib/master-data/item-attributes";
import {
  ITEM_COLORS,
  type ItemColorValue,
} from "@/lib/master-data/item-colors";
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
    return ITEM_COLORS.find((color) => color.value === mainColor) ?? null;
  }, [mainColor]);

  const selectedSubColor = useMemo(() => {
    return ITEM_COLORS.find((color) => color.value === subColor) ?? null;
  }, [subColor]);

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
          setMainColor((candidate.colors.find((color) => color.role === "main")?.value as ItemColorValue | undefined) ?? "");
          setSubColor((candidate.colors.find((color) => color.role === "sub")?.value as ItemColorValue | undefined) ?? "");
          setSelectedSeasons(candidate.seasons);
          setSelectedTpos(candidate.tpos);
          setExistingImages(candidate.images);
        }
      } catch {
        setLoadError("購入候補フォームの初期化に失敗しました。");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [candidateId, mode, router]);

  function toggleValue(value: string, current: string[], setter: (values: string[]) => void) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function buildPayload(): PurchaseCandidateUpsertPayload {
    const colors: PurchaseCandidateUpsertPayload["colors"] = [];

    if (selectedMainColor) {
      colors.push({
        role: "main" as const,
        mode: "preset" as const,
        value: mainColor,
        hex: selectedMainColor.hex,
        label: selectedMainColor.label,
      });
    }

    if (selectedSubColor) {
      colors.push({
        role: "sub" as const,
        mode: "preset" as const,
        value: subColor,
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
        throw new Error(uploadData?.message ?? "画像の追加に失敗しました。");
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

  function handlePendingImageChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []);
    const remaining = Math.max(0, 5 - existingImages.length);
    setPendingImages(nextFiles.slice(0, remaining));
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

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
              status
            </label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as PurchaseCandidateStatus)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="considering">considering</option>
              <option value="on_hold">on_hold</option>
              <option value="purchased">purchased</option>
              <option value="dropped">dropped</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-medium text-gray-700">
              priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as PurchaseCandidatePriority)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            名前
          </label>
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
          <label htmlFor="category_id" className="mb-1 block text-sm font-medium text-gray-700">
            カテゴリ
          </label>
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
            <input
              id="price"
              type="number"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
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
            <label htmlFor="size_gender" className="mb-1 block text-sm font-medium text-gray-700">
              size_gender
            </label>
            <select
              id="size_gender"
              value={sizeGender}
              onChange={(event) => setSizeGender(event.target.value as typeof sizeGender)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">未設定</option>
              <option value="women">women</option>
              <option value="men">men</option>
              <option value="unisex">unisex</option>
              <option value="unknown">unknown</option>
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

          <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
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
            <label className="mb-1 block text-sm font-medium text-gray-700">メインカラー</label>
            <ColorSelect
              value={mainColor}
              onChange={setMainColor}
              placeholder="メインカラーを選択"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">サブカラー</label>
            <ColorSelect
              value={subColor}
              onChange={setSubColor}
              placeholder="サブカラーを選択"
              emptyOptionLabel="未設定"
            />
          </div>
        </div>
        {errors.colors && <p className="text-sm text-red-600">{errors.colors}</p>}

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
                  onClick={() => toggleValue(option, selectedSeasons, setSelectedSeasons)}
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

        {existingImages.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {existingImages.map((image) => (
              <article
                key={image.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {image.original_filename ?? "画像"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {image.sort_order}枚目{image.is_primary ? " / 代表画像" : ""}
                    </p>
                  </div>
                  {mode === "edit" && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteImage(image.id)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      削除
                    </button>
                  )}
                </div>

                {image.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={image.original_filename ?? "candidate image"}
                    className="mt-3 h-40 w-full rounded-lg object-cover"
                  />
                )}
              </article>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="images" className="mb-1 block text-sm font-medium text-gray-700">
            追加画像
          </label>
          <input
            id="images"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handlePendingImageChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
          {pendingImages.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {pendingImages.length}枚を次回保存時に追加します。
            </p>
          )}
        </div>
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
