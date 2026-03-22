import { describe, expect, it } from "vitest";
import { mapLoginErrorMessage } from "./page";

describe("mapLoginErrorMessage", () => {
  it("認証失敗を共通文言へ変換する", () => {
    expect(mapLoginErrorMessage("invalid credentials")).toBe(
      "メールアドレスまたはパスワードが正しくありません。",
    );
  });

  it("メールアドレス形式エラーを共通文言へ変換する", () => {
    expect(
      mapLoginErrorMessage("The email field must be a valid email address."),
    ).toBe("メールアドレスの形式が正しくありません。");
  });

  it("通信系エラーは再試行文言へまとめる", () => {
    expect(mapLoginErrorMessage("CSRF token mismatch.")).toBe(
      "通信に失敗しました。時間をおいて再度お試しください。",
    );
    expect(mapLoginErrorMessage()).toBe(
      "通信に失敗しました。時間をおいて再度お試しください。",
    );
  });
});
