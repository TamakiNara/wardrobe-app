import { NextRequest, NextResponse } from "next/server";

const LARAVEL_BASE_URL =
  process.env.LARAVEL_BASE_URL ?? "http://localhost:8000";

export function extractSetCookie(res: Response): string[] {
  const headers = res.headers as {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

export function readXsrfFromCookies(setCookies: string[]): string | null {
  for (const c of setCookies) {
    const m = c.match(/XSRF-TOKEN=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }

  return null;
}

export function cookiesToHeader(setCookies: string[]): string {
  return setCookies.map((s) => s.split(";")[0]).join("; ");
}

export async function fetchCsrfCookie(incomingCookie?: string) {
  const csrfRes = await fetch(`${LARAVEL_BASE_URL}/csrf-cookie`, {
    method: "GET",
    headers: incomingCookie ? { Cookie: incomingCookie } : {},
    cache: "no-store",
  });

  if (!csrfRes.ok) {
    throw new Error("Failed to get CSRF cookie from backend.");
  }

  const setCookies = extractSetCookie(csrfRes);
  const xsrf = readXsrfFromCookies(setCookies);

  if (!xsrf) {
    throw new Error("Failed to read XSRF-TOKEN from backend response.");
  }

  return {
    csrfRes,
    setCookies,
    xsrf,
  };
}

function appendSetCookies(from: Response, to: NextResponse) {
  const headers = from.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") {
    const cookies = headers.getSetCookie();
    for (const cookie of cookies) {
      to.headers.append("set-cookie", cookie);
    }
    return;
  }

  const single = from.headers.get("set-cookie");
  if (single) {
    to.headers.append("set-cookie", single);
  }
}

export async function forwardJsonWithCsrf(
  req: NextRequest,
  path: string
) {
  const body = await req.text();
  const incomingCookie = req.headers.get("cookie") ?? "";

  // 1. csrf-cookie を取得
  const csrfRes = await fetch(`${LARAVEL_BASE_URL}/csrf-cookie`, {
    method: "GET",
    headers: {
      cookie: incomingCookie,
    },
    cache: "no-store",
  });

  // csrf-cookie のレスポンスから Cookie を拾う
  const csrfHeaders = csrfRes.headers as Headers & {
    getSetCookie?: () => string[];
  };

  let csrfCookieHeader = "";

  if (typeof csrfHeaders.getSetCookie === "function") {
    csrfCookieHeader = csrfHeaders
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");
  } else {
    const single = csrfRes.headers.get("set-cookie");
    if (single) {
      csrfCookieHeader = single.split(",").map((part) => part.split(";")[0]).join("; ");
    }
  }

  // XSRF-TOKEN を cookie 文字列から取り出す
  const xsrfTokenMatch = csrfCookieHeader.match(/XSRF-TOKEN=([^;]+)/);
  const xsrfToken = xsrfTokenMatch
    ? decodeURIComponent(xsrfTokenMatch[1])
    : "";

  // 2. 本APIへ転送
  const laravelRes = await fetch(`${LARAVEL_BASE_URL}${path}`, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": xsrfToken,
      cookie: [incomingCookie, csrfCookieHeader].filter(Boolean).join("; "),
    },
    body,
    cache: "no-store",
  });

  const data = await laravelRes.json().catch(() => ({}));

  const response = NextResponse.json(data, {
    status: laravelRes.status,
  });

  // 3. csrf-cookie と本API 両方の Set-Cookie をブラウザへ返す
  appendSetCookies(csrfRes, response);
  appendSetCookies(laravelRes, response);

  return response;
}

export async function forwardGetWithCookie(
  req: NextRequest,
  targetPath: string
): Promise<NextResponse> {
  const incomingCookie = req.headers.get("cookie") ?? "";

  const upstreamRes = await fetch(`${LARAVEL_BASE_URL}${targetPath}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(incomingCookie ? { Cookie: incomingCookie } : {}),
    },
    cache: "no-store",
  });

  const data = await upstreamRes.json().catch(() => ({}));

  return NextResponse.json(data, { status: upstreamRes.status });
}

export async function forwardPostWithCsrfAndCookie(
  req: NextRequest,
  targetPath: string,
  body: unknown = {}
): Promise<NextResponse> {
  try {
    const incomingCookie = req.headers.get("cookie") ?? "";
    const { setCookies, xsrf } = await fetchCsrfCookie(incomingCookie);

    const upstreamRes = await fetch(`${LARAVEL_BASE_URL}${targetPath}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": xsrf,
        ...(setCookies.length
          ? { Cookie: cookiesToHeader(setCookies) }
          : incomingCookie
          ? { Cookie: incomingCookie }
          : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstreamRes.json().catch(() => ({}));
    const final = NextResponse.json(data, { status: upstreamRes.status });

    const upstreamSetCookies = extractSetCookie(upstreamRes);
    return appendSetCookies(final, [...setCookies, ...upstreamSetCookies]);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected upstream communication error.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
