<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseCandidate;
use App\Models\ShoppingMemo;
use App\Models\ShoppingMemoItem;
use App\Support\ShoppingMemoPayloadBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ShoppingMemoController extends Controller
{
    private const ADDABLE_CANDIDATE_STATUSES = [
        'considering',
        'on_hold',
    ];

    public function index(Request $request): JsonResponse
    {
        $memos = ShoppingMemo::query()
            ->where('user_id', $request->user()->id)
            ->with(['items.purchaseCandidate'])
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'shoppingMemos' => $memos
                ->map(static fn (ShoppingMemo $memo) => ShoppingMemoPayloadBuilder::buildSummary($memo))
                ->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'memo' => ['sometimes', 'nullable', 'string'],
        ]);

        $memo = ShoppingMemo::query()->create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'memo' => $validated['memo'] ?? null,
            'status' => 'draft',
        ]);

        $memo->load([
            'items' => fn ($query) => $query->orderBy('sort_order')->orderBy('id'),
            'items.purchaseCandidate',
        ]);

        return response()->json([
            'message' => 'created',
            'shoppingMemo' => ShoppingMemoPayloadBuilder::buildSummary($memo),
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $memo = $this->resolveOwnedMemo($request->user()->id, $id);

        return response()->json([
            'shoppingMemo' => ShoppingMemoPayloadBuilder::buildDetail($memo),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'memo' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', 'string', 'in:draft,closed'],
        ]);

        $memo = $this->resolveOwnedMemo($request->user()->id, $id);

        $memo->fill($validated);
        $memo->save();
        $memo->load([
            'items' => fn ($query) => $query->orderBy('sort_order')->orderBy('id'),
            'items.purchaseCandidate',
        ]);

        return response()->json([
            'message' => 'updated',
            'shoppingMemo' => ShoppingMemoPayloadBuilder::buildSummary($memo),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $memo = $this->resolveOwnedMemo($request->user()->id, $id);

        DB::transaction(static function () use ($memo): void {
            $memo->delete();
        });

        return response()->json([
            'message' => 'deleted',
        ]);
    }

    public function addItems(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'purchase_candidate_ids' => ['required', 'array', 'min:1'],
            'purchase_candidate_ids.*' => ['integer', 'distinct'],
        ]);
        $startedAt = microtime(true);
        $user = $request->user();
        $candidateIds = array_map('intval', $validated['purchase_candidate_ids']);

        $memo = $this->resolveOwnedMemo($user->id, $id);

        Log::info('shopping_memo.items.add.start', [
            'operation' => 'shopping_memo.items.add.start',
            'user_id' => $user->id,
            'shopping_memo_id' => $memo->id,
            'requested_count' => count($candidateIds),
            'candidate_ids_count' => count($candidateIds),
        ]);

        if ($memo->status === 'closed') {
            throw ValidationException::withMessages([
                'shopping_memo' => 'クローズした買い物メモには候補を追加できません。',
            ]);
        }

        $candidates = PurchaseCandidate::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $candidateIds)
            ->get()
            ->keyBy('id');

        $existingCandidateIds = ShoppingMemoItem::query()
            ->where('shopping_memo_id', $memo->id)
            ->whereIn('purchase_candidate_id', $candidateIds)
            ->pluck('purchase_candidate_id')
            ->map(static fn ($candidateId) => (int) $candidateId)
            ->all();

        $existingLookup = array_fill_keys($existingCandidateIds, true);
        $maxSortOrder = (int) ShoppingMemoItem::query()
            ->where('shopping_memo_id', $memo->id)
            ->max('sort_order');

        $addedCount = 0;
        $duplicateCount = 0;
        $invalidStatusCount = 0;
        $skippedCount = 0;

        try {
            DB::transaction(function () use (
                $candidateIds,
                $candidates,
                $existingLookup,
                $memo,
                &$maxSortOrder,
                &$addedCount,
                &$duplicateCount,
                &$invalidStatusCount,
                &$skippedCount
            ): void {
                foreach ($candidateIds as $candidateId) {
                    /** @var PurchaseCandidate|null $candidate */
                    $candidate = $candidates->get($candidateId);

                    if (! $candidate instanceof PurchaseCandidate) {
                        $skippedCount++;

                        continue;
                    }

                    if (isset($existingLookup[$candidateId])) {
                        $duplicateCount++;
                        $skippedCount++;

                        continue;
                    }

                    if (! in_array($candidate->status, self::ADDABLE_CANDIDATE_STATUSES, true)) {
                        $invalidStatusCount++;
                        $skippedCount++;

                        continue;
                    }

                    $maxSortOrder++;

                    ShoppingMemoItem::query()->create([
                        'shopping_memo_id' => $memo->id,
                        'purchase_candidate_id' => $candidateId,
                        'quantity' => 1,
                        'priority' => null,
                        'memo' => null,
                        'sort_order' => $maxSortOrder,
                    ]);

                    $addedCount++;
                    $existingLookup[$candidateId] = true;
                }
            });
        } catch (\Throwable $exception) {
            Log::error('shopping_memo.items.add.failed', [
                'operation' => 'shopping_memo.items.add.failed',
                'user_id' => $user->id,
                'shopping_memo_id' => $memo->id,
                'requested_count' => count($candidateIds),
                'candidate_ids_count' => count($candidateIds),
                'exception_class' => $exception::class,
                'message' => $exception->getMessage(),
                'elapsed_ms' => $this->elapsedMs($startedAt),
            ]);

            throw $exception;
        }

        Log::info('shopping_memo.items.add.completed', [
            'operation' => 'shopping_memo.items.add.completed',
            'user_id' => $user->id,
            'shopping_memo_id' => $memo->id,
            'result' => $this->resolveAddItemsResult(
                $addedCount,
                $skippedCount,
                $duplicateCount,
                $invalidStatusCount,
            ),
            'requested_count' => count($candidateIds),
            'candidate_ids_count' => count($candidateIds),
            'added_count' => $addedCount,
            'skipped_count' => $skippedCount,
            'duplicate_count' => $duplicateCount,
            'invalid_status_count' => $invalidStatusCount,
            'elapsed_ms' => $this->elapsedMs($startedAt),
        ]);

        return response()->json([
            'message' => 'updated',
            'added_count' => $addedCount,
            'skipped_count' => $skippedCount,
            'duplicate_count' => $duplicateCount,
            'invalid_status_count' => $invalidStatusCount,
        ]);
    }

    public function removeItem(Request $request, int $id, int $itemId): JsonResponse
    {
        $startedAt = microtime(true);
        $user = $request->user();
        $memo = $this->resolveOwnedMemo($user->id, $id);
        $item = $memo->items()->whereKey($itemId)->firstOrFail();

        try {
            $item->delete();
        } catch (\Throwable $exception) {
            Log::error('shopping_memo.items.remove.failed', [
                'operation' => 'shopping_memo.items.remove.failed',
                'user_id' => $user->id,
                'shopping_memo_id' => $memo->id,
                'shopping_memo_item_id' => $itemId,
                'purchase_candidate_id' => $item->purchase_candidate_id,
                'exception_class' => $exception::class,
                'message' => $exception->getMessage(),
                'elapsed_ms' => $this->elapsedMs($startedAt),
            ]);

            throw $exception;
        }

        Log::info('shopping_memo.items.remove.completed', [
            'operation' => 'shopping_memo.items.remove.completed',
            'user_id' => $user->id,
            'shopping_memo_id' => $memo->id,
            'shopping_memo_item_id' => $itemId,
            'purchase_candidate_id' => $item->purchase_candidate_id,
            'result' => 'success',
            'elapsed_ms' => $this->elapsedMs($startedAt),
        ]);

        return response()->json([
            'message' => 'deleted',
        ]);
    }

    private function resolveOwnedMemo(int $userId, int $memoId): ShoppingMemo
    {
        return ShoppingMemo::query()
            ->where('user_id', $userId)
            ->with([
                'items' => fn ($query) => $query->orderBy('sort_order')->orderBy('id'),
                'items.purchaseCandidate',
            ])
            ->findOrFail($memoId);
    }

    private function resolveAddItemsResult(
        int $addedCount,
        int $skippedCount,
        int $duplicateCount,
        int $invalidStatusCount
    ): string {
        if ($addedCount === 0) {
            return 'no_change';
        }

        if ($skippedCount === 0 && $duplicateCount === 0 && $invalidStatusCount === 0) {
            return 'success';
        }

        return 'partial_success';
    }

    private function elapsedMs(float $startedAt): int
    {
        return (int) round((microtime(true) - $startedAt) * 1000);
    }
}
