"use client";

export const SESSION_EXPIRED_MESSAGE_KEY = "session_expired";

const LOGIN_NOTICE_MESSAGES = {
  [SESSION_EXPIRED_MESSAGE_KEY]:
    "ログインが必要です。もう一度ログインしてください。",
} as const;

type LoginNoticeMessageKey = keyof typeof LOGIN_NOTICE_MESSAGES;

type ReplaceOnlyRouter = {
  replace: (href: string) => void;
};

export function getLoginNoticeMessage(message?: string | null): string | null {
  if (!message) {
    return null;
  }

  return LOGIN_NOTICE_MESSAGES[message as LoginNoticeMessageKey] ?? null;
}

export function buildLoginMessageHref(message: LoginNoticeMessageKey): string {
  return `/login?message=${encodeURIComponent(message)}`;
}

export function redirectToLoginWithMessage(
  router: ReplaceOnlyRouter,
  message: LoginNoticeMessageKey,
): void {
  router.replace(buildLoginMessageHref(message));
}

export function redirectToLoginForSessionExpired(
  router: ReplaceOnlyRouter,
): void {
  redirectToLoginWithMessage(router, SESSION_EXPIRED_MESSAGE_KEY);
}
