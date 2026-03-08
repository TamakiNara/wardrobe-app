import { NextRequest } from "next/server";
import { forwardGetWithCookie } from "@/lib/bff/laravel";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return forwardGetWithCookie(req, `/api/items/${params.id}`);
}
