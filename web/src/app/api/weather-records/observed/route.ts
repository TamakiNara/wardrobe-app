import { NextRequest } from "next/server";
import { forwardPostWithCsrfAndCookie } from "@/lib/bff/laravel";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return forwardPostWithCsrfAndCookie(
    req,
    "/api/weather-records/observed",
    body,
  );
}
