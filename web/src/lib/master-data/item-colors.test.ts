import { describe, expect, it } from "vitest";
import {
  DEFAULT_CUSTOM_COLOR_HEX,
  findItemColorHex,
  resolveCustomColorHex,
} from "./item-colors";

describe("item colors", () => {
  it("プリセット色のhexを解決できる", () => {
    expect(findItemColorHex("red")).toBe("#E53935");
  });

  it("引き継げる色がないときはデフォルト色を使う", () => {
    expect(resolveCustomColorHex("")).toBe(DEFAULT_CUSTOM_COLOR_HEX);
  });
});
