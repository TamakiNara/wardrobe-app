import { NextRequest, NextResponse } from "next/server";

const LARAVEL_API_BASE_URL =
  process.env.LARAVEL_API_BASE_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";

  const laravelRes = await fetch(`${LARAVEL_API_BASE_URL}/api/me`, {
    method: "GET",
    headers: {
      cookie,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await laravelRes.json().catch(() => ({}));

  return NextResponse.json(data, {
    status: laravelRes.status,
  });
}
