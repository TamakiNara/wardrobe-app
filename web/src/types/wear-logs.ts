export type WearLogStatus = "planned" | "worn";

export type WearLogItemSourceType = "outfit" | "manual";

export type WearLogThumbnailItemColor = {
  role: "main" | "sub";
  hex: string;
  label: string | null;
};

export type WearLogThumbnailItem = {
  source_item_id: number | null;
  category: string | null;
  colors: WearLogThumbnailItemColor[];
};

export type WearLogListItem = {
  id: number;
  status: WearLogStatus;
  event_date: string;
  display_order: number;
  source_outfit_id: number | null;
  source_outfit_name: string | null;
  source_outfit_status: "active" | "invalid" | null;
  has_disposed_items: boolean;
  memo: string | null;
  items_count: number;
  thumbnail_items: WearLogThumbnailItem[];
};

export type WearLogItemDetail = {
  id: number;
  source_item_id: number | null;
  item_name: string | null;
  source_item_status: "active" | "disposed" | null;
  sort_order: number;
  item_source_type: WearLogItemSourceType;
};

export type WearLogRecord = {
  id: number;
  status: WearLogStatus;
  event_date: string;
  display_order: number;
  source_outfit_id: number | null;
  source_outfit_name: string | null;
  source_outfit_status: "active" | "invalid" | null;
  memo: string | null;
  items: WearLogItemDetail[];
  created_at: string;
  updated_at: string;
};

export type WearLogsResponse = {
  wearLogs: WearLogListItem[];
  meta: {
    total: number;
    totalAll: number;
    page: number;
    lastPage: number;
  };
};

export type WearLogDetailResponse = {
  wearLog: WearLogRecord;
};

export type WearLogUpsertItem = {
  source_item_id: number;
  sort_order: number;
  item_source_type: WearLogItemSourceType;
};

export type WearLogUpsertPayload = {
  status: WearLogStatus;
  event_date: string;
  display_order: number;
  source_outfit_id: number | null;
  memo: string;
  items: WearLogUpsertItem[];
};

export type WearLogMutationResponse = {
  message: string;
  wearLog: WearLogRecord;
};

export type WearLogCalendarDot = {
  status: WearLogStatus;
};

export type WearLogCalendarDaySummary = {
  date: string;
  plannedCount: number;
  wornCount: number;
  dots: WearLogCalendarDot[];
  overflowCount: number;
};

export type WearLogCalendarResponse = {
  month: string;
  days: WearLogCalendarDaySummary[];
};

export type WearLogByDateItem = {
  id: number;
  status: WearLogStatus;
  event_date: string;
  display_order: number;
  source_outfit_name: string | null;
  items_count: number;
  memo: string | null;
};

export type WearLogByDateResponse = {
  event_date: string;
  wearLogs: WearLogByDateItem[];
};
