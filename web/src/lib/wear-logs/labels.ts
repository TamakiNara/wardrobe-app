import type { WearLogStatus } from "@/types/wear-logs";

export const WEAR_LOG_STATUS_LABELS: Record<WearLogStatus, string> = {
  planned: "予定",
  worn: "着用済み",
};

export function getWearLogStatusLabel(status: WearLogStatus): string {
  return WEAR_LOG_STATUS_LABELS[status];
}
