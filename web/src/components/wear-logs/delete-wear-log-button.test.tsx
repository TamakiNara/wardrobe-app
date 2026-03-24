// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DeleteWearLogButton from "./delete-wear-log-button";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const routerMock = {
  push: pushMock,
  refresh: refreshMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

describe("DeleteWearLogButton", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("confirm をキャンセルした場合は削除しない", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      root.render(React.createElement(DeleteWearLogButton, { wearLogId: "1" }));
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("削除成功時は一覧へ戻して再読込する", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: "deleted",
        }),
      }),
    );

    await act(async () => {
      root.render(React.createElement(DeleteWearLogButton, { wearLogId: "1" }));
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/wear-logs/1", {
      method: "DELETE",
    });
    expect(pushMock).toHaveBeenCalledWith("/wear-logs?message=deleted");
    expect(refreshMock).toHaveBeenCalled();
  });
});
