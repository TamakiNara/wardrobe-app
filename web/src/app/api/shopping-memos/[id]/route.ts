import { NextRequest } from "next/server";
import { forwardGetWithCookie } from "@/lib/bff/laravel";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  return forwardGetWithCookie(req, `/api/shopping-memos/${id}`);
}
