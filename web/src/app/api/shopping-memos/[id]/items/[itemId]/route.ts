import { NextRequest } from "next/server";
import { forwardDeleteWithCookie } from "@/lib/bff/laravel";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await context.params;

  return forwardDeleteWithCookie(
    req,
    `/api/shopping-memos/${id}/items/${itemId}`,
  );
}
