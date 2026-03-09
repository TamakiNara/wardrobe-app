import { NextRequest, NextResponse } from "next/server";

const LARAVEL_BASE_URL =
  process.env.LARAVEL_BASE_URL ?? "http://localhost:8000";

function extractSetCookie(res: Response): string[] {
  const headers = res.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function readXsrfFromSetCookies(setCookies: string[]): string | null {
  for (const cookie of setCookies) {
    const match = cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

function readCookieValue(cookieHeader: string, name: string): string | null {
  const cookies = cookieHeader.split(";").map((part) => part.trim());

  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.slice(name.length + 1));
    }
  }

  return null;
}

function appendCookieStrings(cookies: string[], response: NextResponse) {
  for (const cookie of cookies) {
    response.headers.append("set-cookie", cookie);
  }
}

function appendSetCookies(from: Response, to: NextResponse) {
  const cookies = extractSetCookie(from);
  appendCookieStrings(cookies, to);
}

async function fetchCsrfCookie(incomingCookie?: string) {
  const csrfRes = await fetch(`${LARAVEL_BASE_URL}/csrf-cookie`, {
    method: "GET",
    headers: incomingCookie ? { Cookie: incomingCookie } : {},
    cache: "no-store",
  });

  if (!csrfRes.ok) {
    throw new Error("Failed to get CSRF cookie from backend.");
  }

  const setCookies = extractSetCookie(csrfRes);
  const xsrf = readXsrfFromSetCookies(setCookies);

  if (!xsrf) {
    throw new Error("Failed to read XSRF-TOKEN from backend response.");
  }

  return {
    csrfRes,
    setCookies,
    xsrf,
  };
}

export async function forwardGetWithCookie(
  req: NextRequest,
  targetPath: string,
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

export async function forwardJsonWithCsrf(
  req: NextRequest,
  targetPath: string,
  options?: { forceRefreshCsrf?: boolean }
): Promise<NextResponse> {
  const bodyText = await req.text();

  return forwardPostWithCsrfAndCookie(
    req,
    targetPath,
    bodyText ? JSON.parse(bodyText) : {},
    options
  );
}

export async function forwardPostWithCsrfAndCookie(
  req: NextRequest,
  targetPath: string,
  body: unknown = {},
  options?: { forceRefreshCsrf?: boolean }
): Promise<NextResponse> {
  try {
    const incomingCookie = req.headers.get("cookie") ?? "";

    let xsrf = readCookieValue(incomingCookie, "XSRF-TOKEN");
    let csrfCookiesToAppend: string[] = [];

    if (options?.forceRefreshCsrf || !xsrf) {
      const { setCookies, xsrf: fetchedXsrf } =
        await fetchCsrfCookie(incomingCookie);
      xsrf = fetchedXsrf;

      // ブラウザへ返すのは XSRF-TOKEN だけ
      csrfCookiesToAppend = setCookies.filter((cookie) =>
        cookie.startsWith("XSRF-TOKEN="),
      );
    }

    const mergedCookie = [
      incomingCookie,
      ...csrfCookiesToAppend.map((cookie) => cookie.split(";")[0]),
    ]
      .filter(Boolean)
      .join("; ");

    const upstreamRes = await fetch(`${LARAVEL_BASE_URL}${targetPath}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(xsrf ? { "X-CSRF-TOKEN": xsrf } : {}),
        ...(mergedCookie ? { Cookie: mergedCookie } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstreamRes.json().catch(() => ({}));
    const final = NextResponse.json(data, { status: upstreamRes.status });

    if (csrfCookiesToAppend.length > 0) {
      appendCookieStrings(csrfCookiesToAppend, final);
    }

    appendSetCookies(upstreamRes, final);

    return final;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected upstream communication error.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function forwardPutWithCsrfAndCookie(
  req: NextRequest,
  targetPath: string,
  body: unknown = {}
): Promise<NextResponse> {
  try {
    const incomingCookie = req.headers.get("cookie") ?? "";

    let xsrf = readCookieValue(incomingCookie, "XSRF-TOKEN");
    let csrfCookiesToAppend: string[] = [];

    if (!xsrf) {
      const { setCookies, xsrf: fetchedXsrf } = await fetchCsrfCookie(
        incomingCookie
      );
      xsrf = fetchedXsrf;

      csrfCookiesToAppend = setCookies.filter((cookie) =>
        cookie.startsWith("XSRF-TOKEN=")
      );
    }

    const upstreamRes = await fetch(`${LARAVEL_BASE_URL}${targetPath}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(xsrf ? { "X-CSRF-TOKEN": xsrf } : {}),
        ...(incomingCookie ? { Cookie: incomingCookie } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstreamRes.json().catch(() => ({}));
    const final = NextResponse.json(data, { status: upstreamRes.status });

    if (csrfCookiesToAppend.length > 0) {
      appendCookieStrings(csrfCookiesToAppend, final);
    }

    appendSetCookies(upstreamRes, final);

    return final;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected upstream communication error.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function forwardDeleteWithCookie(
  req: NextRequest,
  targetPath: string
): Promise<NextResponse> {
  try {
    const incomingCookie = req.headers.get("cookie") ?? "";

    const upstreamRes = await fetch(`${LARAVEL_BASE_URL}${targetPath}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...(incomingCookie ? { Cookie: incomingCookie } : {}),
      },
      cache: "no-store",
    });

    const data = await upstreamRes.json().catch(() => ({}));
    const final = NextResponse.json(data, { status: upstreamRes.status });

    appendSetCookies(upstreamRes, final);

    return final;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected upstream communication error.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
