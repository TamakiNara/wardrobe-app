import { describe, expect, it } from "vitest";
import {
  formatPurchaseCandidateDateTime,
  normalizePurchaseCandidateDateTimeValue,
} from "@/lib/purchase-candidates/date-time";

describe("purchase candidate date time helpers", () => {
  it("ローカル日時文字列をそのまま保持する", () => {
    expect(normalizePurchaseCandidateDateTimeValue("2026-05-07T23:59")).toBe(
      "2026-05-07T23:59",
    );
  });

  it("タイムゾーン付き日時をローカル壁時計時刻へ正規化する", () => {
    expect(
      normalizePurchaseCandidateDateTimeValue("2026-05-07T23:59:00+09:00"),
    ).toBe("2026-05-07T23:59");
  });

  it("一覧・詳細・確認表示の形式を出し分ける", () => {
    expect(formatPurchaseCandidateDateTime("2026-05-07T23:59", "short")).toBe(
      "05/07 23:59",
    );
    expect(formatPurchaseCandidateDateTime("2026-05-07T23:59", "long")).toBe(
      "2026/05/07 23:59",
    );
    expect(formatPurchaseCandidateDateTime("2026-05-07T23:59", "preview")).toBe(
      "2026年5月7日 23:59",
    );
  });
});
