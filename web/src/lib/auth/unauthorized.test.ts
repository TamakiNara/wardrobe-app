import { describe, expect, it, vi } from "vitest";
import {
  buildLoginMessageHref,
  getLoginNoticeMessage,
  redirectToLoginForSessionExpired,
  SESSION_EXPIRED_MESSAGE_KEY,
} from "./unauthorized";

describe("unauthorized helpers", () => {
  it("session_expired のログイン通知文言を返す", () => {
    expect(getLoginNoticeMessage(SESSION_EXPIRED_MESSAGE_KEY)).toBe(
      "ログインが必要です。もう一度ログインしてください。",
    );
  });

  it("未知の message は通知文言にしない", () => {
    expect(getLoginNoticeMessage("unknown")).toBeNull();
  });

  it("session expired 用の login URL を作る", () => {
    expect(buildLoginMessageHref(SESSION_EXPIRED_MESSAGE_KEY)).toBe(
      "/login?message=session_expired",
    );
  });

  it("401 時は push ではなく replace で login へ遷移する", () => {
    const router = {
      push: vi.fn(),
      replace: vi.fn(),
    };

    redirectToLoginForSessionExpired(router);

    expect(router.replace).toHaveBeenCalledWith(
      "/login?message=session_expired",
    );
    expect(router.push).not.toHaveBeenCalled();
  });
});
