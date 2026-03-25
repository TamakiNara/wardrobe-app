import { NextRequest } from "next/server";
import { forwardMultipartWithCsrfAndCookie } from "@/lib/bff/laravel";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await req.formData();
  return forwardMultipartWithCsrfAndCookie(
    req,
    `/api/items/${id}/images`,
    formData,
  );
}
