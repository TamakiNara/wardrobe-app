import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/client";
import {
  fetchCategoryVisibilitySettings,
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
});