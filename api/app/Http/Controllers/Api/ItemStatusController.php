<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Services\Items\ItemStatusService;
use App\Support\ItemPayloadBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemStatusController extends Controller
{
    public function __construct(
        private readonly ItemStatusService $itemStatusService,
    ) {}

    public function dispose(Request $request, int $id): JsonResponse
    {
        $item = $this->itemStatusService->dispose($request->user(), $id);

        return response()->json([
            'message' => 'disposed',
            'item' => ItemPayloadBuilder::buildDetail($item->load(['images', 'user'])),
        ]);
    }

    public function reactivate(Request $request, int $id): JsonResponse
    {
        $item = $this->itemStatusService->reactivate($request->user(), $id);

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
