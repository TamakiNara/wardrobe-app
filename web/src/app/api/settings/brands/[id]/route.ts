import { NextRequest } from "next/server";
import { forwardPatchWithCsrfAndCookie } from "@/lib/bff/laravel";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  return forwardPatchWithCsrfAndCookie(req, `/api/settings/brands/${id}`, body);
}
