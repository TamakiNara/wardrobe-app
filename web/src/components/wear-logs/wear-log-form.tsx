"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import FieldLabel from "@/components/forms/field-label";
import {
  findItemCategoryLabel,
  findItemShapeLabel,
  ITEM_CATEGORIES,
} from "@/lib/master-data/item-shapes";
import { ITEM_CARE_STATUS_LABELS } from "@/lib/items/metadata";
import { SEASON_OPTIONS, TPO_OPTIONS } from "@/lib/master-data/item-attributes";
import { WEAR_LOG_STATUS_LABELS } from "@/lib/wear-logs/labels";
import {
  buildSelectedWearLogItems,
  buildWearLogPayload,
  mergeWearLogItemCandidates,
  mergeWearLogOutfitCandidates,
  type SelectedWearLogItem,
  type WearLogSelectableItem,
  type WearLogSelectableOutfit,
} from "@/lib/wear-logs/form";
import { fetchAllPaginatedCandidates } from "@/lib/wear-logs/candidates";
import type { ItemRecord } from "@/types/items";
import type {
  WearLogDetailResponse,
  WearLogRecord,
  WearLogStatus,
} from "@/types/wear-logs";

type WearLogFormProps = {
  mode: "create" | "edit";
  wearLogId?: string;
  cancelHref?: string;
  footerAction?: ReactNode;
  initialStatus?: WearLogStatus;
  initialEventDate?: string;
  initialDisplayOrder?: number;
};

type OutfitCandidate = {
  id: number;
  status?: "active" | "invalid";
  name: string | null;
  seasons?: string[];
  tpos?: string[];
  outfit_items?: Array<unknown>;
  outfitItems?: Array<unknown>;
};

const WEAR_LOG_FILTER_SEASONS = SEASON_OPTIONS.filter(
  (season) => season !== "オール",
);

export default function WearLogForm({
  mode,
  wearLogId,
  cancelHref = "/wear-logs",
  footerAction,
  initialStatus = "planned",
  initialEventDate,
  initialDisplayOrder = 1,
}: WearLogFormProps) {
  const router = useRouter();
  const returnToPath =
    mode === "edit" && wearLogId
      ? `/wear-logs/${wearLogId}/edit`
      : "/wear-logs/new";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState<WearLogStatus>(initialStatus);
  const [eventDate, setEventDate] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [sourceOutfitId, setSourceOutfitId] = useState<number | null>(null);
  const [memo, setMemo] = useState("");
  const [outfitKeyword, setOutfitKeyword] = useState("");
  const [outfitSeasonFilter, setOutfitSeasonFilter] = useState("");
  const [outfitTpoFilter, setOutfitTpoFilter] = useState("");
  const [itemKeyword, setItemKeyword] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState("");
  const [itemSeasonFilter, setItemSeasonFilter] = useState("");
  const [itemTpoFilter, setItemTpoFilter] = useState("");

  const [candidateItems, setCandidateItems] = useState<WearLogSelectableItem[]>(
    [],
  );
  const [candidateOutfits, setCandidateOutfits] = useState<
    WearLogSelectableOutfit[]
  >([]);
  const [selectedItems, setSelectedItems] = useState<SelectedWearLogItem[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setLoadError(null);

      try {
        let wearLogData: WearLogRecord | null = null;

        if (mode === "edit" && wearLogId) {
          const detailResponse = await fetch(`/api/wear-logs/${wearLogId}`, {
            headers: { Accept: "application/json" },
          });

          if (detailResponse.status === 401) {
            router.push("/login");
            return;
          }

          if (!detailResponse.ok) {
            router.push("/wear-logs");
            return;
          }

          const detailData =
            (await detailResponse.json()) as WearLogDetailResponse;
          wearLogData = detailData.wearLog;
        }

        const [itemsResult, outfitsResult] = await Promise.all([
          fetchAllPaginatedCandidates<ItemRecord, "items">(
            "/api/items",
            "items",
          ),
          fetchAllPaginatedCandidates<OutfitCandidate, "outfits">(
            "/api/outfits",
            "outfits",
          ),
        ]);

        if (itemsResult.status === 401 || outfitsResult.status === 401) {
          router.push("/login");
          return;
        }

        if (itemsResult.status !== 200 || outfitsResult.status !== 200) {
          setLoadError("着用履歴フォームの初期化に失敗しました。");
          return;
        }

        const nextItems = mergeWearLogItemCandidates(
          itemsResult.entries.map((item) => ({
            id: item.id,
            name: item.name,
            status: item.status,
            care_status: item.care_status,
            category: item.category,
            shape: item.shape,
            colors: item.colors ?? [],
            seasons: item.seasons ?? [],
            tpos: item.tpos ?? [],
          })),
          wearLogData,
        );
        const nextOutfits = mergeWearLogOutfitCandidates(
          outfitsResult.entries.map((outfit) => ({
            id: outfit.id,
            name: outfit.name,
            status: outfit.status ?? "active",
            seasons: outfit.seasons ?? [],
            tpos: outfit.tpos ?? [],
            itemCount: (outfit.outfitItems ?? outfit.outfit_items ?? []).length,
          })),
          wearLogData,
        );

        setCandidateItems(nextItems);
        setCandidateOutfits(nextOutfits);
        if (wearLogData) {
          setStatus(wearLogData.status);
          setEventDate(wearLogData.event_date);
          setDisplayOrder(wearLogData.display_order);
          setSourceOutfitId(wearLogData.source_outfit_id);
          setMemo(wearLogData.memo ?? "");
          setSelectedItems(buildSelectedWearLogItems(wearLogData));
        } else {
          setStatus(initialStatus);
          setEventDate(
            initialEventDate ?? new Date().toISOString().slice(0, 10),
          );
          setDisplayOrder(initialDisplayOrder);
          setSelectedItems([]);
        }
      } catch {
        setLoadError("着用履歴フォームの初期化に失敗しました。");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [
    initialDisplayOrder,
    initialEventDate,
    initialStatus,
    mode,
    router,
    wearLogId,
  ]);

  const selectedItemIds = useMemo(() => {
    return selectedItems.map((item) => item.sourceItemId);
  }, [selectedItems]);

  const selectedItemRecords = useMemo(() => {
    return selectedItems
      .map((selectedItem) => {
        const item = candidateItems.find(
          (candidate) => candidate.id === selectedItem.sourceItemId,
        );

        if (!item) {
          return null;
        }

        return {
          ...item,
          itemSourceType: selectedItem.itemSourceType,
        };
      })
      .filter(
        (
          item,
        ): item is WearLogSelectableItem & {
          itemSourceType: "outfit" | "manual";
        } => item !== null,
      );
  }, [candidateItems, selectedItems]);

  const currentSourceOutfit = useMemo(() => {
    if (sourceOutfitId === null) {
      return null;
    }

    return (
      candidateOutfits.find((outfit) => outfit.id === sourceOutfitId) ?? null
    );
  }, [candidateOutfits, sourceOutfitId]);

  const hasUnavailableSelectedItems = selectedItemRecords.some(
    (item) => item.status === "disposed",
  );
  const hasUnavailableSourceOutfit = currentSourceOutfit?.status === "invalid";
  const selectedCleaningItems = selectedItemRecords.filter(
    (item) => item.care_status === "in_cleaning",
  );

  const availableItemCategoryValues = useMemo(() => {
    return Array.from(
      new Set(
        candidateItems
          .map((item) => item.category)
          .filter(
            (category): category is string =>
              typeof category === "string" && category !== "",
          ),
      ),
    );
  }, [candidateItems]);

  const filteredOutfits = useMemo(() => {
    const keyword = outfitKeyword.trim().toLowerCase();

    return candidateOutfits.filter((outfit) => {
      const matchKeyword =
        !keyword ||
        (outfit.name ?? "名称未設定").toLowerCase().includes(keyword);
      const seasons = outfit.seasons ?? [];
      const tpos = outfit.tpos ?? [];
      const isAllSeason = seasons.length === 0 || seasons.includes("オール");
      const matchSeason =
        outfitSeasonFilter === "" ||
        (outfitSeasonFilter === "オール"
          ? isAllSeason
          : seasons.includes(outfitSeasonFilter) || isAllSeason);
      const matchTpo = outfitTpoFilter === "" || tpos.includes(outfitTpoFilter);

      return matchKeyword && matchSeason && matchTpo;
    });
  }, [candidateOutfits, outfitKeyword, outfitSeasonFilter, outfitTpoFilter]);

  const filteredItems = useMemo(() => {
    const keyword = itemKeyword.trim().toLowerCase();

    return candidateItems.filter((item) => {
      const name = (item.name ?? "名称未設定").toLowerCase();
      const category = (
        findItemCategoryLabel(item.category) ?? ""
      ).toLowerCase();
      const shape = (
        findItemShapeLabel(item.category, item.shape) ?? ""
      ).toLowerCase();
      const seasons = item.seasons ?? [];
      const tpos = item.tpos ?? [];
      const matchKeyword =
        !keyword ||
        name.includes(keyword) ||
        category.includes(keyword) ||
        shape.includes(keyword);
      const matchCategory =
        itemCategoryFilter === "" || item.category === itemCategoryFilter;
      const matchSeason =
        itemSeasonFilter === "" || seasons.includes(itemSeasonFilter);
      const matchTpo = itemTpoFilter === "" || tpos.includes(itemTpoFilter);

      return matchKeyword && matchCategory && matchSeason && matchTpo;
    });
  }, [
    candidateItems,
    itemKeyword,
    itemCategoryFilter,
    itemSeasonFilter,
    itemTpoFilter,
  ]);

  function buildItemDetailHref(itemId: number): string {
    return `/items/${itemId}?return_to=${encodeURIComponent(returnToPath)}&return_label=${encodeURIComponent("着用履歴フォーム")}`;
  }

  function buildOutfitDetailHref(outfitId: number): string {
    return `/outfits/${outfitId}?return_to=${encodeURIComponent(returnToPath)}&return_label=${encodeURIComponent("着用履歴フォーム")}`;
  }

  function handleItemToggle(itemId: number) {
    setSelectedItems((prev) => {
      const index = prev.findIndex((item) => item.sourceItemId === itemId);

      if (index >= 0) {
        return prev.filter((item) => item.sourceItemId !== itemId);
      }

      return [
        ...prev,
        {
          sourceItemId: itemId,
          itemSourceType: "manual",
        },
      ];
    });
  }

  function moveSelectedItem(sourceIndex: number, direction: -1 | 1) {
    setSelectedItems((prev) => {
      const targetIndex = sourceIndex + direction;

      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);

      return next;
    });
  }

  function renderColorSummary(item: WearLogSelectableItem) {
    const colors = item.colors ?? [];
    const mainColor = colors.find((color) => color.role === "main");
    const subColor = colors.find((color) => color.role === "sub");

    if (!mainColor && !subColor) {
      return null;
    }

    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {mainColor && (
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700">
            <span
              className="h-3 w-3 rounded-full border border-gray-300"
              style={{ backgroundColor: mainColor.hex }}
            />
            {mainColor.label}
          </span>
        )}
        {subColor && (
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
            <span
              className="h-3 w-3 rounded-full border border-gray-300"
              style={{ backgroundColor: subColor.hex }}
            />
            {subColor.label}
          </span>
        )}
      </div>
    );
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!eventDate) {
      nextErrors.event_date = "日付を指定してください。";
    }

    if (displayOrder < 1) {
      nextErrors.display_order = "表示順は 1 以上で指定してください。";
    }

    if (sourceOutfitId === null && selectedItems.length === 0) {
      nextErrors.selection =
        "コーディネートまたはアイテムを1件以上指定してください。";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm()) {
      return;
    }

    const payload = buildWearLogPayload({
      status,
      eventDate,
      displayOrder,
      sourceOutfitId,
      memo,
      selectedItems,
    });

    setSubmitting(true);

    try {
      const path =
        mode === "edit" && wearLogId
          ? `/api/wear-logs/${wearLogId}`
          : "/api/wear-logs";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setSubmitError("セッションが切れました。再度ログインしてください。");

        window.setTimeout(() => {
          router.push("/login");
        }, 800);
        return;
      }

      if (!response.ok) {
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0];

          if (Array.isArray(firstError) && firstError.length > 0) {
            setSubmitError(String(firstError[0]));
          } else {
            setSubmitError("着用履歴を保存できませんでした。");
          }
        } else {
          setSubmitError(data?.message ?? "着用履歴を保存できませんでした。");
        }
        return;
      }

      setSubmitSuccess(
        mode === "edit"
          ? "着用履歴を更新しました。"
          : "着用履歴を登録しました。",
      );

      window.setTimeout(() => {
        router.push("/wear-logs");
        router.refresh();
      }, 800);
    } catch {
      setSubmitError("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-gray-600">
          着用履歴フォームを読み込み中です...
        </p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        {loadError}
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      {(hasUnavailableSourceOutfit || hasUnavailableSelectedItems) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            現在は候補に使えないデータが含まれていますが、この記録の内容確認と更新は続けられます。
          </p>
          {hasUnavailableSourceOutfit && (
            <p className="mt-2 text-sm text-amber-800">
              元のコーディネートは現在利用できません。
            </p>
          )}
          {hasUnavailableSelectedItems && (
            <p className="mt-1 text-sm text-amber-800">
              手放し済みのアイテムが含まれています。
            </p>
          )}
        </div>
      )}

      {selectedCleaningItems.length > 0 && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            status === "worn"
              ? "border-amber-300 bg-amber-50"
              : "border-sky-200 bg-sky-50"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              status === "worn" ? "text-amber-900" : "text-sky-900"
            }`}
          >
            {status === "worn"
              ? "クリーニング中のアイテムが含まれています。着用済みとして登録する前に内容を確認してください。"
              : "クリーニング中のアイテムが含まれています。予定として保存はできますが、必要なら先に状態を確認してください。"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedCleaningItems.map((item) => (
              <Link
                key={`cleaning-${item.id}`}
                href={buildItemDetailHref(item.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  status === "worn"
                    ? "border-amber-300 bg-white text-amber-900"
                    : "border-sky-300 bg-white text-sky-800"
                }`}
              >
                {item.name ?? "名称未設定"}を確認
              </Link>
            ))}
          </div>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
        <p className="text-sm text-gray-500">
          「必須」が付いた項目は{mode === "edit" ? "更新" : "登録"}に必要です。
        </p>

        <div>
          <FieldLabel as="div" label="状態" required />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as WearLogStatus)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="planned">{WEAR_LOG_STATUS_LABELS.planned}</option>
            <option value="worn">{WEAR_LOG_STATUS_LABELS.worn}</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel as="div" label="日付" required />
            <input
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {errors.event_date && (
              <p className="mt-2 text-sm text-red-600">{errors.event_date}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              表示順
            </label>
            <input
              type="number"
              min={1}
              value={displayOrder}
              onChange={(event) => setDisplayOrder(Number(event.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {errors.display_order && (
              <p className="mt-2 text-sm text-red-600">
                {errors.display_order}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          元のコーディネート
        </h2>
        <p className="text-sm text-gray-500">
          名前、構成数、季節、TPOを見ながらベースにするコーディネートを選べます。
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            キーワードで絞り込む
          </label>
          <input
            data-testid="wear-log-outfit-search"
            type="search"
            value={outfitKeyword}
            onChange={(event) => setOutfitKeyword(event.target.value)}
            placeholder="コーディネート名で検索"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              季節
            </label>
            <select
              data-testid="wear-log-outfit-season-filter"
              value={outfitSeasonFilter}
              onChange={(event) => setOutfitSeasonFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">指定なし</option>
              {WEAR_LOG_FILTER_SEASONS.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              TPO
            </label>
            <select
              data-testid="wear-log-outfit-tpo-filter"
              value={outfitTpoFilter}
              onChange={(event) => setOutfitTpoFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">指定なし</option>
              {TPO_OPTIONS.map((tpo) => (
                <option key={tpo} value={tpo}>
                  {tpo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setSourceOutfitId(null)}
            className={`rounded-xl border px-4 py-4 text-left transition ${
              sourceOutfitId === null
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">指定しない</p>
                <p className="mt-1 text-sm text-gray-600">
                  アイテムのみで着用履歴を記録します。
                </p>
              </div>
              {sourceOutfitId === null ? (
                <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-xs font-medium text-blue-700">
                  選択中
                </span>
              ) : null}
            </div>
          </button>

          {filteredOutfits.map((outfit) => {
            const isSelected = sourceOutfitId === outfit.id;

            return (
              <div
                key={outfit.id}
                className={`rounded-xl border p-4 transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSourceOutfitId(outfit.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {outfit.name ?? "名称未設定"}
                      </p>
                      {isSelected ? (
                        <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-xs font-medium text-blue-700">
                          選択中
                        </span>
                      ) : null}
                      {outfit.status === "invalid" ? (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                          現在は利用不可
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      構成アイテム {outfit.itemCount ?? 0} 件
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      季節:{" "}
                      {outfit.seasons?.length
                        ? outfit.seasons.join(" / ")
                        : "未設定"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      TPO:{" "}
                      {outfit.tpos?.length ? outfit.tpos.join(" / ") : "未設定"}
                    </p>
                  </button>

                  <Link
                    href={buildOutfitDetailHref(outfit.id)}
                    className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
                  >
                    詳細
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOutfits.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
            条件に一致するコーディネート候補がありません。
          </div>
        )}

        {currentSourceOutfit?.status === "invalid" && (
          <p className="text-sm text-amber-800">
            現在は利用不可ですが、既存候補として確認できます。
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <FieldLabel
            as="div"
            label="アイテム"
            required
            className="text-lg font-semibold text-gray-900"
          />
          <span className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-700">
            選択中 {selectedItems.length} 件
          </span>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            キーワードで絞り込む
          </label>
          <input
            data-testid="wear-log-item-search"
            type="search"
            value={itemKeyword}
            onChange={(event) => setItemKeyword(event.target.value)}
            placeholder="アイテム名・カテゴリ・形で検索"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              カテゴリ
            </label>
            <select
              data-testid="wear-log-item-category-filter"
              value={itemCategoryFilter}
              onChange={(event) => setItemCategoryFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">指定なし</option>
              {ITEM_CATEGORIES.filter((category) =>
                availableItemCategoryValues.includes(category.value),
              ).map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              季節
            </label>
            <select
              data-testid="wear-log-item-season-filter"
              value={itemSeasonFilter}
              onChange={(event) => setItemSeasonFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">指定なし</option>
              {WEAR_LOG_FILTER_SEASONS.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              TPO
            </label>
            <select
              data-testid="wear-log-item-tpo-filter"
              value={itemTpoFilter}
              onChange={(event) => setItemTpoFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">指定なし</option>
              {TPO_OPTIONS.map((tpo) => (
                <option key={tpo} value={tpo}>
                  {tpo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {candidateItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
            候補に表示できるアイテムがありません。
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
            条件に一致するアイテム候補がありません。
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredItems.map((item) => {
              const checked = selectedItemIds.includes(item.id);
              const checkboxId = `wear-log-item-${item.id}`;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition ${
                    checked
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      id={checkboxId}
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={checked}
                      onChange={() => handleItemToggle(item.id)}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor={checkboxId}
                          className="cursor-pointer font-medium text-gray-900"
                        >
                          {item.name ?? "名称未設定"}
                        </label>
                        <Link
                          href={buildItemDetailHref(item.id)}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          詳細
                        </Link>
                        {item.status === "disposed" && (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                            手放し済み
                          </span>
                        )}
                        {item.care_status === "in_cleaning" && (
                          <span className="rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
                            {ITEM_CARE_STATUS_LABELS.in_cleaning}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {findItemCategoryLabel(item.category) ||
                          "カテゴリ未設定"}
                        {" / "}
                        {findItemShapeLabel(item.category, item.shape) ||
                          "形未設定"}
                      </p>
                      {renderColorSummary(item)}
                      {item.status === "disposed" && (
                        <p className="mt-1 text-sm text-amber-800">
                          このアイテムは現在の候補には使えません。
                        </p>
                      )}
                      {item.care_status === "in_cleaning" && (
                        <p className="mt-1 text-sm text-sky-800">
                          クリーニング中ですが、予定・着用履歴ともに保存はできます。
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {errors.selection && (
          <p className="text-sm text-red-600">{errors.selection}</p>
        )}

        {selectedItemRecords.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">
              選択中の順序
            </p>
            <ol className="space-y-2 text-sm text-gray-700">
              {selectedItemRecords.map((item, index) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {index + 1}. {item.name ?? "名称未設定"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                      <Link
                        href={buildItemDetailHref(item.id)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        詳細
                      </Link>
                      <span>
                        {item.itemSourceType === "outfit"
                          ? "コーデ由来"
                          : "手動追加"}
                      </span>
                      {item.care_status === "in_cleaning" ? (
                        <span className="rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
                          {ITEM_CARE_STATUS_LABELS.in_cleaning}
                        </span>
                      ) : null}
                      <span>
                        {findItemCategoryLabel(item.category) ||
                          "カテゴリ未設定"}
                        {" / "}
                        {findItemShapeLabel(item.category, item.shape) ||
                          "形未設定"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <button
                      type="button"
                      onClick={() => moveSelectedItem(index, -1)}
                      disabled={index === 0}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                      上へ
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSelectedItem(index, 1)}
                      disabled={index === selectedItemRecords.length - 1}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                      下へ
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">メモ</h2>
        <textarea
          rows={3}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </section>

      <div
        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4"
        data-testid="wear-log-form-actions"
      >
        <div
          className={`flex flex-col gap-3 sm:flex-row sm:items-center ${footerAction ? "sm:justify-between" : "sm:justify-end"}`}
        >
          {footerAction ? (
            <div className="flex items-center">{footerAction}</div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={cancelHref}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              キャンセル
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "送信中..."
                : mode === "edit"
                  ? "更新する"
                  : "登録する"}
            </button>
          </div>
        </div>
      </div>

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
    </form>
  );
}
