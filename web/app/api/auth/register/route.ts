import { NextRequest } from "next/server";
import { forwardJsonWithCsrf } from "@/lib/bff/laravel";

export async function POST(req: NextRequest) {
  return forwardJsonWithCsrf(req, "/api/register");
}