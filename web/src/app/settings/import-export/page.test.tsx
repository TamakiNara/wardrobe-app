// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const exportUserDataMock = vi.fn();
const importUserDataMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/lib/api/import-export", () => ({
  exportUserData: exportUserDataMock,
  importUserData: importUserDataMock,
  getImportExportErrorMessage: (error: unknown) =>
    error instanceof Error
      ? error.message
      : "インポート・エクスポートの処理に失敗しました。",
}));

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("ImportExportPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let createObjectUrlMock: ReturnType<typeof vi.fn>;
  let revokeObjectUrlMock: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let anchorClickMock: ReturnType<typeof vi.fn>;
  let showSaveFilePickerMock: ReturnType<typeof vi.fn>;
  let writableWriteMock: ReturnType<typeof vi.fn>;
  let writableCloseMock: ReturnType<typeof vi.fn>;
  let promptMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    createObjectUrlMock = vi.fn(() => "blob:mock-url");
    revokeObjectUrlMock = vi.fn();
    anchorClickMock = vi.fn();
    writableWriteMock = vi.fn().mockResolvedValue(undefined);
    writableCloseMock = vi.fn().mockResolvedValue(undefined);
    showSaveFilePickerMock = vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({
        write: writableWriteMock,
        close: writableCloseMock,
      }),
    });

    vi.spyOn(globalThis.URL, "createObjectURL").mockImplementation(
      createObjectUrlMock,
    );
    vi.spyOn(globalThis.URL, "revokeObjectURL").mockImplementation(
      revokeObjectUrlMock,
    );

    appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);
    removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node);
    const originalCreateElement = document.createElement.bind(document);
    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);

        if (tagName.toLowerCase() === "a") {
          Object.defineProperty(element, "click", {
            value: anchorClickMock,
          });
        }

        return element;
      });

    exportUserDataMock.mockResolvedValue({
      version: 1,
      exported_at: "2026-04-24T12:34:56+09:00",
      owner: {
        user_id: 1,
      },
      items: [],
      purchase_candidates: [],
      outfits: [],
      wear_logs: [],
    });
    importUserDataMock.mockResolvedValue({
      message: "imported",
      counts: {
        items: {
          total: 1,
          visible: 1,
        },
        purchase_candidates: {
          total: 2,
        },
        outfits: {
          total: 3,
          visible: 2,
        },
        wear_logs: {
          total: 4,
        },
      },
    });
    promptMock = vi.fn(() => "インポート");
    vi.stubGlobal("prompt", promptMock);
    Object.defineProperty(window, "showSaveFilePicker", {
      value: showSaveFilePickerMock,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    createElementSpy.mockRestore();
    vi.restoreAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("インポート・エクスポート画面の説明を表示する", async () => {
    const { default: ImportExportPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(ImportExportPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("インポート・エクスポート");
    expect(container.textContent).toContain("エクスポート");
    expect(container.textContent).toContain("インポート");
    expect(container.textContent).toContain(
      "ログイン中のユーザーのアイテム・購入検討・コーディネート・着用履歴を、画像も含めて扱います。",
    );
    expect(container.textContent).toContain(
      "ログイン中のユーザーのデータをバックアップファイルとして保存します。画像も含まれるため、ファイルサイズが大きくなる場合があります。",
    );
    expect(container.textContent).toContain(
      "バックアップファイルから、ログイン中のユーザーのデータを復元します。実行すると、現在のアイテム・購入検討・コーディネート・着用履歴はすべて削除されます。",
    );
    expect(container.textContent).toContain("データをバックアップする");
    expect(container.textContent).toContain("バックアップから復元する");
    expect(container.textContent).toContain("ファイルを選択");
    expect(container.textContent).toContain(
      "⚠ 復元すると、現在のアイテム・購入検討・コーディネート・着用履歴はすべて削除されます",
    );
  });

  it("対応ブラウザでは保存ダイアログでエクスポートできる", async () => {
    const { default: ImportExportPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(ImportExportPage));
      await waitForEffects();
    });

    const exportButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "データをバックアップする");

    await act(async () => {
      exportButton!.click();
      await waitForEffects();
    });

    expect(exportUserDataMock).toHaveBeenCalledTimes(1);
    expect(showSaveFilePickerMock).toHaveBeenCalledTimes(1);
    expect(writableWriteMock).toHaveBeenCalledTimes(1);
    expect(writableCloseMock).toHaveBeenCalledTimes(1);
    expect(createObjectUrlMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      "バックアップを開始しました。JSON を保存してください。",
    );
  });

  it("未対応ブラウザでは通常ダウンロードへフォールバックする", async () => {
    const { default: ImportExportPage } = await import("./page");

    Object.defineProperty(window, "showSaveFilePicker", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    await act(async () => {
      root.render(React.createElement(ImportExportPage));
      await waitForEffects();
    });

    const exportButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "データをバックアップする");

    await act(async () => {
      exportButton!.click();
      await waitForEffects();
    });

    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(anchorClickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:mock-url");
  });

  it("保存先選択ダイアログをキャンセルした場合はエラーを表示しない", async () => {
    const { default: ImportExportPage } = await import("./page");

    showSaveFilePickerMock.mockRejectedValueOnce(
      new DOMException("The user aborted a request.", "AbortError"),
    );

    await act(async () => {
      root.render(React.createElement(ImportExportPage));
      await waitForEffects();
    });

    const exportButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "データをバックアップする");

    await act(async () => {
      exportButton!.click();
      await waitForEffects();
    });

    expect(exportUserDataMock).toHaveBeenCalledTimes(1);
    expect(showSaveFilePickerMock).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain("The user aborted a request.");
    expect(container.textContent).not.toContain(
      "インポート・エクスポートの処理に失敗しました。",
    );
  });

  it("save picker が user aborted を返した場合もメッセージを表示しない", async () => {
    const { default: ImportExportPage } = await import("./page");

    showSaveFilePickerMock.mockRejectedValueOnce(
      new Error("The user aborted a request."),
    );

    await act(async () => {
      root.render(React.createElement(ImportExportPage));
      await waitForEffects();
    });

    const exportButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "データをバックアップする");

    await act(async () => {
      exportButton!.click();
      await waitForEffects();
    });

    expect(exportUserDataMock).toHaveBeenCalledTimes(1);
    expect(showSaveFilePickerMock).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain("The user aborted a request.");
    expect(container.textContent).not.toContain(
      "バックアップを作成しました。JSON を保存してください。",
    );
    expect(container.textContent).not.toContain(
      "インポート・エクスポートの処理に失敗しました。",
    );
  });

  it("JSON ファイルを選択して復元できる", async () => {
    const { default: ImportExportPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(ImportExportPage));
      await waitForEffects();
    });

    const input = container.querySelector<HTMLInputElement>("#import-file");
    const importButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "バックアップから復元する");
    const file = new File(
      [
        JSON.stringify({
          version: 1,
          exported_at: "2026-04-24T12:34:56+09:00",
          owner: {
            user_id: 1,
          },
          items: [],
          purchase_candidates: [],
          outfits: [],
          wear_logs: [],
        }),
      ],
      "backup.json",
      { type: "application/json" },
    );

    await act(async () => {
      Object.defineProperty(input, "files", {
        value: [file],
        configurable: true,
      });
      input!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      importButton!.click();
      await waitForEffects();
    });

    expect(globalThis.prompt).toHaveBeenCalledTimes(1);
    expect(importUserDataMock).toHaveBeenCalledWith({
      version: 1,
      exported_at: "2026-04-24T12:34:56+09:00",
      owner: {
        user_id: 1,
      },
      items: [],
      purchase_candidates: [],
      outfits: [],
      wear_logs: [],
    });
    expect(container.textContent).toContain(
      "復元が完了しました。アイテム 1 件（表示対象 1 件）、購入検討 2 件、コーディネート 3 件（表示対象 2 件）、着用履歴 4 件を復元しました。",
    );
  });

  it("確認文字列が一致しない場合はインポートしない", async () => {
    const { default: ImportExportPage } = await import("./page");

    promptMock.mockReturnValueOnce("キャンセル");

    await act(async () => {
      root.render(React.createElement(ImportExportPage));
      await waitForEffects();
    });

    const input = container.querySelector<HTMLInputElement>("#import-file");
    const importButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "バックアップから復元する");
    const file = new File(
      [
        JSON.stringify({
          version: 1,
          exported_at: "2026-04-24T12:34:56+09:00",
          owner: {
            user_id: 1,
          },
          items: [],
          purchase_candidates: [],
          outfits: [],
          wear_logs: [],
        }),
      ],
      "backup.json",
      { type: "application/json" },
    );

    await act(async () => {
      Object.defineProperty(input, "files", {
        value: [file],
        configurable: true,
      });
      input!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      importButton!.click();
      await waitForEffects();
    });

    expect(importUserDataMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      "確認文字列が一致しなかったため、インポートを中止しました。",
    );
  });
});
