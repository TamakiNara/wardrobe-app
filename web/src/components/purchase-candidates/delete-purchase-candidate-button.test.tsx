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

describe("DeletePurchaseCandidateButton", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("raw message を削除エラーとして表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message:
              "SQLSTATE[42S22]: Column not found: 1054 Unknown column custom_label",
          }),
          { status: 500, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const { default: DeletePurchaseCandidateButton } =
      await import("./delete-purchase-candidate-button");

    await act(async () => {
      root.render(
        React.createElement(DeletePurchaseCandidateButton, {
          candidateId: "10",
        }),
      );
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "削除に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
