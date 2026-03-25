import { apiFetch } from "@/lib/api/client";
import type {
  CategoryVisibilitySettings,
  CreateUserBrandPayload,
  UpdateUserBrandPayload,
  UpdateCategoryVisibilitySettingsPayload,
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

export async function fetchUserBrands(keyword?: string): Promise<UserBrandsResponse> {
  const params = new URLSearchParams();

  if (keyword) {
    params.set("keyword", keyword);
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
