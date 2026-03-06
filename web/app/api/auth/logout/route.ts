import { NextRequest } from "next/server";
import { forwardPostWithCsrfAndCookie } from "@/lib/bff/laravel";

export async function POST(req: NextRequest) {
  return forwardPostWithCsrfAndCookie(req, "/api/logout", {});
}
