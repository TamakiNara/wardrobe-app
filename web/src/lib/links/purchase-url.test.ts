import { describe, expect, it } from "vitest";
import { resolvePurchaseUrlDisplayLabel } from "./purchase-url";

describe("resolvePurchaseUrlDisplayLabel", () => {
  it("既知の主要サイトはサイト名へ変換する", () => {
    expect(
      resolvePurchaseUrlDisplayLabel("https://item.rakuten.co.jp/shop/item-1"),
    ).toBe("楽天市場");
    expect(resolvePurchaseUrlDisplayLabel("https://zozo.jp/shop/item/")).toBe(
      "ZOZOTOWN",
    );
    expect(
      resolvePurchaseUrlDisplayLabel("https://www.uniqlo.com/jp/ja/"),
    ).toBe("UNIQLO");
    expect(
      resolvePurchaseUrlDisplayLabel("https://www.gu-global.com/jp/ja/"),
    ).toBe("GU");
  });

  it("未知の URL はドメイン表示にする", () => {
    expect(resolvePurchaseUrlDisplayLabel("https://example.test/items/1")).toBe(
      "example.test",
    );
  });

  it("不正な URL は fallback 表示にする", () => {
    expect(resolvePurchaseUrlDisplayLabel("not-a-url")).toBe("商品ページ");
  });
});
