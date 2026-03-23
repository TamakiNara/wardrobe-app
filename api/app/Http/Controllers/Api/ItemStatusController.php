<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Items\ItemStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ItemStatusController extends Controller
{
    public function __construct(
        private readonly ItemStatusService $itemStatusService,
    ) {
    }

    public function dispose(Request $request, int $id): JsonResponse
    {
        try {
            $item = $this->itemStatusService->dispose($request->user(), $id);
        } catch (ValidationException $e) {
            throw $e;
        }

        return response()->json([
            'message' => 'disposed',
            'item' => $item,
        ]);
    }

    public function reactivate(Request $request, int $id): JsonResponse
    {
        try {
            $item = $this->itemStatusService->reactivate($request->user(), $id);
        } catch (ValidationException $e) {
            throw $e;
        }

        return response()->json([
            'message' => 'reactivated',
            'item' => $item,
        ]);
    }
}
