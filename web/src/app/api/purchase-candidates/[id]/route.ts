import { NextRequest } from "next/server";
import {
  forwardDeleteWithCookie,
  forwardGetWithCookie,
  forwardPutWithCsrfAndCookie,
} from "@/lib/bff/laravel";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardGetWithCookie(req, `/api/purchase-candidates/${id}`);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await req.json();
  return forwardPutWithCsrfAndCookie(req, `/api/purchase-candidates/${id}`, body);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardDeleteWithCookie(req, `/api/purchase-candidates/${id}`);
}
