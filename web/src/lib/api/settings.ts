import { apiFetch } from "@/lib/api/client";
import type {
  CategoryVisibilitySettings,
  CreateUserBrandPayload,
  CreateUserTpoPayload,
  CreateUserWeatherLocationPayload,
  UpdateUserPreferencesPayload,
  UpdateUserBrandPayload,
  UpdateUserTpoPayload,
  UpdateUserWeatherLocationPayload,
  UpdateCategoryVisibilitySettingsPayload,
  UserPreferencesResponse,
  UserBrandRecord,
  UserBrandsResponse,
  WeatherLocationGeocodeResponse,
  UserTpoRecord,
  UserTposResponse,
  UserWeatherLocationRecord,
  UserWeatherLocationsResponse,
} from "@/types/settings";

export async function fetchCategoryVisibilitySettings(): Promise<CategoryVisibilitySettings> {
  return apiFetch<CategoryVisibilitySettings>("/api/settings/categories");
}

export async function updateCategoryVisibilitySettings(
  payload: UpdateCategoryVisibilitySettingsPayload,
): Promise<CategoryVisibilitySettings> {
  return apiFetch<CategoryVisibilitySettings>("/api/settings/categories", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchUserPreferences(): Promise<UserPreferencesResponse> {
  return apiFetch<UserPreferencesResponse>("/api/settings/preferences");
}

export async function updateUserPreferences(
  payload: UpdateUserPreferencesPayload,
): Promise<{
  message: string;
  preferences: UserPreferencesResponse["preferences"];
}> {
  return apiFetch<{
    message: string;
    preferences: UserPreferencesResponse["preferences"];
  }>("/api/settings/preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchUserTpos(
  activeOnly = false,
): Promise<UserTposResponse> {
  const params = new URLSearchParams();

  if (activeOnly) {
    params.set("active_only", "1");
  }

  const search = params.toString();

  return apiFetch<UserTposResponse>(
    `/api/settings/tpos${search ? `?${search}` : ""}`,
  );
}

export async function createUserTpo(
  payload: CreateUserTpoPayload,
): Promise<{ message: string; tpo: UserTpoRecord }> {
  return apiFetch<{ message: string; tpo: UserTpoRecord }>(
    "/api/settings/tpos",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function updateUserTpo(
  tpoId: number,
  payload: UpdateUserTpoPayload,
): Promise<{ message: string; tpo: UserTpoRecord }> {
  return apiFetch<{ message: string; tpo: UserTpoRecord }>(
    `/api/settings/tpos/${tpoId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function fetchUserBrands(
  keyword?: string,
  activeOnly = true,
): Promise<UserBrandsResponse> {
  const params = new URLSearchParams();

  if (keyword) {
    params.set("keyword", keyword);
  }

  if (activeOnly) {
    params.set("active_only", "1");
  }

  const search = params.toString();

  return apiFetch<UserBrandsResponse>(
    `/api/settings/brands${search ? `?${search}` : ""}`,
  );
}

export async function createUserBrand(
  payload: CreateUserBrandPayload,
): Promise<{ message: string; brand: UserBrandRecord }> {
  return apiFetch<{ message: string; brand: UserBrandRecord }>(
    "/api/settings/brands",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function updateUserBrand(
  brandId: number,
  payload: UpdateUserBrandPayload,
): Promise<{ message: string; brand: UserBrandRecord }> {
  return apiFetch<{ message: string; brand: UserBrandRecord }>(
    `/api/settings/brands/${brandId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function fetchUserWeatherLocations(): Promise<UserWeatherLocationsResponse> {
  return apiFetch<UserWeatherLocationsResponse>(
    "/api/settings/weather-locations",
  );
}

export async function searchWeatherLocationGeocode(
  query: string,
): Promise<WeatherLocationGeocodeResponse> {
  const params = new URLSearchParams({
    query,
  });

  return apiFetch<WeatherLocationGeocodeResponse>(
    `/api/settings/weather-locations/geocode?${params.toString()}`,
  );
}

export async function createUserWeatherLocation(
  payload: CreateUserWeatherLocationPayload,
): Promise<{ message: string; location: UserWeatherLocationRecord }> {
  return apiFetch<{ message: string; location: UserWeatherLocationRecord }>(
    "/api/settings/weather-locations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function updateUserWeatherLocation(
  locationId: number,
  payload: UpdateUserWeatherLocationPayload,
): Promise<{ message: string; location: UserWeatherLocationRecord }> {
  return apiFetch<{ message: string; location: UserWeatherLocationRecord }>(
    `/api/settings/weather-locations/${locationId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteUserWeatherLocation(
  locationId: number,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/settings/weather-locations/${locationId}`,
    {
      method: "DELETE",
    },
  );
}
