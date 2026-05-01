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
import { ChevronDown, ChevronUp, Frown, Meh, Smile } from "lucide-react";
import FieldLabel from "@/components/forms/field-label";
import OutfitColorThumbnail from "@/components/outfits/outfit-color-thumbnail";
import { formatLocalDateYmd } from "@/lib/date/local-date";
import {
  findItemCategoryLabel,
  findItemShapeLabel,
  ITEM_CATEGORIES,
} from "@/lib/master-data/item-shapes";
import { ITEM_CARE_STATUS_LABELS } from "@/lib/items/metadata";
import { SEASON_OPTIONS, TPO_OPTIONS } from "@/lib/master-data/item-attributes";
import {
  getWearLogFeedbackTagLabel,
  WEAR_LOG_FEEDBACK_TAG_GROUPS,
  WEAR_LOG_OVERALL_RATING_LABELS,
  WEAR_LOG_STATUS_LABELS,
  WEAR_LOG_TEMPERATURE_FEEL_LABELS,
} from "@/lib/wear-logs/labels";
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
import type { ItemSpec } from "@/types/items";
import type {
  WearLogFeedbackTag,
  WearLogDetailResponse,
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

const TEMPERATURE_FEEL_OPTIONS: WearLogTemperatureFeel[] = [
  "cold",
  "slightly_cold",
  "comfortable",
  "slightly_hot",
  "hot",
];

const TEMPERATURE_FEEL_POSITION_MAP: Record<WearLogTemperatureFeel, number> = {
  cold: 0,
  slightly_cold: 1,
  comfortable: 2,
  slightly_hot: 3,
  hot: 4,
};

const TIME_OF_DAY_FEEDBACK_ROWS = [
  {
    label: "朝",
    cold: "morning_cold",
    hot: "morning_hot",
  },
  {
    label: "昼",
    cold: "day_cold",
    hot: "day_hot",
  },
  {
    label: "夜",
    cold: "night_cold",
    hot: "night_hot",
  },
] as const satisfies Array<{
  label: string;
  cold: WearLogFeedbackTag;
  hot: WearLogFeedbackTag;
}>;

const FEEDBACK_GROUP_SECTION_CLASS_NAME =
  "space-y-3 rounded-lg border border-gray-200 bg-white/80 p-4";

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

function TemperatureFeelSlider({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: WearLogTemperatureFeel | null;
  onChange: (nextValue: WearLogTemperatureFeel | null) => void;
}) {
  const selectedValue = value ?? "comfortable";
  const sliderValue = TEMPERATURE_FEEL_POSITION_MAP[selectedValue];
  const currentLabel = WEAR_LOG_TEMPERATURE_FEEL_LABELS[selectedValue];

  return (
    <div className="space-y-2" data-testid={name}>
      <FieldLabel as="div" label={label} />

      <div className="space-y-2">
        <div className="flex items-center justify-center text-xs font-medium text-slate-600">
          <span className="rounded-md border border-slate-200 bg-white/90 px-2.5 py-1 shadow-sm">
            {currentLabel}
          </span>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#b9d2f6_0%,#dbe7fa_24%,#f8fafc_50%,#f6dfd8_76%,#ebb8ac_100%)] shadow-inner" />
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={sliderValue}
            onChange={(event) =>
              onChange(
                TEMPERATURE_FEEL_OPTIONS[
                  Number.parseInt(event.target.value, 10)
                ] ?? null,
              )
            }
            className="relative z-10 h-7 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-300 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-300 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
          />
        </div>
        <div className="grid grid-cols-3 text-[11px] text-gray-500">
          <span className="justify-self-start whitespace-nowrap">寒い</span>
          <span className="justify-self-center whitespace-nowrap">
            ちょうどいい
          </span>
          <span className="justify-self-end whitespace-nowrap">暑い</span>
        </div>
      </div>
    </div>
  );
}

function OverallRatingButtons({
  value,
  onChange,
}: {
  value: WearLogOverallRating | null;
  onChange: (nextValue: WearLogOverallRating | null) => void;
}) {
  const options: Array<{
    value: WearLogOverallRating;
    label: string;
    Icon: typeof Smile;
    activeClassName: string;
    inactiveClassName: string;
  }> = [
    {
      value: "good",
      label: WEAR_LOG_OVERALL_RATING_LABELS.good,
      Icon: Smile,
      activeClassName:
        "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm",
      inactiveClassName:
        "border-gray-200 bg-white text-slate-600 hover:bg-slate-50",
    },
    {
      value: "neutral",
      label: WEAR_LOG_OVERALL_RATING_LABELS.neutral,
      Icon: Meh,
      activeClassName: "border-slate-500 bg-slate-100 text-slate-700 shadow-sm",
      inactiveClassName:
        "border-gray-200 bg-white text-slate-600 hover:bg-slate-50",
    },
    {
      value: "bad",
      label: WEAR_LOG_OVERALL_RATING_LABELS.bad,
      Icon: Frown,
      activeClassName: "border-amber-500 bg-amber-50 text-amber-700 shadow-sm",
      inactiveClassName:
        "border-gray-200 bg-white text-slate-600 hover:bg-slate-50",
    },
  ];

  return (
    <div className="space-y-2" data-testid="overall-rating">
      <FieldLabel as="div" label="総合評価" />
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.value;
          const Icon = option.Icon;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : option.value)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${
                selected ? option.activeClassName : option.inactiveClassName
              }`}
            >
              <Icon className={`h-4 w-4 ${selected ? "" : "text-slate-500"}`} />
              <span className={selected ? "font-semibold" : "font-medium"}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
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
    useState<WearLogTemperatureFeel | null>("comfortable");
  const [indoorTemperatureFeel, setIndoorTemperatureFeel] =
    useState<WearLogTemperatureFeel | null>("comfortable");
  const [overallRating, setOverallRating] =
    useState<WearLogOverallRating | null>(null);
  const [feedbackTags, setFeedbackTags] = useState<WearLogFeedbackTag[]>([]);
  const [feedbackMemo, setFeedbackMemo] = useState("");
  const [showConcernFeedback, setShowConcernFeedback] = useState(false);
  const [outfitKeyword, setOutfitKeyword] = useState("");
  const [outfitSeasonFilter, setOutfitSeasonFilter] =
    useState(initialCurrentSeason);
  const [outfitTpoFilter, setOutfitTpoFilter] = useState("");
  const [itemKeyword, setItemKeyword] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState("");
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
            outfitItems: outfit.outfitItems ?? outfit.outfit_items ?? [],
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
          setOutdoorTemperatureFeel(
            wearLogData.outdoor_temperature_feel ?? "comfortable",
          );
          setIndoorTemperatureFeel(
            wearLogData.indoor_temperature_feel ?? "comfortable",
          );
          setOverallRating(wearLogData.overall_rating);
          setFeedbackTags(wearLogData.feedback_tags ?? []);
          setFeedbackMemo(wearLogData.feedback_memo ?? "");
          setSelectedItems(buildSelectedWearLogItems(wearLogData));
        } else {
          setStatus(initialStatus);
          setEventDate(initialEventDate ?? formatLocalDateYmd());
          setDisplayOrder(initialDisplayOrder);
          setOutdoorTemperatureFeel("comfortable");
          setIndoorTemperatureFeel("comfortable");
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

    return visibleCandidateItems
      .filter((item) => {
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
        const matchSeason = matchesSeasonFilter(seasons, itemSeasonFilter);
        const matchTpo = itemTpoFilter === "" || tpos.includes(itemTpoFilter);

        return matchKeyword && matchCategory && matchSeason && matchTpo;
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
    itemSeasonFilter,
    itemTpoFilter,
  ]);

  function toggleFeedbackTag(tag: WearLogFeedbackTag) {
    setFeedbackTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((current) => current !== tag);
      }

      return [...prev, tag];
    });
  }

  function replaceExclusiveFeedbackTags(
    groupTags: WearLogFeedbackTag[],
    nextTag: WearLogFeedbackTag | null,
  ) {
    setFeedbackTags((prev) => {
      const base = prev.filter((tag) => !groupTags.includes(tag));

      if (!nextTag) {
        return base;
      }

      return [...base, nextTag];
    });
  }

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

      const data = await response.json().catch(() => null);

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

      window.setTimeout(() => {
        router.push("/wear-logs");
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
          <h2 className="text-lg font-semibold text-gray-900">
            コーディネートを選択
          </h2>
          <p className="text-sm text-gray-500">
            名前、構成数、季節、TPOを見ながら選べます。
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
              const outfitItems = getOutfitItems(outfit);
              const itemNamesLabel = getOutfitItemNames(outfit).join(" / ");

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
                          <p className="mt-2 text-sm text-gray-600">
                            {itemNamesLabel || "構成アイテム未設定"}
                          </p>
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
            <span className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-700">
              選択中 {selectedItems.length} 件
            </span>
          </div>

          <div className="space-y-4">
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
                  onChange={(event) =>
                    setItemCategoryFilter(event.target.value)
                  }
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
          </div>

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
      </section>

      <section className="space-y-6 rounded-2xl border border-gray-200 bg-gray-50/40 p-5 md:p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">振り返り</h2>
          <p className="text-sm text-gray-500">
            その日の服装全体がどうだったかを、必要な項目だけ軽く残せます。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <OverallRatingButtons
              value={overallRating}
              onChange={setOverallRating}
            />
          </div>
          <TemperatureFeelSlider
            name="outdoor-temperature-feel"
            label="屋外の温度感"
            value={outdoorTemperatureFeel}
            onChange={setOutdoorTemperatureFeel}
          />
          <TemperatureFeelSlider
            name="indoor-temperature-feel"
            label="屋内の温度感"
            value={indoorTemperatureFeel}
            onChange={setIndoorTemperatureFeel}
          />
        </div>

        <div className="space-y-4">
          <section className={FEEDBACK_GROUP_SECTION_CLASS_NAME}>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">
                よかったこと
              </h3>
              <p className="text-xs text-gray-500">
                特に印象がよかった点だけ残します。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {WEAR_LOG_FEEDBACK_TAG_GROUPS.positives.map((tag) => {
                const selected = feedbackTags.includes(tag);

                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleFeedbackTag(tag)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
                    }`}
                  >
                    {getWearLogFeedbackTagLabel(tag)}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={FEEDBACK_GROUP_SECTION_CLASS_NAME}>
            <button
              type="button"
              aria-expanded={showConcernFeedback}
              onClick={() => setShowConcernFeedback((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  気になったこと
                </h3>
                <p className="text-xs text-gray-500">
                  必要なときだけ開いて記録します。
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {showConcernFeedback ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {showConcernFeedback ? (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">時間帯</p>
                  <div className="grid gap-3 md:grid-cols-3 md:justify-items-center">
                    {TIME_OF_DAY_FEEDBACK_ROWS.map((row) => {
                      const selectedTag = feedbackTags.includes(row.cold)
                        ? row.cold
                        : feedbackTags.includes(row.hot)
                          ? row.hot
                          : null;

                      return (
                        <div
                          key={row.cold}
                          className="flex flex-wrap items-center justify-center gap-2 px-1 py-1 md:justify-center"
                        >
                          <p className="text-sm font-medium text-gray-700">
                            {row.label}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { tag: row.cold, label: "寒い" },
                              { tag: row.hot, label: "暑い" },
                            ].map((option) => {
                              const selected = selectedTag === option.tag;

                              return (
                                <button
                                  key={option.tag}
                                  type="button"
                                  aria-pressed={selected}
                                  onClick={() =>
                                    replaceExclusiveFeedbackTags(
                                      [row.cold, row.hot],
                                      selected ? null : option.tag,
                                    )
                                  }
                                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition sm:text-sm ${
                                    selected
                                      ? option.tag === row.cold
                                        ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm"
                                        : "border-rose-500 bg-rose-50 text-rose-700 shadow-sm"
                                      : option.tag === row.cold
                                        ? "border-gray-300 bg-white text-gray-700 hover:border-sky-300 hover:text-sky-700"
                                        : "border-gray-300 bg-white text-gray-700 hover:border-rose-300 hover:text-rose-700"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">
                    天気・環境
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {WEAR_LOG_FEEDBACK_TAG_GROUPS.weatherEnvironment.map(
                      (tag) => {
                        const selected = feedbackTags.includes(tag);

                        return (
                          <button
                            key={tag}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleFeedbackTag(tag)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                              selected
                                ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                                : "border-gray-300 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-700"
                            }`}
                          >
                            {getWearLogFeedbackTagLabel(tag)}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className={FEEDBACK_GROUP_SECTION_CLASS_NAME}>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">
                TPO・見た目
              </h3>
              <p className="text-xs text-gray-500">
                場面や見た目の印象を振り返ります。
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="min-w-20 text-sm font-medium text-gray-700">
                  TPO
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      tag: "too_casual" as const,
                      label: "カジュアルすぎた",
                    },
                    {
                      tag: "worked_for_tpo" as const,
                      label: "合っていた",
                    },
                    {
                      tag: "too_formal" as const,
                      label: "きちんとしすぎた",
                    },
                  ].map((option) => {
                    const selected = feedbackTags.includes(option.tag);

                    return (
                      <button
                        key={option.tag}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          replaceExclusiveFeedbackTags(
                            ["too_casual", "worked_for_tpo", "too_formal"],
                            selected ? null : option.tag,
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                          selected
                            ? option.tag === "worked_for_tpo"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                              : "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                            : option.tag === "worked_for_tpo"
                              ? "border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="min-w-20 text-sm font-medium text-gray-700">
                  色合わせ
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      tag: "color_worked_well" as const,
                      label: "よかった",
                    },
                    {
                      tag: "color_mismatch" as const,
                      label: "微妙だった",
                    },
                  ].map((option) => {
                    const selected = feedbackTags.includes(option.tag);

                    return (
                      <button
                        key={option.tag}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          replaceExclusiveFeedbackTags(
                            ["color_mismatch", "color_worked_well"],
                            selected ? null : option.tag,
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                          selected
                            ? option.tag === "color_worked_well"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                              : "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                            : option.tag === "color_worked_well"
                              ? "border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="min-w-20 text-sm font-medium text-gray-700">
                  気分
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      tag: "mood_matched" as const,
                      label: "気分に合っていた",
                    },
                    {
                      tag: "mood_mismatch" as const,
                      label: "気分と合わなかった",
                    },
                  ].map((option) => {
                    const selected = feedbackTags.includes(option.tag);

                    return (
                      <button
                        key={option.tag}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          replaceExclusiveFeedbackTags(
                            ["mood_matched", "mood_mismatch"],
                            selected ? null : option.tag,
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                          selected
                            ? option.tag === "mood_matched"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                              : "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                            : option.tag === "mood_matched"
                              ? "border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-2">
          <FieldLabel as="div" label="振り返りメモ" />
          <p className="text-xs text-gray-500">
            選択肢だけでは残しきれないことを自由に書けます。
          </p>
          <textarea
            rows={4}
            value={feedbackMemo}
            onChange={(event) => setFeedbackMemo(event.target.value)}
            placeholder="気になったことや、次回の参考にしたいことを残せます。"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      <section className="space-y-4 scroll-mt-24" data-error-key="memo">
        <h2 className="text-lg font-semibold text-gray-900">メモ</h2>
        <textarea
          rows={3}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
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
