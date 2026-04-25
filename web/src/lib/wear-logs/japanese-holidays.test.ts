import { describe, expect, it } from "vitest";
import { getJapaneseHoliday } from "@/lib/wear-logs/japanese-holidays";

describe("getJapaneseHoliday", () => {
  it("固定祝日を判定できる", () => {
    expect(getJapaneseHoliday("2026-01-01")).toEqual({
      isHoliday: true,
      name: "元日",
    });
  });

  it("移動祝日を判定できる", () => {
    expect(getJapaneseHoliday("2026-01-12")).toEqual({
      isHoliday: true,
      name: "成人の日",
    });
  });

  it("春分の日を判定できる", () => {
    expect(getJapaneseHoliday("2026-03-20")).toEqual({
      isHoliday: true,
      name: "春分の日",
    });
  });

  it("振替休日を判定できる", () => {
    expect(getJapaneseHoliday("2026-05-06")).toEqual({
      isHoliday: true,
      name: "振替休日",
    });
  });

  it("祝日でない日は false を返す", () => {
    expect(getJapaneseHoliday("2026-03-19")).toEqual({
      isHoliday: false,
      name: null,
    });
  });
});
