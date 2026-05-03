import type { ItemSpec } from "@/types/items";
import type { WeatherRecord } from "@/types/weather";

export type WearLogStatus = "planned" | "worn";

export type WearLogItemSourceType = "outfit" | "manual";

export type WearLogTemperatureFeel =
  | "cold"
  | "slightly_cold"
  | "comfortable"
  | "slightly_hot"
  | "hot";

export type WearLogOverallRating = "good" | "neutral" | "bad";

export type WearLogFeedbackTag =
  | "comfortable_all_day"
  | "temperature_gap_ready"
  | "rain_ready"
  | "morning_cold"
  | "day_cold"
  | "night_cold"
  | "morning_hot"
  | "day_hot"
  | "night_hot"
  | "rain_problem"
  | "wind_problem"
  | "aircon_cold"
  | "heating_hot"
  | "worked_for_tpo"
  | "too_casual"
  | "too_formal"
  | "color_worked_well"
  | "color_mismatch"
  | "mood_matched"
  | "mood_mismatch";

export type WearLogThumbnailItemColor = {
  role: "main" | "sub";
  hex: string;
  label: string | null;
};

export type WearLogThumbnailItem = {
  source_item_id: number | null;
  sort_order: number;
  category: string | null;
  shape: string | null;
  spec?: ItemSpec | null;
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
  overall_rating: WearLogOverallRating | null;
  feedback_tags: WearLogFeedbackTag[] | null;
  items_count: number;
  thumbnail_items: WearLogThumbnailItem[];
};

export type WearLogItemDetail = {
  id: number;
  source_item_id: number | null;
  item_name: string | null;
  source_item_status: "active" | "disposed" | null;
  source_item_care_status: "in_cleaning" | null;
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
  outdoor_temperature_feel: WearLogTemperatureFeel | null;
  indoor_temperature_feel: WearLogTemperatureFeel | null;
  overall_rating: WearLogOverallRating | null;
  feedback_tags: WearLogFeedbackTag[] | null;
  feedback_memo: string | null;
  weather_records: WeatherRecord[];
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
  outdoor_temperature_feel: WearLogTemperatureFeel | null;
  indoor_temperature_feel: WearLogTemperatureFeel | null;
  overall_rating: WearLogOverallRating | null;
  feedback_tags: WearLogFeedbackTag[] | null;
  feedback_memo: string;
  items: WearLogUpsertItem[];
};

export type WearLogMutationResponse = {
  message: string;
  wearLog: WearLogRecord;
};

export type WearLogCalendarDot = {
  status: WearLogStatus;
  has_feedback: boolean;
};

export type WeatherCalendarStatus = "none" | "forecast" | "observed" | "manual";

export type WearLogCalendarWeatherSummary = {
  status: WeatherCalendarStatus;
  weather_code: import("@/types/weather").WeatherCode | null;
  has_weather: boolean;
};

export type WearLogCalendarDaySummary = {
  date: string;
  plannedCount: number;
  wornCount: number;
  weather: WearLogCalendarWeatherSummary;
  has_feedback: boolean;
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
  outdoor_temperature_feel: WearLogTemperatureFeel | null;
  indoor_temperature_feel: WearLogTemperatureFeel | null;
  overall_rating: WearLogOverallRating | null;
  feedback_tags: WearLogFeedbackTag[] | null;
  thumbnail_items: WearLogThumbnailItem[];
};

export type WearLogByDateResponse = {
  event_date: string;
  wearLogs: WearLogByDateItem[];
  weatherRecords: WeatherRecord[];
};
