import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/lib/api/client";
import { getImportExportErrorMessage } from "./import-export";

describe("import export api helpers", () => {
  it("uses the first validation error message when available", () => {
    const error = new ApiClientError(422, {
      message: "The owner.user_id field is required.",
      errors: {
        "owner.user_id": [
          "このバックアップファイルは現在の形式に対応していないため復元できません。最新の形式で再度バックアップしてください。",
        ],
      },
    });

    expect(getImportExportErrorMessage(error)).toBe(
      "このバックアップファイルは現在の形式に対応していないため復元できません。最新の形式で再度バックアップしてください。",
    );
  });
});
