// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

async function waitForEffects() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("DeleteOutfitButton", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  const originalConfirm = window.confirm;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    window.confirm = originalConfirm;
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("delete の 500 raw message は表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          message:
            "SQLSTATE[42S22]: Column not found: 1054 Unknown column debug",
        }),
      }),
    );

    const { default: DeleteOutfitButton } =
      await import("./delete-outfit-button");

    await act(async () => {
      root.render(React.createElement(DeleteOutfitButton, { outfitId: 10 }));
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "コーディネートの削除に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
    expect(container.textContent).not.toContain("Unknown column debug");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
