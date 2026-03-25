import { NextRequest } from "next/server";
import { forwardDeleteWithCookie } from "@/lib/bff/laravel";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; imageId: string }> },
) {
  const { id, imageId } = await context.params;
  return forwardDeleteWithCookie(
    req,
    `/api/items/${id}/images/${imageId}`,
  );
}
