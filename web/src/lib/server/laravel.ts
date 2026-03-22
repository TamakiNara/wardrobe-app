import { headers } from "next/headers";

function getLaravelApiBaseUrl(): string {
  return (
    process.env.LARAVEL_API_BASE_URL ||
    process.env.LARAVEL_BASE_URL ||
    "http://localhost:8000"
  );
}

export async function fetchLaravelWithCookie(path: string): Promise<Response> {
  const cookie = (await headers()).get("cookie") ?? "";

  return fetch(`${getLaravelApiBaseUrl()}${path}`, {
    method: "GET",
    headers: {
      cookie,
      Accept: "application/json",
    },
    cache: "no-store",
  });
}
