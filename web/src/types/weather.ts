export type WeatherCondition = "sunny" | "cloudy" | "rain" | "snow" | "other";

export type WeatherRecord = {
  id: number;
  weather_date: string;
  location_id: number | null;
  location_name: string;
  location_name_snapshot: string;
  forecast_area_code_snapshot: string | null;
  weather_condition: WeatherCondition;
  temperature_high: number | null;
  temperature_low: number | null;
  memo: string | null;
  source_type: "manual" | "forecast_api" | "historical_api";
  source_name: string;
  source_fetched_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type WeatherRecordsResponse = {
  weatherRecords: WeatherRecord[];
};

export type WeatherRecordMutationResponse = {
  message: string;
  weatherRecord: WeatherRecord;
};

export type WeatherRecordUpsertPayload = {
  weather_date: string;
  location_id: number | null;
  location_name?: string | null;
  save_location?: boolean;
  weather_condition: WeatherCondition;
  temperature_high: number | null;
  temperature_low: number | null;
  memo: string | null;
};
