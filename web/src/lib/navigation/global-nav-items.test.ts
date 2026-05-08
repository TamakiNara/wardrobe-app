import { describe, expect, it } from "vitest";
import {
  findActiveGlobalNavItem,
  shouldShowGlobalNav,
} from "./global-nav-items";

describe("global nav items", () => {
  it("shopping-memos 配下でも bottom nav を表示する", () => {
    expect(shouldShowGlobalNav("/shopping-memos")).toBe(true);
    expect(shouldShowGlobalNav("/shopping-memos/new")).toBe(true);
    expect(shouldShowGlobalNav("/shopping-memos/12")).toBe(true);
  });

  it("shopping-memos 配下では購入検討タブを active にする", () => {
    expect(findActiveGlobalNavItem("/shopping-memos")?.key).toBe(
      "purchase-candidates",
    );
    expect(findActiveGlobalNavItem("/shopping-memos/12")?.href).toBe(
      "/purchase-candidates",
    );
  });
});
