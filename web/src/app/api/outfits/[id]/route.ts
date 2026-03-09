import { NextRequest } from "next/server";
import {
  forwardGetWithCookie,
  forwardDeleteWithCookie,
} from "@/lib/bff/laravel";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return forwardGetWithCookie(req, `/api/outfits/${id}`);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardDeleteWithCookie(req, `/api/outfits/${id}`);
}
