import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/client";
import {
  createUserTpo,
  createUserBrand,
  fetchCategoryVisibilitySettings,
  fetchUserPreferences,
  fetchUserTpos,
  fetchUserBrands,
  updateUserBrand,
  updateCategoryVisibilitySettings,
  updateUserPreferences,
  updateUserTpo,
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

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/settings/brands?keyword=uni&active_only=1",
    );
    expect(result.brands[0].name).toBe("UNIQLO");
  });

  it("fetchUserPreferences calls the preferences endpoint", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      preferences: {
        currentSeason: "spring",
        defaultWearLogStatus: "planned",
        calendarWeekStart: "monday",
        skinTonePreset: "neutral_medium",
      },
    });

    const result = await fetchUserPreferences();

    expect(apiFetch).toHaveBeenCalledWith("/api/settings/preferences");
    expect(result.preferences.currentSeason).toBe("spring");
  });

  it("fetchUserTpos calls the tpos endpoint", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      tpos: [
        { id: 1, name: "仕事", sortOrder: 1, isActive: true, isPreset: true },
      ],
    });

    const result = await fetchUserTpos(true);

    expect(apiFetch).toHaveBeenCalledWith("/api/settings/tpos?active_only=1");
    expect(result.tpos[0].name).toBe("仕事");
  });

  it("updateUserPreferences sends a PUT request", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      message: "updated",
      preferences: {
        currentSeason: "winter",
        defaultWearLogStatus: null,
        calendarWeekStart: "sunday",
        skinTonePreset: "pink_medium",
      },
    });

    const payload = {
      currentSeason: "winter" as const,
      defaultWearLogStatus: null,
      calendarWeekStart: "sunday" as const,
      skinTonePreset: "pink_medium" as const,
    };

    await updateUserPreferences(payload);

    expect(apiFetch).toHaveBeenCalledWith("/api/settings/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
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

  it("createUserTpo sends a POST request", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      message: "created",
      tpo: {
        id: 4,
        name: "出張",
        sortOrder: 4,
        isActive: true,
        isPreset: false,
      },
    });

    const payload = {
      name: "出張",
    };

    await createUserTpo(payload);

    expect(apiFetch).toHaveBeenCalledWith("/api/settings/tpos", {
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

  it("updateUserTpo sends a PATCH request", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      message: "updated",
      tpo: {
        id: 4,
        name: "出張",
        sortOrder: 3,
        isActive: false,
        isPreset: false,
      },
    });

    const payload = {
      isActive: false,
      sortOrder: 3,
    };

    await updateUserTpo(4, payload);

    expect(apiFetch).toHaveBeenCalledWith("/api/settings/tpos/4", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  });
});
