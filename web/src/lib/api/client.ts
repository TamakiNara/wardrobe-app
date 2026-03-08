type ApiError = {
  message?: string;
  errors?: Record<string, string[]>;
  error?: string;
};

export class ApiClientError extends Error {
  status: number;
  data: ApiError | null;

  constructor(status: number, data: ApiError | null) {
    super(
      data?.message ??
        data?.error ??
        `API request failed with status ${status}`,
    );
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let errorData: ApiError | null = null;

    try {
      errorData = await res.json();
    } catch {
      errorData = null;
    }

    throw new ApiClientError(res.status, errorData);
  }

  if (res.status === 204) {
    return undefined as TResponse;
  }

  return res.json() as Promise<TResponse>;
}
