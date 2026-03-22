import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/components/auth/logout-button", () => ({
  default: () => React.createElement("button", { type: "button" }, "logout"),
}));

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("一覧APIの先頭ページ件数ではなく totalAll を表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: "Large User",
          email: "large-user@example.com",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: Array.from({ length: 12 }, (_, index) => ({ id: index + 1 })),
          meta: { totalAll: 36 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          outfits: Array.from({ length: 12 }, (_, index) => ({ id: index + 1 })),
          meta: { totalAll: 12 },
        }),
      });

    const { default: Home } = await import("./page");
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain("ようこそ Large User さん");
    expect(markup).toContain(">36<");
    expect(markup).toContain(">12<");
  });
});
