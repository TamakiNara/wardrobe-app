import type { WearLogStatus } from "@/types/wear-logs";

export const WEAR_LOG_STATUS_LABELS: Record<WearLogStatus, string> = {
  planned: "予定",
  worn: "着用済み",
};

const WEAR_LOG_STATUS_BADGE_CLASS_NAMES: Record<WearLogStatus, string> = {
  planned: "border-blue-200 bg-blue-50 text-blue-700",
  worn: "border-blue-600 bg-blue-600 text-white",
};

const WEAR_LOG_STATUS_DOT_CLASS_NAMES: Record<WearLogStatus, string> = {
  planned: "border border-blue-300 bg-white",
  worn: "bg-blue-600",
};

export function getWearLogStatusLabel(status: WearLogStatus): string {
  return WEAR_LOG_STATUS_LABELS[status];
}

export function getWearLogStatusBadgeClassName(status: WearLogStatus): string {
  return WEAR_LOG_STATUS_BADGE_CLASS_NAMES[status];
}

export function getWearLogStatusDotClassName(status: WearLogStatus): string {
  return WEAR_LOG_STATUS_DOT_CLASS_NAMES[status];
}
