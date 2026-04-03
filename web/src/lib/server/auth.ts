import { fetchLaravelWithCookie } from "@/lib/server/laravel";

export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
};

export async function fetchAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const response = await fetchLaravelWithCookie("/api/me");

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function hasAuthenticatedUser(): Promise<boolean> {
  const user = await fetchAuthenticatedUser();

  return user !== null;
}
