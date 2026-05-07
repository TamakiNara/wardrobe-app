import { apiFetch } from "@/lib/api/client";
import type {
  ShoppingMemoCreateRequest,
  ShoppingMemoDetailResponse,
  ShoppingMemoMutationResponse,
  ShoppingMemosListResponse,
} from "@/types/shopping-memos";

export async function fetchShoppingMemos(): Promise<ShoppingMemosListResponse> {
  return apiFetch<ShoppingMemosListResponse>("/api/shopping-memos");
}

export async function createShoppingMemo(
  payload: ShoppingMemoCreateRequest,
): Promise<ShoppingMemoMutationResponse> {
  return apiFetch<ShoppingMemoMutationResponse>("/api/shopping-memos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchShoppingMemoDetail(
  memoId: number,
): Promise<ShoppingMemoDetailResponse> {
  return apiFetch<ShoppingMemoDetailResponse>(`/api/shopping-memos/${memoId}`);
}
