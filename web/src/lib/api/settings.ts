import { apiFetch } from "@/lib/api/client";
import type {
  CategoryVisibilitySettings,
  UpdateCategoryVisibilitySettingsPayload,
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