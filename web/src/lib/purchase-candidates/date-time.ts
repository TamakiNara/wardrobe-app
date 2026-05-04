const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/;

type PurchaseCandidateDateTimeFormat = "input" | "short" | "long" | "preview";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function normalizeLocalDateTimeMatch(value: string): string | null {
  const match = value.match(LOCAL_DATE_TIME_PATTERN);
  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;
}

function formatNormalizedDateTime(
  value: string,
  format: PurchaseCandidateDateTimeFormat,
): string {
  const match = value.match(LOCAL_DATE_TIME_PATTERN);
  if (!match) {
    return "未設定";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4];
  const minute = match[5];

  switch (format) {
    case "input":
      return value;
    case "short":
      return `${pad2(month)}/${pad2(day)} ${hour}:${minute}`;
    case "preview":
      return `${year}年${month}月${day}日 ${hour}:${minute}`;
    case "long":
    default:
      return `${year}/${pad2(month)}/${pad2(day)} ${hour}:${minute}`;
  }
}

export function normalizePurchaseCandidateDateTimeValue(
  value: string | null | undefined,
): string {
  if (!value) {
    return "";
  }

  const normalizedLocalValue = normalizeLocalDateTimeMatch(value.trim());
  if (normalizedLocalValue) {
    return normalizedLocalValue;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatPurchaseCandidateDateTime(
  value: string | null | undefined,
  format: PurchaseCandidateDateTimeFormat = "long",
): string {
  const normalizedValue = normalizePurchaseCandidateDateTimeValue(value);
  if (!normalizedValue) {
    return "未設定";
  }

  return formatNormalizedDateTime(normalizedValue, format);
}

export function hasPurchaseCandidateDateTimeValue(
  value: string | null | undefined,
): boolean {
  return normalizePurchaseCandidateDateTimeValue(value) !== "";
}
