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
import OutfitColorThumbnail from "@/components/outfits/outfit-color-thumbnail";
import { formatLocalDateYmd } from "@/lib/date/local-date";
import {
  findItemCategoryLabel,
  findItemShapeLabel,
  ITEM_CATEGORIES,
} from "@/lib/master-data/item-shapes";
import {
  getItemSubcategoryOptions,
  normalizeItemSubcategory,
  resolveCurrentItemSubcategoryValue,
} from "@/lib/master-data/item-subcategories";
import { ITEM_CARE_STATUS_LABELS } from "@/lib/items/metadata";
import { resolveItemPhotoThumbnail } from "@/lib/items/photo-thumbnail";
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
import type { ItemRecord, ItemSpec } from "@/types/items";
import type {
  WearLogFeedbackTag,
  WearLogDetailResponse,
  WearLogMutationResponse,
  WearLogOverallRating,
  WearLogRecord,
  WearLogStatus,
  WearLogTemperatureFeel,
} from "@/types/wear-logs";

type WearLogFormProps = {
  mode: "create" | "edit";
  wearLogId?: string;
  cancelHref?: string;
  footerAction?: ReactNode;
  initialStatus?: WearLogStatus;
  initialEventDate?: string;
  initialDisplayOrder?: number;
  initialCurrentSeason?: string;
};

type WearLogSubmitResponse = Partial<WearLogMutationResponse> & {
  errors?: unknown;
  message?: string;
};

type OutfitCandidate = {
  id: number;
  status?: "active" | "invalid";
  name: string | null;
  seasons?: string[];
  tpos?: string[];
  outfit_items?: Array<{
    id: number;
    item_id: number;
    sort_order: number;
    item: {
      id: number;
      name: string | null;
      category: string;
      shape: string;
      colors: {
        role: "main" | "sub";
        mode: "preset" | "custom";
        value: string;
        hex: string;
        label: string;
      }[];
      spec?: ItemSpec | null;
    };
  }>;
  outfitItems?: Array<{
    id: number;
    item_id: number;
    sort_order: number;
    item: {
      id: number;
      name: string | null;
      category: string;
      shape: string;
      colors: {
        role: "main" | "sub";
        mode: "preset" | "custom";
        value: string;
        hex: string;
        label: string;
      }[];
      spec?: ItemSpec | null;
    };
  }>;
};

function mapOutfitCandidateToSelectable(
  outfit: OutfitCandidate,
): WearLogSelectableOutfit {
  return {
    id: outfit.id,
    name: outfit.name,
    status: outfit.status ?? "active",
    seasons: outfit.seasons ?? [],
    tpos: outfit.tpos ?? [],
    itemCount: (outfit.outfitItems ?? outfit.outfit_items ?? []).length,
    outfitItems: outfit.outfitItems ?? outfit.outfit_items ?? [],
  };
}

const WEAR_LOG_FILTER_SEASONS = SEASON_OPTIONS.filter(
  (season) => season !== "オール",
);

function flattenFieldErrors(rawErrors: unknown): Record<string, string> {
  if (!rawErrors || typeof rawErrors !== "object") {
    return {};
  }

  return Object.entries(rawErrors).reduce<Record<string, string>>(
    (carry, [key, value]) => {
      const nextKey = key === "items" ? "selection" : key;

      if (Array.isArray(value) && value.length > 0) {
        return {
          ...carry,
          [nextKey]: String(value[0]),
        };
      }

      if (typeof value === "string" && value !== "") {
        return {
          ...carry,
          [nextKey]: value,
        };
      }

      return carry;
    },
    {},
  );
}

function scrollToFirstError(nextErrors: Record<string, string>) {
  const errorOrder = [
    "status",
    "event_date",
    "display_order",
    "selection",
    "memo",
  ];
  const firstErrorKey = errorOrder.find((key) => nextErrors[key]);

  if (!firstErrorKey) {
    return;
  }

  const target = document.querySelector<HTMLElement>(
    `[data-error-key="${firstErrorKey}"]`,
  );
  window.requestAnimationFrame(() => {
    target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  });
}

function matchesSeasonFilter(seasons: string[], filterSeason: string) {
  if (filterSeason === "") {
    return true;
  }

  if (seasons.length === 0) {
    return true;
  }

  return seasons.includes(filterSeason) || seasons.includes("オール");
}

function getOutfitItems(
  outfit: WearLogSelectableOutfit,
): NonNullable<WearLogSelectableOutfit["outfitItems"]> {
  return (outfit.outfitItems ?? []).reduce<
    NonNullable<WearLogSelectableOutfit["outfitItems"]>
  >((carry, outfitItem) => {
    const item = outfitItem.item;

    if (
      !item ||
      typeof item.category !== "string" ||
      item.category.trim() === "" ||
      typeof item.shape !== "string" ||
      item.shape.trim() === ""
    ) {
      return carry;
    }

    return [
      ...carry,
      {
        ...outfitItem,
        item: {
          ...item,
          colors: Array.isArray(item.colors) ? item.colors : [],
          spec: item.spec ?? null,
        },
      },
    ];
  }, []);
}

function getOutfitItemNameCandidates(
  outfit: WearLogSelectableOutfit,
): Array<string> {
  return (outfit.outfitItems ?? [])
    .map((outfitItem) => outfitItem.item?.name?.trim() || "名称未設定")
    .filter((name, index, array) => array.indexOf(name) === index);
}

function getOutfitItemNames(outfit: WearLogSelectableOutfit) {
  return getOutfitItemNameCandidates(outfit);
}

function renderOutfitItemNameList(itemNames: string[], className = "mt-1") {
  if (itemNames.length === 0) {
    return (
      <p className={`${className} text-xs text-gray-500`}>構成アイテム未設定</p>
    );
  }

  return (
    <ul
      className={`${className} space-y-1 border-l border-gray-200 pl-3 text-xs text-gray-500`}
    >
      {itemNames.map((name, index) => (
        <li key={`${name}:${index}`} className="leading-relaxed">
          {name}
        </li>
      ))}
    </ul>
  );
}

function getColorDisplayLabel(
  color: NonNullable<WearLogSelectableItem["colors"]>[number],
) {
  const customLabel = color.custom_label?.trim();

  if (customLabel) {
    return customLabel;
  }

  const label = color.label?.trim();
  return label || "色未設定";
}

function renderItemCandidateThumbnail(item: WearLogSelectableItem) {
  const image = resolveItemPhotoThumbnail(item.images);

  if (!image?.url) {
    return null;
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.original_filename ?? item.name ?? "item image"}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

type CandidateLoadStatus = "idle" | "loading" | "success" | "error";

function mapItemRecordToSelectable(item: ItemRecord): WearLogSelectableItem {
  return {
    id: item.id,
    name: item.name,
    status: item.status,
    care_status: item.care_status,
    brand_name: item.brand_name,
    category: item.category,
    subcategory: item.subcategory,
    shape: item.shape,
    colors: item.colors ?? [],
    images: item.images ?? [],
    seasons: item.seasons ?? [],
    tpos: item.tpos ?? [],
  };
}

export default function WearLogForm({
  mode,
  wearLogId,
  cancelHref = "/wear-logs",
  footerAction,
  initialStatus = "planned",
  initialEventDate,
  initialDisplayOrder = 1,
  initialCurrentSeason = "",
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
  const [outdoorTemperatureFeel, setOutdoorTemperatureFeel] =
    useState<WearLogTemperatureFeel | null>(null);
  const [indoorTemperatureFeel, setIndoorTemperatureFeel] =
    useState<WearLogTemperatureFeel | null>(null);
  const [overallRating, setOverallRating] =
    useState<WearLogOverallRating | null>(null);
  const [feedbackTags, setFeedbackTags] = useState<WearLogFeedbackTag[]>([]);
  const [feedbackMemo, setFeedbackMemo] = useState("");
  const [outfitKeyword, setOutfitKeyword] = useState("");
  const [outfitSeasonFilter, setOutfitSeasonFilter] =
    useState(initialCurrentSeason);
  const [outfitTpoFilter, setOutfitTpoFilter] = useState("");
  const [itemKeyword, setItemKeyword] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState("");
  const [itemSubcategoryFilter, setItemSubcategoryFilter] = useState("");
  const [itemSeasonFilter, setItemSeasonFilter] =
    useState(initialCurrentSeason);
  const [itemTpoFilter, setItemTpoFilter] = useState("");

  const [candidateItems, setCandidateItems] = useState<WearLogSelectableItem[]>(
    [],
  );
  const [candidateOutfits, setCandidateOutfits] = useState<
    WearLogSelectableOutfit[]
  >([]);
  const [selectedItems, setSelectedItems] = useState<SelectedWearLogItem[]>([]);
  const [initialWearLogData, setInitialWearLogData] =
    useState<WearLogRecord | null>(null);
  const [isItemListOpen, setIsItemListOpen] = useState(false);
  const [isOutfitListOpen, setIsOutfitListOpen] = useState(false);
  const [itemCandidateStatus, setItemCandidateStatus] =
    useState<CandidateLoadStatus>("idle");
  const [outfitCandidateStatus, setOutfitCandidateStatus] =
    useState<CandidateLoadStatus>("idle");
  const [relatedOutfitCandidates, setRelatedOutfitCandidates] = useState<
    WearLogSelectableOutfit[]
  >([]);
  const [relatedOutfitStatus, setRelatedOutfitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrorSummary, setFieldErrorSummary] = useState<string | null>(
    null,
  );
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

        setInitialWearLogData(wearLogData);
        setCandidateItems(mergeWearLogItemCandidates([], wearLogData));
        setCandidateOutfits(mergeWearLogOutfitCandidates([], wearLogData));
        setItemCandidateStatus("idle");
        setOutfitCandidateStatus("idle");
        setIsItemListOpen(false);
        setIsOutfitListOpen(false);
        if (wearLogData) {
          setStatus(wearLogData.status);
          setEventDate(wearLogData.event_date);
          setDisplayOrder(wearLogData.display_order);
          setSourceOutfitId(wearLogData.source_outfit_id);
          setMemo(wearLogData.memo ?? "");
          setOutdoorTemperatureFeel(wearLogData.outdoor_temperature_feel);
          setIndoorTemperatureFeel(wearLogData.indoor_temperature_feel);
          setOverallRating(wearLogData.overall_rating);
          setFeedbackTags(wearLogData.feedback_tags ?? []);
          setFeedbackMemo(wearLogData.feedback_memo ?? "");
          setSelectedItems(buildSelectedWearLogItems(wearLogData));
        } else {
          setStatus(initialStatus);
          setEventDate(initialEventDate ?? formatLocalDateYmd());
          setDisplayOrder(initialDisplayOrder);
          setOutdoorTemperatureFeel(null);
          setIndoorTemperatureFeel(null);
          setOverallRating(null);
          setFeedbackTags([]);
          setFeedbackMemo("");
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

  async function loadItemCandidates() {
    setItemCandidateStatus("loading");

    try {
      const result = await fetchAllPaginatedCandidates<ItemRecord, "items">(
        "/api/items",
        "items",
      );

      if (result.status === 401) {
        router.push("/login");
        return;
      }

      if (result.status !== 200) {
        setItemCandidateStatus("error");
        return;
      }

      setCandidateItems(
        mergeWearLogItemCandidates(
          result.entries.map(mapItemRecordToSelectable),
          initialWearLogData,
        ),
      );
      setItemCandidateStatus("success");
    } catch {
      setItemCandidateStatus("error");
    }
  }

  async function loadOutfitCandidates() {
    setOutfitCandidateStatus("loading");

    try {
      const result = await fetchAllPaginatedCandidates<
        OutfitCandidate,
        "outfits"
      >("/api/outfits", "outfits");

      if (result.status === 401) {
        router.push("/login");
        return;
      }

      if (result.status !== 200) {
        setOutfitCandidateStatus("error");
        return;
      }

      setCandidateOutfits(
        mergeWearLogOutfitCandidates(
          result.entries.map(mapOutfitCandidateToSelectable),
          initialWearLogData,
        ),
      );
      setOutfitCandidateStatus("success");
    } catch {
      setOutfitCandidateStatus("error");
    }
  }

  function handleItemListToggle() {
    setIsItemListOpen((current) => {
      const next = !current;

      if (
        next &&
        itemCandidateStatus !== "success" &&
        itemCandidateStatus !== "loading"
      ) {
        void loadItemCandidates();
      }

      return next;
    });
  }

  function handleOutfitListToggle() {
    setIsOutfitListOpen((current) => {
      const next = !current;

      if (
        next &&
        outfitCandidateStatus !== "success" &&
        outfitCandidateStatus !== "loading"
      ) {
        void loadOutfitCandidates();
      }

      return next;
    });
  }

  const selectedItemIds = useMemo(() => {
    return selectedItems.map((item) => item.sourceItemId);
  }, [selectedItems]);

  const singleManualSelectedItemId = useMemo(() => {
    if (sourceOutfitId !== null || selectedItems.length !== 1) {
      return null;
    }

    const [selectedItem] = selectedItems;

    return selectedItem.itemSourceType === "manual"
      ? selectedItem.sourceItemId
      : null;
  }, [selectedItems, sourceOutfitId]);

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
      )
      .reduce<
        (WearLogSelectableItem & {
          itemSourceType: "outfit" | "manual";
        })[]
      >((carry, item) => {
        if (carry.some((current) => current.id === item.id)) {
          return carry;
        }

        return [...carry, item];
      }, []);
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
  const visibleCandidateItems = useMemo(() => {
    return candidateItems.filter((item) => item.category !== "underwear");
  }, [candidateItems]);

  const availableItemCategoryValues = useMemo(() => {
    return Array.from(
      new Set(
        visibleCandidateItems
          .map((item) => item.category)
          .filter(
            (category): category is string =>
              typeof category === "string" && category !== "",
          ),
      ),
    );
  }, [visibleCandidateItems]);

  const availableItemSubcategoryOptions = useMemo(() => {
    if (itemCategoryFilter === "") {
      return [];
    }

    const availableSubcategoryValues = new Set(
      visibleCandidateItems
        .filter((item) => item.category === itemCategoryFilter)
        .map((item) =>
          resolveCurrentItemSubcategoryValue(
            itemCategoryFilter,
            item.shape,
            item.subcategory,
          ),
        )
        .filter(
          (subcategory): subcategory is string =>
            typeof subcategory === "string" && subcategory !== "",
        ),
    );

    return getItemSubcategoryOptions(itemCategoryFilter).filter((option) =>
      availableSubcategoryValues.has(option.value),
    );
  }, [visibleCandidateItems, itemCategoryFilter]);

  const filteredOutfits = useMemo(() => {
    const keyword = outfitKeyword.trim().toLowerCase();

    return candidateOutfits.filter((outfit) => {
      const matchKeyword =
        !keyword ||
        (outfit.name ?? "名称未設定").toLowerCase().includes(keyword);
      const seasons = outfit.seasons ?? [];
      const tpos = outfit.tpos ?? [];
      const matchSeason = matchesSeasonFilter(seasons, outfitSeasonFilter);
      const matchTpo = outfitTpoFilter === "" || tpos.includes(outfitTpoFilter);

      return matchKeyword && matchSeason && matchTpo;
    });
  }, [candidateOutfits, outfitKeyword, outfitSeasonFilter, outfitTpoFilter]);

  const filteredItems = useMemo(() => {
    const keyword = itemKeyword.trim().toLowerCase();
    const normalizedSubcategory =
      normalizeItemSubcategory(itemCategoryFilter, itemSubcategoryFilter) ?? "";

    return visibleCandidateItems
      .filter((item) => {
        const name = (item.name ?? "名称未設定").toLowerCase();
        const brand = (item.brand_name ?? "").toLowerCase();
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
          brand.includes(keyword) ||
          category.includes(keyword) ||
          shape.includes(keyword);
        const matchCategory =
          itemCategoryFilter === "" || item.category === itemCategoryFilter;
        const currentSubcategory =
          itemCategoryFilter === ""
            ? ""
            : (resolveCurrentItemSubcategoryValue(
                itemCategoryFilter,
                item.shape,
                item.subcategory,
              ) ?? "");
        const matchSubcategory =
          normalizedSubcategory === "" ||
          currentSubcategory === normalizedSubcategory;
        const matchSeason = matchesSeasonFilter(seasons, itemSeasonFilter);
        const matchTpo = itemTpoFilter === "" || tpos.includes(itemTpoFilter);

        return (
          matchKeyword &&
          matchCategory &&
          matchSubcategory &&
          matchSeason &&
          matchTpo
        );
      })
      .reduce<WearLogSelectableItem[]>((carry, item) => {
        if (carry.some((current) => current.id === item.id)) {
          return carry;
        }

        return [...carry, item];
      }, []);
  }, [
    visibleCandidateItems,
    itemKeyword,
    itemCategoryFilter,
    itemSubcategoryFilter,
    itemSeasonFilter,
    itemTpoFilter,
  ]);

  useEffect(() => {
    if (singleManualSelectedItemId === null) {
      setRelatedOutfitCandidates([]);
      setRelatedOutfitStatus("idle");
      return;
    }

    let active = true;

    async function loadRelatedOutfits() {
      setRelatedOutfitStatus("loading");

      try {
        const result = await fetchAllPaginatedCandidates<
          OutfitCandidate,
          "outfits"
        >(`/api/outfits?item_id=${singleManualSelectedItemId}`, "outfits");

        if (!active) {
          return;
        }

        if (result.status !== 200) {
          setRelatedOutfitCandidates([]);
          setRelatedOutfitStatus("error");
          return;
        }

        setRelatedOutfitCandidates(
          result.entries.map(mapOutfitCandidateToSelectable),
        );
        setRelatedOutfitStatus("success");
      } catch {
        if (!active) {
          return;
        }

        setRelatedOutfitCandidates([]);
        setRelatedOutfitStatus("error");
      }
    }

    void loadRelatedOutfits();

    return () => {
      active = false;
    };
  }, [singleManualSelectedItemId]);

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

  function handleSelectedItemRemove(itemId: number) {
    setSelectedItems((prev) =>
      prev.filter((item) => item.sourceItemId !== itemId),
    );
  }

  function handleSourceOutfitSelect(outfitId: number) {
    setSourceOutfitId(outfitId);
    setSelectedItems([]);
  }

  function handleSourceOutfitClear() {
    setSourceOutfitId(null);
    setSelectedItems([]);
  }

  function handleRelatedOutfitSelect(outfitId: number) {
    const relatedOutfit = relatedOutfitCandidates.find(
      (outfit) => outfit.id === outfitId,
    );

    if (relatedOutfit) {
      setCandidateOutfits((prev) => {
        if (prev.some((outfit) => outfit.id === outfitId)) {
          return prev;
        }

        return [relatedOutfit, ...prev];
      });
    }

    handleSourceOutfitSelect(outfitId);
    setRelatedOutfitCandidates([]);
    setRelatedOutfitStatus("idle");
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
            {getColorDisplayLabel(mainColor)}
          </span>
        )}
        {subColor && (
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
            <span
              className="h-3 w-3 rounded-full border border-gray-300"
              style={{ backgroundColor: subColor.hex }}
            />
            {getColorDisplayLabel(subColor)}
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
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrorSummary("入力内容を確認してください。");
      scrollToFirstError(nextErrors);
    } else {
      setFieldErrorSummary(null);
    }
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
      outdoorTemperatureFeel,
      indoorTemperatureFeel,
      overallRating,
      feedbackTags,
      feedbackMemo,
      selectedItems,
    });

    setSubmitting(true);
    setFieldErrorSummary(null);
    setSubmitSuccess(null);

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

      const data = (await response
        .json()
        .catch(() => null)) as WearLogSubmitResponse | null;

      if (response.status === 401) {
        setFieldErrorSummary(null);
        setSubmitError("セッションが切れました。再度ログインしてください。");

        window.setTimeout(() => {
          router.push("/login");
        }, 800);
        return;
      }

      if (!response.ok) {
        if (data?.errors) {
          const nextErrors = flattenFieldErrors(data.errors);
          setErrors(nextErrors);

          if (Object.keys(nextErrors).length === 0) {
            setFieldErrorSummary(null);
            setSubmitError("着用履歴を保存できませんでした。");
          } else {
            setFieldErrorSummary("入力内容を確認してください。");
            setSubmitError(null);
            scrollToFirstError(nextErrors);
          }
        } else {
          setFieldErrorSummary(null);
          setSubmitError(data?.message ?? "着用履歴を保存できませんでした。");
        }
        return;
      }

      setFieldErrorSummary(null);
      setSubmitSuccess(
        mode === "edit"
          ? "着用履歴を更新しました。"
          : "着用履歴を登録しました。",
      );

      const successRedirectHref =
        mode === "create" &&
        data?.wearLog?.status === "worn" &&
        typeof data.wearLog.id === "number"
          ? `/wear-logs/${data.wearLog.id}?created=1&next=reflection`
          : "/wear-logs";

      window.setTimeout(() => {
        router.push(successRedirectHref);
        router.refresh();
      }, 800);
    } catch {
      setFieldErrorSummary(null);
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

        <div data-error-key="status" className="scroll-mt-24">
          <FieldLabel as="div" label="状態" required />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as WearLogStatus)}
            className={`w-full rounded-lg bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 ${
              errors.status
                ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border border-gray-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          >
            <option value="planned">{WEAR_LOG_STATUS_LABELS.planned}</option>
            <option value="worn">{WEAR_LOG_STATUS_LABELS.worn}</option>
          </select>
          {errors.status && (
            <p className="mt-2 text-sm text-red-600">{errors.status}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div data-error-key="event_date" className="scroll-mt-24">
            <FieldLabel as="div" label="日付" required />
            <input
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className={`w-full rounded-lg bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 ${
                errors.event_date
                  ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border border-gray-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {errors.event_date && (
              <p className="mt-2 text-sm text-red-600">{errors.event_date}</p>
            )}
          </div>

          <div data-error-key="display_order" className="scroll-mt-24">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              表示順
            </label>
            <input
              type="number"
              min={1}
              value={displayOrder}
              onChange={(event) => setDisplayOrder(Number(event.target.value))}
              className={`w-full rounded-lg bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 ${
                errors.display_order
                  ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border border-gray-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {errors.display_order && (
              <p className="mt-2 text-sm text-red-600">
                {errors.display_order}
              </p>
            )}
          </div>
        </div>
      </section>

      <section
        className={`space-y-6 rounded-2xl ${errors.selection ? "border border-red-200 bg-red-50/20 p-5" : ""}`}
      >
        <div className="scroll-mt-24 space-y-2" data-error-key="selection">
          <FieldLabel
            as="div"
            label="コーディネート / アイテム"
            required
            className="text-lg font-semibold text-gray-900"
          />
          <p className="text-sm text-gray-500">
            どちらか1つ以上を選ぶと着用履歴を登録できます。
          </p>
          {errors.selection && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errors.selection}
            </div>
          )}
        </div>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                コーディネートを選択
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                名前、構成数、季節、TPOを見ながら選べます。
              </p>
            </div>
            <button
              type="button"
              data-testid="wear-log-outfit-list-toggle"
              aria-expanded={isOutfitListOpen}
              onClick={handleOutfitListToggle}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {isOutfitListOpen ? "一覧を閉じる" : "一覧を開く"}
            </button>
          </div>

          {currentSourceOutfit ? (
            <div
              data-testid="wear-log-selected-outfit-summary"
              className="rounded-xl border border-blue-100 bg-blue-50/70 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-900">
                    選択中のコーディネート
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {currentSourceOutfit.name ?? "名称未設定"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    コーディネートとして記録します。
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="wear-log-selected-outfit-clear"
                  onClick={handleSourceOutfitClear}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  解除
                </button>
              </div>
            </div>
          ) : null}

          {!isOutfitListOpen ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
              コーディネート候補一覧は閉じています。必要なときに開いて選択できます。
            </p>
          ) : (
            <div className="space-y-3">
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    季節
                  </label>
                  <select
                    data-testid="wear-log-outfit-season-filter"
                    value={outfitSeasonFilter}
                    onChange={(event) =>
                      setOutfitSeasonFilter(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

              {outfitCandidateStatus === "loading" ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                  コーディネート候補を読み込んでいます。
                </div>
              ) : null}

              {outfitCandidateStatus === "error" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                  コーディネート候補を取得できませんでした。
                </div>
              ) : null}

              {outfitCandidateStatus === "success" ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setSourceOutfitId(null)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        sourceOutfitId === null
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            指定しない
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
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
                      const outfitItems = getOutfitItems(outfit);
                      const itemNames = getOutfitItemNames(outfit);

                      return (
                        <div
                          key={outfit.id}
                          className={`rounded-lg border px-3 py-2 text-sm transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              data-testid={`wear-log-outfit-select-${outfit.id}`}
                              onClick={() =>
                                handleSourceOutfitSelect(outfit.id)
                              }
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="flex items-start gap-3">
                                {outfitItems.length > 0 ? (
                                  <div className="shrink-0 pt-0.5">
                                    <OutfitColorThumbnail
                                      outfitItems={outfitItems}
                                      size="small"
                                    />
                                  </div>
                                ) : null}
                                <div className="min-w-0 flex-1">
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
                                  {renderOutfitItemNameList(itemNames)}
                                </div>
                              </div>
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
                </>
              ) : null}
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
            <h2 className="text-lg font-semibold text-gray-900">
              アイテムを選択
            </h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                選択中 {selectedItems.length} 件
              </span>
              <button
                type="button"
                data-testid="wear-log-item-list-toggle"
                aria-expanded={isItemListOpen}
                onClick={handleItemListToggle}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {isItemListOpen ? "一覧を閉じる" : "一覧を開く"}
              </button>
            </div>
          </div>

          {!isItemListOpen ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
              アイテム候補一覧は閉じています。必要なときに開いて選択できます。
            </p>
          ) : (
            <div className="space-y-3">
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    カテゴリ
                  </label>
                  <select
                    data-testid="wear-log-item-category-filter"
                    value={itemCategoryFilter}
                    onChange={(event) => {
                      setItemCategoryFilter(event.target.value);
                      setItemSubcategoryFilter("");
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    種類
                  </label>
                  <select
                    data-testid="wear-log-item-subcategory-filter"
                    value={itemSubcategoryFilter}
                    onChange={(event) =>
                      setItemSubcategoryFilter(event.target.value)
                    }
                    disabled={
                      itemCategoryFilter === "" ||
                      availableItemSubcategoryOptions.length === 0
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">指定なし</option>
                    {availableItemSubcategoryOptions.map((subcategory) => (
                      <option key={subcategory.value} value={subcategory.value}>
                        {subcategory.label}
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
                    onChange={(event) =>
                      setItemSeasonFilter(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

              {itemCandidateStatus === "loading" ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                  アイテム候補を読み込んでいます。
                </div>
              ) : null}

              {itemCandidateStatus === "error" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                  アイテム候補を取得できませんでした。
                </div>
              ) : null}

              {itemCandidateStatus === "success" &&
              candidateItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                  候補に表示できるアイテムがありません。
                </div>
              ) : null}

              {itemCandidateStatus === "success" &&
              candidateItems.length > 0 &&
              filteredItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                  条件に一致するアイテム候補がありません。
                </div>
              ) : null}

              {itemCandidateStatus === "success" && filteredItems.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredItems.map((item) => {
                    const checked = selectedItemIds.includes(item.id);
                    const checkboxId = `wear-log-item-${item.id}`;
                    const thumbnail = renderItemCandidateThumbnail(item);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          checked
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
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

                          {thumbnail ? (
                            <div className="shrink-0">{thumbnail}</div>
                          ) : null}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <label
                                    htmlFor={checkboxId}
                                    className="cursor-pointer font-medium text-gray-900"
                                  >
                                    {item.name ?? "名称未設定"}
                                  </label>
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
                                <p className="mt-1 text-xs text-gray-500">
                                  {findItemCategoryLabel(item.category) ||
                                    "カテゴリ未設定"}
                                  {" / "}
                                  {findItemShapeLabel(
                                    item.category,
                                    item.shape,
                                  ) || "形未設定"}
                                  {item.brand_name?.trim()
                                    ? ` · ${item.brand_name.trim()}`
                                    : ""}
                                </p>
                              </div>
                              <Link
                                href={buildItemDetailHref(item.id)}
                                className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
                              >
                                詳細
                              </Link>
                            </div>
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
              ) : null}
            </div>
          )}

          {relatedOutfitStatus !== "idle" && (
            <div
              data-testid="wear-log-related-outfits"
              className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    このアイテムを含むコーディネート候補
                  </h3>
                  <p className="text-sm text-gray-600">
                    既存のコーディネートとして記録する場合は、候補から選択できます。
                  </p>
                </div>
                {singleManualSelectedItemId !== null ? (
                  <Link
                    href={`/outfits?item_id=${singleManualSelectedItemId}`}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    一覧で見る
                  </Link>
                ) : null}
              </div>

              {relatedOutfitStatus === "loading" ? (
                <p className="mt-4 text-sm text-gray-600">
                  コーディネート候補を確認しています。
                </p>
              ) : null}

              {relatedOutfitStatus === "error" ? (
                <p className="mt-4 text-sm text-red-700">
                  コーディネート候補を取得できませんでした。
                </p>
              ) : null}

              {relatedOutfitStatus === "success" &&
              relatedOutfitCandidates.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">
                  このアイテムを含むコーディネートはありません。
                </p>
              ) : null}

              {relatedOutfitStatus === "success" &&
              relatedOutfitCandidates.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {relatedOutfitCandidates.map((outfit) => {
                    const outfitItems = getOutfitItems(outfit);
                    const itemNames = getOutfitItemNames(outfit);

                    return (
                      <div
                        key={outfit.id}
                        className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          {outfitItems.length > 0 ? (
                            <div className="shrink-0 pt-0.5">
                              <OutfitColorThumbnail
                                outfitItems={outfitItems}
                                size="small"
                              />
                            </div>
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900">
                              {outfit.name ?? "名称未設定"}
                            </p>
                            {renderOutfitItemNameList(itemNames, "mt-2")}
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                              {(outfit.seasons ?? []).length > 0 ? (
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                                  季節: {(outfit.seasons ?? []).join(" / ")}
                                </span>
                              ) : null}
                              {(outfit.tpos ?? []).length > 0 ? (
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                                  TPO: {(outfit.tpos ?? []).join(" / ")}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRelatedOutfitSelect(outfit.id)}
                          className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          このコーディネートを使う
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
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
                          {item.brand_name?.trim()
                            ? ` · ${item.brand_name.trim()}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:shrink-0">
                      {sourceOutfitId === null &&
                      item.itemSourceType === "manual" ? (
                        <button
                          type="button"
                          data-testid={`wear-log-selected-item-remove-${item.id}`}
                          onClick={() => handleSelectedItemRemove(item.id)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          解除
                        </button>
                      ) : null}
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
      </section>

      <section className="space-y-4 scroll-mt-24" data-error-key="memo">
        <h2 className="text-lg font-semibold text-gray-900">着用メモ</h2>
        <p className="text-xs text-gray-500">
          予定やその日の状況をメモできます。
        </p>
        <textarea
          rows={3}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="例: 出社日、外回りあり、夜に食事"
          className={`w-full rounded-lg bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 ${
            errors.memo
              ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border border-gray-300 focus:border-blue-500 focus:ring-blue-100"
          }`}
        />
        {errors.memo && <p className="text-sm text-red-600">{errors.memo}</p>}
      </section>

      <div
        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4"
        data-testid="wear-log-form-actions"
      >
        {fieldErrorSummary && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {fieldErrorSummary}
          </div>
        )}
        {submitError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}
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

      {submitSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {submitSuccess}
        </div>
      )}
    </form>
  );
}
