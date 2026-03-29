import { NextRequest } from "next/server";
import { forwardPostWithCsrfAndCookie } from "@/lib/bff/laravel";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardPostWithCsrfAndCookie(
    req,
    `/api/purchase-candidates/${id}/item-draft`,
  );
}
