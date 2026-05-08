import { apiFetch } from "@/lib/api/client";
import type {
  ShoppingMemoAddItemsRequest,
  ShoppingMemoAddItemsResponse,
  ShoppingMemoCreateRequest,
  ShoppingMemoDetailResponse,
  ShoppingMemoItemMutationResponse,
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

export async function addItemsToShoppingMemo(
  memoId: number,
  purchaseCandidateIds: number[],
): Promise<ShoppingMemoAddItemsResponse> {
  const payload: ShoppingMemoAddItemsRequest = {
    purchase_candidate_ids: purchaseCandidateIds,
  };

  return apiFetch<ShoppingMemoAddItemsResponse>(
    `/api/shopping-memos/${memoId}/items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function removeItemFromShoppingMemo(
  memoId: number,
  shoppingMemoItemId: number,
): Promise<ShoppingMemoItemMutationResponse> {
  return apiFetch<ShoppingMemoItemMutationResponse>(
    `/api/shopping-memos/${memoId}/items/${shoppingMemoItemId}`,
    {
      method: "DELETE",
    },
  );
}
