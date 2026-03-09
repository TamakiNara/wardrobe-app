import { NextRequest } from "next/server";
import {
  forwardGetWithCookie,
  forwardPutWithCsrfAndCookie,
  forwardDeleteWithCookie,
} from "@/lib/bff/laravel";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return forwardGetWithCookie(req, `/api/items/${id}`);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();
  return forwardPutWithCsrfAndCookie(req, `/api/items/${id}`, body);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardDeleteWithCookie(req, `/api/items/${id}`);
}

