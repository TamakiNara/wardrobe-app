import { apiFetch } from "@/lib/api/client";
import type {
  WeatherForecastRequestPayload,
  WeatherForecastResponse,
  WeatherRecordMutationResponse,
  WeatherRecordsResponse,
  WeatherRecordUpsertPayload,
} from "@/types/weather";

export async function fetchWeatherRecordsByDate(
  date: string,
): Promise<WeatherRecordsResponse> {
  return apiFetch<WeatherRecordsResponse>(
    `/api/weather-records?date=${encodeURIComponent(date)}`,
  );
}

export async function createWeatherRecord(
  payload: WeatherRecordUpsertPayload,
): Promise<WeatherRecordMutationResponse> {
  return apiFetch<WeatherRecordMutationResponse>("/api/weather-records", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchWeatherForecast(
  payload: WeatherForecastRequestPayload,
): Promise<WeatherForecastResponse> {
  return apiFetch<WeatherForecastResponse>("/api/weather-records/forecast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateWeatherRecord(
  recordId: number,
  payload: Partial<WeatherRecordUpsertPayload>,
): Promise<WeatherRecordMutationResponse> {
  return apiFetch<WeatherRecordMutationResponse>(
    `/api/weather-records/${recordId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteWeatherRecord(
  recordId: number,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/weather-records/${recordId}`, {
    method: "DELETE",
  });
}
