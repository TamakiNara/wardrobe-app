import { describe, expect, it } from "vitest";
import { mapRegisterErrorMessage } from "./page";

describe("mapRegisterErrorMessage", () => {
  it("メールアドレス形式エラーを共通文言へ変換する", () => {
    expect(
      mapRegisterErrorMessage("The email field must be a valid email address."),
    ).toBe("メールアドレスの形式が正しくありません。");
  });

  it("その他の登録エラーは入力確認文言へまとめる", () => {
    expect(mapRegisterErrorMessage("The name field is required.")).toBe(
      "入力されていない項目があります。内容をご確認ください。",
    );
    expect(mapRegisterErrorMessage()).toBe(
      "通信に失敗しました。時間をおいて再度お試しください。",
    );
  });
});
