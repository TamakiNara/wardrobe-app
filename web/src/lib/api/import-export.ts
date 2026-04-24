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
  wear_logs: unknown[];
};

export type ImportResponse = {
  message: string;
  counts: {
    items: {
      total: number;
      visible: number;
    };
    purchase_candidates: {
      total: number;
    };
    outfits: {
      total: number;
      visible: number;
    };
    wear_logs: {
      total: number;
    };
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
    const firstValidationError = Object.values(error.data?.errors ?? {})
      .flatMap((messages) => (Array.isArray(messages) ? messages : [messages]))
      .find((message): message is string => typeof message === "string");

    if (firstValidationError) {
      return firstValidationError;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "インポート・エクスポートの処理に失敗しました。";
}
