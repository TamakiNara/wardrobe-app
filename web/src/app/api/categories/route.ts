import { NextRequest } from "next/server";
import { forwardGetWithCookie } from "@/lib/bff/laravel";

export async function GET(req: NextRequest) {
  return forwardGetWithCookie(req, "/api/categories");
}
