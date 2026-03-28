import { NextRequest } from "next/server";
import {
  forwardGetWithCookie,
  forwardPostWithCsrfAndCookie,
} from "@/lib/bff/laravel";

export async function GET(req: NextRequest) {
  return forwardGetWithCookie(req, "/api/settings/tpos");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return forwardPostWithCsrfAndCookie(req, "/api/settings/tpos", body);
}
