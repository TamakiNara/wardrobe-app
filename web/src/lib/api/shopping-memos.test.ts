import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/client";
import {
  addItemsToShoppingMemo,
  createShoppingMemo,
  fetchShoppingMemoDetail,
  fetchShoppingMemos,
  removeItemFromShoppingMemo,
} from "@/lib/api/shopping-memos";

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}));

describe("shopping memos api helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("買い物メモ一覧取得 API を呼び出す", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      shoppingMemos: [],
    });

    await fetchShoppingMemos();

    expect(apiFetch).toHaveBeenCalledWith("/api/shopping-memos");
  });

  it("買い物メモ詳細取得 API を呼び出す", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      shoppingMemo: { id: 7, name: "春夏セール候補" },
    });

    await fetchShoppingMemoDetail(7);

    expect(apiFetch).toHaveBeenCalledWith("/api/shopping-memos/7");
  });

  it("買い物メモ作成時に POST リクエストを送る", async () => {
    const payload = {
      name: "春夏セール候補",
      memo: "セール終了前に比較するもの",
    };

    vi.mocked(apiFetch).mockResolvedValueOnce({
      message: "created",
      shoppingMemo: { id: 1, name: "春夏セール候補" },
    });

    await createShoppingMemo(payload);

    expect(apiFetch).toHaveBeenCalledWith("/api/shopping-memos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  });

  it("買い物メモ追加時に購入検討 ID 配列を送る", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      added_count: 2,
      skipped_count: 1,
      duplicate_count: 1,
      invalid_status_count: 0,
    });

    await addItemsToShoppingMemo(5, [1, 2, 3]);

    expect(apiFetch).toHaveBeenCalledWith("/api/shopping-memos/5/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        purchase_candidate_ids: [1, 2, 3],
      }),
    });
  });

  it("買い物メモ候補削除時に memo id と item id で DELETE を呼ぶ", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      message: "deleted",
    });

    await removeItemFromShoppingMemo(5, 18);

    expect(apiFetch).toHaveBeenCalledWith("/api/shopping-memos/5/items/18", {
      method: "DELETE",
    });
  });
});
