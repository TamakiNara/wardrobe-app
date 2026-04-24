"use client";

import { Suspense, useMemo, useState } from "react";
import { SettingsBreadcrumbs } from "@/components/settings/settings-breadcrumbs";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import {
  exportUserData,
  getImportExportErrorMessage,
  importUserData,
  type ExportPayload,
} from "@/lib/api/import-export";

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

function buildExportFileName(exportedAt: string) {
  const date = new Date(exportedAt);

  if (Number.isNaN(date.getTime())) {
    return "wardrobe-export.json";
  }

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const normalized = formatter
    .format(date)
    .replaceAll(" ", "_")
    .replaceAll(":", "-");

  return `wardrobe-export-${normalized}.json`;
}

function ImportExportPageContent() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedFileLabel = useMemo(() => {
    if (!selectedFile) {
      return "ファイル未選択";
    }

    return selectedFile.name;
  }, [selectedFile]);

  async function saveExportBlob(blob: Blob, fileName: string) {
    const filePickerWindow = window as SaveFilePickerWindow;

    if (typeof filePickerWindow.showSaveFilePicker === "function") {
      const handle = await filePickerWindow.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "JSON ファイル",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function handleExport() {
    if (exporting) return;

    setExporting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = await exportUserData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      await saveExportBlob(blob, buildExportFileName(payload.exported_at));

      setSuccessMessage(
        "エクスポートを開始しました。JSON を保存してください。",
      );
    } catch (error) {
      setErrorMessage(getImportExportErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    if (!selectedFile || importing) return;

    const confirmedText = window.prompt(
      "続行するには「インポート」と入力してください。\n実行すると、現在のアイテム・購入検討・コーディネートはすべて削除されて置き換わります。",
    );

    if (confirmedText !== "インポート") {
      setSuccessMessage(null);
      setErrorMessage(
        "確認文字列が一致しなかったため、インポートを中止しました。",
      );
      return;
    }

    setImporting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const fileText = await selectedFile.text();
      const parsed = JSON.parse(fileText) as ExportPayload;
      const response = await importUserData(parsed);

      setSuccessMessage(
        `復元が完了しました。アイテム ${response.counts.items.total} 件（表示対象 ${response.counts.items.visible} 件）、購入検討 ${response.counts.purchase_candidates.total} 件、コーディネート ${response.counts.outfits.total} 件（表示対象 ${response.counts.outfits.visible} 件）を復元しました。`,
      );
      setSelectedFile(null);
    } catch (error) {
      if (error instanceof SyntaxError) {
        setErrorMessage(
          "JSON の読み込みに失敗しました。ファイル内容を確認してください。",
        );
      } else {
        setErrorMessage(getImportExportErrorMessage(error));
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <SettingsBreadcrumbs currentLabel="インポート・エクスポート" />

        <SettingsPageHeader
          title="インポート・エクスポート"
          description={
            <>
              データのバックアップと復元を行います。
              <br />
              ログイン中のユーザーのアイテム・購入検討・コーディネートを、画像も含めて扱います。
            </>
          }
          backHref="/settings"
        />

        <SettingsCard>
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                エクスポート
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                ログイン中のユーザーのデータをバックアップファイルとして保存します。画像も含まれるため、ファイルサイズが大きくなる場合があります。
              </p>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {exporting ? "バックアップ中..." : "データをバックアップする"}
            </button>
          </div>
        </SettingsCard>

        <SettingsCard>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                インポート
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                バックアップファイルから、ログイン中のユーザーのデータを復元します。実行すると、現在のアイテム・購入検討・コーディネートはすべて削除されます。
              </p>
            </div>

            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              ⚠
              復元すると、現在のアイテム・購入検討・コーディネートはすべて削除されます
            </p>

            <div className="space-y-2">
              <label
                htmlFor="import-file"
                className="block text-sm font-medium text-gray-700"
              >
                JSON ファイル
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label
                  htmlFor="import-file"
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  ファイルを選択
                </label>
                <input
                  id="import-file"
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setSelectedFile(file);
                    setSuccessMessage(null);
                    setErrorMessage(null);
                  }}
                  className="sr-only"
                />
                <p className="text-sm text-gray-600">{selectedFileLabel}</p>
              </div>
              <p className="text-xs text-gray-500">
                JSON 形式のバックアップを選択してください。
              </p>
            </div>

            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile || importing}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
            >
              {importing ? "復元中..." : "バックアップから復元する"}
            </button>
          </div>
        </SettingsCard>

        {successMessage ? (
          <SettingsCard>
            <p className="text-sm text-emerald-700">{successMessage}</p>
          </SettingsCard>
        ) : null}

        {errorMessage ? (
          <SettingsCard>
            <p className="text-sm text-red-600">{errorMessage}</p>
          </SettingsCard>
        ) : null}
      </div>
    </main>
  );
}

export default function ImportExportPage() {
  return (
    <Suspense>
      <ImportExportPageContent />
    </Suspense>
  );
}
