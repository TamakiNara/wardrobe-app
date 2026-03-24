<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WearLogs\WearLogService;
use App\Support\WearLogPayloadBuilder;
use App\Support\WearLogsIndexQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WearLogController extends Controller
{
    public function __construct(
        private readonly WearLogService $wearLogService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json(WearLogsIndexQuery::build($request->user(), $request));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $wearLog = $this->wearLogService->findOwnedWearLog($request->user(), $id);

        return response()->json([
            'wearLog' => WearLogPayloadBuilder::buildDetail($wearLog),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateRequest($request);
        $wearLog = $this->wearLogService->store($request->user(), $validated);

        return response()->json([
            'message' => 'created',
            'wearLog' => WearLogPayloadBuilder::buildDetail($wearLog),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $this->validateRequest($request);
        $wearLog = $this->wearLogService->update($request->user(), $id, $validated);

        return response()->json([
            'message' => 'updated',
            'wearLog' => WearLogPayloadBuilder::buildDetail($wearLog),
        ]);
    }

    private function validateRequest(Request $request): array
    {
        return $request->validate([
            'status' => ['required', 'string', 'in:planned,worn'],
            'event_date' => ['required', 'date'],
            'display_order' => ['required', 'integer', 'min:1'],
            'source_outfit_id' => ['nullable', 'integer'],
            'memo' => ['nullable', 'string'],
            'items' => ['present', 'array'],
            'items.*.source_item_id' => ['required', 'integer'],
            'items.*.sort_order' => ['required', 'integer', 'min:1'],
            'items.*.item_source_type' => ['required', 'string', 'in:outfit,manual'],
        ], [
            'items.present' => 'items は空配列を含めて必ず指定してください。',
        ]);
    }
}
