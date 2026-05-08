import { NextRequest } from "next/server";
import { forwardPostWithCsrfAndCookie } from "@/lib/bff/laravel";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await req.json();

  return forwardPostWithCsrfAndCookie(
    req,
    `/api/shopping-memos/${id}/items`,
    body,
  );
}
