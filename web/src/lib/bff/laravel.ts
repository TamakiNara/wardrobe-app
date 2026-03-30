import { NextRequest, NextResponse } from "next/server";

const LARAVEL_BASE_URL =
  process.env.LARAVEL_BASE_URL ?? "http://localhost:8000";

function extractSetCookie(res: Response): string[] {
  const headers = res.headers as Headers & {
    getSetCookie?: () => string[];
  };

  const rawCookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : (() => {
          const single = res.headers.get("set-cookie");
          return single ? [single] : [];
        })();

  return rawCookies.flatMap((cookie) =>
    cookie.split(/,(?=\s*[A-Za-z0-9_\-]+=)/),
  );
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

function buildMergedCookie(
  incomingCookie: string,
  refreshedSetCookies: string[],
): string {
  const cookieMap = new Map<string, string>();

  for (const rawCookie of incomingCookie.split(";")) {
    const cookie = rawCookie.trim();

    if (!cookie) {
      continue;
    }

    const separatorIndex = cookie.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const name = cookie.slice(0, separatorIndex);
    cookieMap.set(name, cookie);
  }

  for (const refreshedCookie of refreshedSetCookies) {
    const pair = refreshedCookie.split(";")[0]?.trim() ?? "";

    if (!pair) {
      continue;
    }

    const separatorIndex = pair.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const name = pair.slice(0, separatorIndex);
    cookieMap.set(name, pair);
  }

  return Array.from(cookieMap.values()).join("; ");
}

function shouldRetryWithFreshCsrf(response: Response): boolean {
  return response.status === 419;
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
    setCookies,
    xsrf,
  };
}

async function getFreshCsrf(incomingCookie: string) {
  const { setCookies, xsrf } = await fetchCsrfCookie(incomingCookie);

  return {
    xsrf,
    refreshedSetCookies: setCookies,
  };
}

export async function forwardGetWithCookie(
  req: NextRequest,
  targetPath: string,
): Promise<NextResponse> {
  const incomingCookie = req.headers.get("cookie") ?? "";
  const search = req.nextUrl.search;

  const upstreamRes = await fetch(`${LARAVEL_BASE_URL}${targetPath}${search}`, {
    method: "GET",
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
}

export async function forwardJsonWithCsrf(
  req: NextRequest,
  targetPath: string,
  options?: { forceRefreshCsrf?: boolean },
): Promise<NextResponse> {
  const contentType = req.headers.get("content-type") ?? "";
  const bodyText = await req.text();

  if (bodyText && !contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 },
    );
  }

  let body: unknown = {};
  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body (or empty body). Send JSON via POST." },
        { status: 400 },
      );
    }
  }

  return forwardPostWithCsrfAndCookie(req, targetPath, body, options);
}

export async function forwardPostWithCsrfAndCookie(
  req: NextRequest,
  targetPath: string,
  body: unknown = {},
  options?: { forceRefreshCsrf?: boolean },
): Promise<NextResponse> {
  return forwardMutationWithCsrfAndCookie(
    req,
    targetPath,
    "POST",
    body,
    options,
  );
}

export async function forwardPatchWithCsrfAndCookie(
  req: NextRequest,
  targetPath: string,
  body: unknown = {},
  options?: { forceRefreshCsrf?: boolean },
): Promise<NextResponse> {
  return forwardMutationWithCsrfAndCookie(
    req,
    targetPath,
    "PATCH",
    body,
    options,
  );
}

async function forwardMutationWithCsrfAndCookie(
  req: NextRequest,
  targetPath: string,
  method: "POST" | "PATCH",
  body: unknown = {},
  options?: { forceRefreshCsrf?: boolean },
): Promise<NextResponse> {
  try {
    const incomingCookie = req.headers.get("cookie") ?? "";

    let xsrf = readCookieValue(incomingCookie, "XSRF-TOKEN");
    let refreshedSetCookies: string[] = [];

    const refreshCsrf = async () => {
      const fresh = await getFreshCsrf(incomingCookie);
      xsrf = fresh.xsrf;
      refreshedSetCookies = fresh.refreshedSetCookies;
    };

    if (options?.forceRefreshCsrf || !xsrf) {
      await refreshCsrf();
    }

    const sendRequest = () => {
      const mergedCookie = buildMergedCookie(
        incomingCookie,
        refreshedSetCookies,
      );

      return fetch(`${LARAVEL_BASE_URL}${targetPath}`, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(xsrf ? { "X-CSRF-TOKEN": xsrf } : {}),
          ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
          "X-Requested-With": "XMLHttpRequest",
          ...(mergedCookie ? { Cookie: mergedCookie } : {}),
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    };

    let upstreamRes = await sendRequest();

    if (shouldRetryWithFreshCsrf(upstreamRes) && !options?.forceRefreshCsrf) {
      await refreshCsrf();
      upstreamRes = await sendRequest();
    }

    const data = await upstreamRes.json().catch(() => ({}));
    const final = NextResponse.json(data, { status: upstreamRes.status });

    if (refreshedSetCookies.length > 0) {
      appendCookieStrings(refreshedSetCookies, final);
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

export async function forwardMultipartWithCsrfAndCookie(
  req: NextRequest,
  targetPath: string,
  formData: FormData,
  options?: { forceRefreshCsrf?: boolean; method?: "POST" | "PUT" },
): Promise<NextResponse> {
  try {
    const incomingCookie = req.headers.get("cookie") ?? "";

    let xsrf = readCookieValue(incomingCookie, "XSRF-TOKEN");
    let refreshedSetCookies: string[] = [];

    const refreshCsrf = async () => {
      const fresh = await getFreshCsrf(incomingCookie);
      xsrf = fresh.xsrf;
      refreshedSetCookies = fresh.refreshedSetCookies;
    };

    if (options?.forceRefreshCsrf || !xsrf) {
      await refreshCsrf();
    }

    const method = options?.method ?? "POST";

    const sendRequest = () => {
      const mergedCookie = buildMergedCookie(
        incomingCookie,
        refreshedSetCookies,
      );

      return fetch(`${LARAVEL_BASE_URL}${targetPath}`, {
        method,
        headers: {
          Accept: "application/json",
          ...(xsrf ? { "X-CSRF-TOKEN": xsrf } : {}),
          ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
          "X-Requested-With": "XMLHttpRequest",
          ...(mergedCookie ? { Cookie: mergedCookie } : {}),
        },
        body: formData,
        cache: "no-store",
      });
    };

    let upstreamRes = await sendRequest();

    if (shouldRetryWithFreshCsrf(upstreamRes) && !options?.forceRefreshCsrf) {
      await refreshCsrf();
      upstreamRes = await sendRequest();
    }

    const data = await upstreamRes.json().catch(() => ({}));
    const final = NextResponse.json(data, { status: upstreamRes.status });

    if (refreshedSetCookies.length > 0) {
      appendCookieStrings(refreshedSetCookies, final);
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
  body: unknown = {},
): Promise<NextResponse> {
  try {
    const incomingCookie = req.headers.get("cookie") ?? "";

    let xsrf = readCookieValue(incomingCookie, "XSRF-TOKEN");
    let refreshedSetCookies: string[] = [];

    const refreshCsrf = async () => {
      const fresh = await getFreshCsrf(incomingCookie);
      xsrf = fresh.xsrf;
      refreshedSetCookies = fresh.refreshedSetCookies;
    };

    if (!xsrf) {
      await refreshCsrf();
    }

    const sendRequest = () => {
      const mergedCookie = buildMergedCookie(
        incomingCookie,
        refreshedSetCookies,
      );

      return fetch(`${LARAVEL_BASE_URL}${targetPath}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(xsrf ? { "X-CSRF-TOKEN": xsrf } : {}),
          ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
          "X-Requested-With": "XMLHttpRequest",
          ...(mergedCookie ? { Cookie: mergedCookie } : {}),
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    };

    let upstreamRes = await sendRequest();

    if (shouldRetryWithFreshCsrf(upstreamRes)) {
      await refreshCsrf();
      upstreamRes = await sendRequest();
    }

    const data = await upstreamRes.json().catch(() => ({}));
    const final = NextResponse.json(data, { status: upstreamRes.status });

    if (refreshedSetCookies.length > 0) {
      appendCookieStrings(refreshedSetCookies, final);
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
  targetPath: string,
): Promise<NextResponse> {
  try {
    const incomingCookie = req.headers.get("cookie") ?? "";

    let xsrf = readCookieValue(incomingCookie, "XSRF-TOKEN");
    let refreshedSetCookies: string[] = [];

    const refreshCsrf = async () => {
      const fresh = await getFreshCsrf(incomingCookie);
      xsrf = fresh.xsrf;
      refreshedSetCookies = fresh.refreshedSetCookies;
    };

    if (!xsrf) {
      await refreshCsrf();
    }

    const sendRequest = () => {
      const mergedCookie = buildMergedCookie(
        incomingCookie,
        refreshedSetCookies,
      );

      return fetch(`${LARAVEL_BASE_URL}${targetPath}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(xsrf ? { "X-CSRF-TOKEN": xsrf } : {}),
          ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
          "X-Requested-With": "XMLHttpRequest",
          ...(mergedCookie ? { Cookie: mergedCookie } : {}),
        },
        cache: "no-store",
      });
    };

    let upstreamRes = await sendRequest();

    if (shouldRetryWithFreshCsrf(upstreamRes)) {
      await refreshCsrf();
      upstreamRes = await sendRequest();
    }

    const data = await upstreamRes.json().catch(() => ({}));
    const final = NextResponse.json(data, { status: upstreamRes.status });

    if (refreshedSetCookies.length > 0) {
      appendCookieStrings(refreshedSetCookies, final);
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
