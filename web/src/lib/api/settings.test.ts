import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/client";
import {
  createUserBrand,
  fetchCategoryVisibilitySettings,
  fetchUserBrands,
  updateUserBrand,
  updateCategoryVisibilitySettings,
} from "@/lib/api/settings";

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}));

describe("settings api helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchCategoryVisibilitySettings calls the settings endpoint", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      visibleCategoryIds: ["tops_tshirt"],
    });

    const result = await fetchCategoryVisibilitySettings();

    expect(apiFetch).toHaveBeenCalledWith("/api/settings/categories");
    expect(result).toEqual({
      visibleCategoryIds: ["tops_tshirt"],
    });
  });

  it("updateCategoryVisibilitySettings sends a PUT request with JSON body", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      visibleCategoryIds: ["tops_tshirt", "outer_jacket"],
    });

    const payload = {
      visibleCategoryIds: ["tops_tshirt", "outer_jacket"],
    };

    const result = await updateCategoryVisibilitySettings(payload);

    expect(apiFetch).toHaveBeenCalledWith("/api/settings/categories", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(payload);
  });

  it("fetchUserBrands calls the brands endpoint with keyword", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      brands: [{ id: 1, name: "UNIQLO", kana: null, is_active: true }],
    });

    const result = await fetchUserBrands("uni");

    expect(apiFetch).toHaveBeenCalledWith("/api/settings/brands?keyword=uni&active_only=1");
    expect(result.brands[0].name).toBe("UNIQLO");
  });

  it("createUserBrand sends a POST request", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      message: "created",
      brand: { id: 1, name: "UNIQLO", kana: null, is_active: true },
    });

    const payload = {
      name: "UNIQLO",
      kana: null,
    };

    await createUserBrand(payload);

    expect(apiFetch).toHaveBeenCalledWith("/api/settings/brands", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  });

  it("updateUserBrand sends a PATCH request", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      message: "updated",
      brand: { id: 1, name: "GU", kana: "じーゆー", is_active: false },
    });

    const payload = {
      is_active: false,
    };

    await updateUserBrand(1, payload);

    expect(apiFetch).toHaveBeenCalledWith("/api/settings/brands/1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  });
});
