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

export function appendSetCookies(
  response: NextResponse,
  cookies: string[]
): NextResponse {
  for (const c of cookies) {
    response.headers.append("set-cookie", c);
  }
  return response;
}

export async function forwardJsonWithCsrf(
  req: NextRequest,
  targetPath: string
): Promise<NextResponse> {
  const ct = req.headers.get("content-type") ?? "";

  if (!ct.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 }
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body (or empty body). Send JSON via POST." },
      { status: 400 }
    );
  }

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
      body: JSON.stringify(requestBody),
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
