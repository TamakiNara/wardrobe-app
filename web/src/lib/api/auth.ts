import type { paths } from "@/types/api";
import { apiFetch } from "./client";

type MeResponse =
  paths["/api/me"]["get"]["responses"]["200"]["content"]["application/json"];

type RegisterRequest =
  paths["/api/register"]["post"]["requestBody"]["content"]["application/json"];

type RegisterResponse =
  paths["/api/register"]["post"]["responses"]["201"]["content"]["application/json"];

type LoginRequest =
  paths["/api/login"]["post"]["requestBody"]["content"]["application/json"];

type LoginResponse =
  paths["/api/login"]["post"]["responses"]["200"]["content"]["application/json"];

type LogoutResponse =
  paths["/api/logout"]["post"]["responses"]["200"]["content"]["application/json"];

export async function register(
  body: RegisterRequest,
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/auth/me", {
    method: "GET",
  });
}

export async function logout(): Promise<LogoutResponse> {
  return apiFetch<LogoutResponse>("/api/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}
