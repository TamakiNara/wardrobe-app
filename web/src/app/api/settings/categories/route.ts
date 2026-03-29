import { NextRequest } from "next/server";
import {
  forwardGetWithCookie,
  forwardPutWithCsrfAndCookie,
} from "@/lib/bff/laravel";

export async function GET(req: NextRequest) {
  return forwardGetWithCookie(req, "/api/settings/categories");
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  return forwardPutWithCsrfAndCookie(req, "/api/settings/categories", body);
}
