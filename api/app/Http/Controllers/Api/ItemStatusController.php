<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Services\Items\ItemStatusService;
use App\Support\ItemPayloadBuilder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class ItemStatusController extends Controller
{
    public function __construct(
        private readonly ItemStatusService $itemStatusService,
    ) {}

    public function dispose(Request $request, int $id): JsonResponse
    {
        $currentItem = Item::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);
        $statusBefore = $currentItem->status ?? 'active';
        $startedAt = hrtime(true);

        try {
            $item = $this->itemStatusService->dispose($request->user(), $id);
        } catch (ValidationException|ModelNotFoundException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            Log::error('item.status.change_failed', [
                'operation' => 'item.status.change_failed',
                'user_id' => $request->user()->id,
                'item_id' => $id,
                'attempted_status' => 'disposed',
                'status_before' => $statusBefore,
                'exception_class' => $exception::class,
                'message' => $exception->getMessage(),
                'elapsed_ms' => (int) round((hrtime(true) - $startedAt) / 1_000_000),
            ]);

            throw $exception;
        }

        Log::info('item.status.disposed', [
            'operation' => 'item.status.disposed',
            'user_id' => $request->user()->id,
            'item_id' => $item->id,
            'status_before' => $statusBefore,
            'status_after' => 'disposed',
            'elapsed_ms' => (int) round((hrtime(true) - $startedAt) / 1_000_000),
        ]);

        return response()->json([
            'message' => 'disposed',
            'item' => ItemPayloadBuilder::buildDetail($item->load(['images', 'user'])),
        ]);
    }

    public function reactivate(Request $request, int $id): JsonResponse
    {
        $currentItem = Item::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);
        $statusBefore = $currentItem->status ?? 'active';
        $startedAt = hrtime(true);

        try {
            $item = $this->itemStatusService->reactivate($request->user(), $id);
        } catch (ValidationException|ModelNotFoundException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            Log::error('item.status.change_failed', [
                'operation' => 'item.status.change_failed',
                'user_id' => $request->user()->id,
                'item_id' => $id,
                'attempted_status' => 'active',
                'status_before' => $statusBefore,
                'exception_class' => $exception::class,
                'message' => $exception->getMessage(),
                'elapsed_ms' => (int) round((hrtime(true) - $startedAt) / 1_000_000),
            ]);

            throw $exception;
        }

        Log::info('item.status.reactivated', [
            'operation' => 'item.status.reactivated',
            'user_id' => $request->user()->id,
            'item_id' => $item->id,
            'status_before' => $statusBefore,
            'status_after' => 'active',
            'elapsed_ms' => (int) round((hrtime(true) - $startedAt) / 1_000_000),
        ]);

        return response()->json([
            'message' => 'reactivated',
            'item' => ItemPayloadBuilder::buildDetail($item->load(['images', 'user'])),
        ]);
    }

    public function updateCareStatus(Request $request, int $id): JsonResponse
    {
        $item = Item::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'care_status' => ['nullable', 'string', 'in:in_cleaning'],
        ]);

        $item->update([
            'care_status' => $validated['care_status'] ?? null,
        ]);

        return response()->json([
            'message' => 'updated',
            'item' => ItemPayloadBuilder::buildDetail($item->fresh()->load(['images', 'user'])),
        ]);
    }
}
