export const GENERIC_API_ERROR_MESSAGE =
  "処理に失敗しました。時間をおいて再度お試しください。";

type ApiErrorLike = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getErrorPayload(data: unknown): ApiErrorLike {
  return isObject(data) ? data : {};
}

export function flattenValidationErrors(data: unknown): Record<string, string> {
  const payload = getErrorPayload(data);
  const rawErrors = payload.errors;

  if (!isObject(rawErrors)) {
    return {};
  }

  const errors: Record<string, string> = {};

  for (const [key, value] of Object.entries(rawErrors)) {
    const first = Array.isArray(value) ? value[0] : value;

    if (typeof first === "string" && first.trim() !== "") {
      errors[key] = first;
    }
  }

  return errors;
}

function includesInternalErrorMarker(message: string): boolean {
  return [
    /SQLSTATE/i,
    /\bPDOException\b/i,
    /\bQueryException\b/i,
    /\bIlluminate\\/i,
    /\bstack trace\b/i,
    /\bexception\b/i,
    /\bselect\b.+\bfrom\b/i,
    /\binsert\s+into\b/i,
    /\bupdate\b.+\bset\b/i,
    /\bdelete\s+from\b/i,
  ].some((pattern) => pattern.test(message));
}

export function getUserFacingSubmitErrorMessage(
  data: unknown,
  fallback: string,
): string {
  const payload = getErrorPayload(data);
  const message =
    typeof payload.message === "string"
      ? payload.message
      : typeof payload.error === "string"
        ? payload.error
        : "";

  if (message.trim() === "" || includesInternalErrorMarker(message)) {
    return fallback;
  }

  // 画面に出してよい validation 詳細は field error 側で扱う。
  if (Object.keys(flattenValidationErrors(data)).length > 0) {
    return fallback;
  }

  return fallback;
}
