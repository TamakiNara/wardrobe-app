export type WeatherCode =
  | "sunny"
  | "cloudy"
  | "rain"
  | "snow"
  | "thunder"
  | "fog"
  | "windy"
  | "other"
  | "sunny_then_cloudy"
  | "cloudy_then_sunny"
  | "cloudy_then_rain"
  | "rain_then_cloudy"
  | "sunny_with_occasional_clouds"
  | "cloudy_with_occasional_rain"
  | "sunny_with_occasional_rain";

export type WeatherRecord = {
  id: number;
  weather_date: string;
  location_id: number | null;
  location_name: string;
  location_name_snapshot: string;
  forecast_area_code_snapshot: string | null;
  weather_code: WeatherCode;
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
  weather_code: WeatherCode;
  temperature_high: number | null;
  temperature_low: number | null;
  memo: string | null;
  source_type?: "manual" | "forecast_api" | "historical_api";
  source_name?: string | null;
  source_fetched_at?: string | null;
};

export type WeatherForecastRequestPayload = {
  weather_date: string;
  location_id: number;
};

export type WeatherForecast = {
  weather_date: string;
  location_id: number;
  location_name: string;
  forecast_area_code: string | null;
  weather_code: WeatherCode;
  temperature_high: number | null;
  temperature_low: number | null;
  source_type: "forecast_api";
  source_name: string;
  source_fetched_at: string;
  raw_telop: string | null;
};

export type WeatherForecastResponse = {
  message: string;
  forecast: WeatherForecast;
};
