import type {
  PurchaseCandidatePriority,
  PurchaseCandidateStatus,
} from "@/types/purchase-candidates";

export const PURCHASE_CANDIDATE_STATUS_LABELS: Record<PurchaseCandidateStatus, string> = {
  considering: "検討中",
  on_hold: "保留中",
  purchased: "購入済み",
  dropped: "見送り",
};

export const PURCHASE_CANDIDATE_PRIORITY_LABELS: Record<PurchaseCandidatePriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export const PURCHASE_CANDIDATE_SIZE_GENDER_LABELS = {
  women: "レディース",
  men: "メンズ",
  unisex: "ユニセックス",
  unknown: "未指定",
} as const;

export const PURCHASE_CANDIDATE_COLOR_ROLE_LABELS = {
  main: "メイン",
  sub: "サブ",
} as const;
