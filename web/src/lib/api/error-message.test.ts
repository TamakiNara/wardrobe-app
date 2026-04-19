import { describe, expect, it } from "vitest";
import {
  flattenValidationErrors,
  getUserFacingSubmitErrorMessage,
} from "./error-message";

describe("api error message helpers", () => {
  it("flattens validation errors for field display", () => {
    expect(
      flattenValidationErrors({
        errors: {
          name: ["名前を入力してください。"],
          colors: "メインカラーを選択してください。",
          empty: [],
        },
      }),
    ).toEqual({
      name: "名前を入力してください。",
      colors: "メインカラーを選択してください。",
    });
  });

  it("does not expose raw SQL or exception messages", () => {
    expect(
      getUserFacingSubmitErrorMessage(
        {
          message:
            "SQLSTATE[42S22]: Column not found: 1054 Unknown column custom_label",
        },
        "保存に失敗しました。時間をおいて再度お試しください。",
      ),
    ).toBe("保存に失敗しました。時間をおいて再度お試しください。");
  });

  it("uses fallback for unknown network errors", () => {
    expect(
      getUserFacingSubmitErrorMessage(
        new Error("connect ECONNREFUSED 127.0.0.1"),
        "処理に失敗しました。時間をおいて再度お試しください。",
      ),
    ).toBe("処理に失敗しました。時間をおいて再度お試しください。");
  });
});
