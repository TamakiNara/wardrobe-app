import { NextRequest } from "next/server";
import {
  forwardDeleteWithCookie,
  forwardPatchWithCsrfAndCookie,
} from "@/lib/bff/laravel";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await req.json();

  return forwardPatchWithCsrfAndCookie(
    req,
    `/api/settings/weather-locations/${id}`,
    body,
  );
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return forwardDeleteWithCookie(req, `/api/settings/weather-locations/${id}`);
}
