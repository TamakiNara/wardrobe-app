import { apiFetch } from "@/lib/api/client";
import type {
  CategoryVisibilitySettings,
  CreateUserBrandPayload,
  UpdateUserPreferencesPayload,
  UpdateUserBrandPayload,
  UpdateCategoryVisibilitySettingsPayload,
  UserPreferencesResponse,
  UserBrandRecord,
  UserBrandsResponse,
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
): Promise<{ message: string; preferences: UserPreferencesResponse["preferences"] }> {
  return apiFetch<{ message: string; preferences: UserPreferencesResponse["preferences"] }>(
    "/api/settings/preferences",
    {
      method: "PUT",
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
  return apiFetch<{ message: string; brand: UserBrandRecord }>("/api/settings/brands", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateUserBrand(
  brandId: number,
  payload: UpdateUserBrandPayload,
): Promise<{ message: string; brand: UserBrandRecord }> {
  return apiFetch<{ message: string; brand: UserBrandRecord }>(`/api/settings/brands/${brandId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
