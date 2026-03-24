import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/components/wear-logs/wear-log-form", () => ({
  default: ({ wearLogId }: { wearLogId: string }) =>
    React.createElement("div", null, `wear-log-form:${wearLogId}`),
}));

vi.mock("@/components/wear-logs/delete-wear-log-button", () => ({
  default: ({ wearLogId }: { wearLogId: string }) =>
    React.createElement("div", null, `delete-wear-log-button:${wearLogId}`),
}));

describe("EditWearLogPage", () => {
  it("編集画面に削除導線を表示する", async () => {
    const { default: EditWearLogPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await EditWearLogPage({ params: Promise.resolve({ id: "12" }) }),
    );

    expect(markup).toContain("着用履歴編集");
    expect(markup).toContain("wear-log-form:12");
    expect(markup).toContain("delete-wear-log-button:12");
  });
});
