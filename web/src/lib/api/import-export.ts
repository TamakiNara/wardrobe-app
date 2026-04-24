import { apiFetch, ApiClientError } from "@/lib/api/client";

export type ExportPayload = {
  version: number;
  exported_at: string;
  owner: {
    user_id: number;
  };
  items: unknown[];
  purchase_candidates: unknown[];
  outfits: unknown[];
};

export type ImportResponse = {
  message: string;
  counts: {
    items: number;
    purchase_candidates: number;
    outfits: number;
  };
};

export async function exportUserData(): Promise<ExportPayload> {
  return apiFetch<ExportPayload>("/api/export");
}

export async function importUserData(
  payload: ExportPayload,
): Promise<ImportResponse> {
  return apiFetch<ImportResponse>("/api/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function getImportExportErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "インポート・エクスポートの処理に失敗しました。";
}
