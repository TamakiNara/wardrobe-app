<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImportExport\ExportService;
use App\Services\ImportExport\ImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImportExportController extends Controller
{
    public function __construct(
        private readonly ExportService $exportService,
        private readonly ImportService $importService,
    ) {}

    public function export(Request $request): JsonResponse
    {
        return response()->json(
            $this->exportService->export($request->user())
        );
    }

    public function import(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'version' => ['required', 'integer', 'in:1'],
            'owner' => ['sometimes', 'array'],
            'owner.user_id' => ['nullable', 'integer'],
            'user_tpos' => ['sometimes', 'array'],
            'user_brands' => ['sometimes', 'array'],
            'visible_category_ids' => ['sometimes', 'array'],
            'user_preferences' => ['sometimes', 'array'],
            'items' => ['present', 'array'],
            'purchase_candidates' => ['present', 'array'],
            'outfits' => ['present', 'array'],
            'wear_logs' => ['present', 'array'],
            'weather_locations' => ['sometimes', 'array'],
            'weather_records' => ['sometimes', 'array'],
        ], [
            'owner.user_id.integer' => 'バックアップファイルの所有者情報が不正です。最新のバックアップファイルを選択してください。',
        ]);

        $payload = array_merge($validated, [
            'items' => $request->input('items', []),
            'purchase_candidates' => $request->input('purchase_candidates', []),
            'outfits' => $request->input('outfits', []),
            'wear_logs' => $request->input('wear_logs', []),
            'weather_locations' => $request->input('weather_locations', []),
            'weather_records' => $request->input('weather_records', []),
        ]);

        foreach (['owner', 'user_tpos', 'user_brands', 'visible_category_ids', 'user_preferences'] as $optionalKey) {
            if ($request->exists($optionalKey)) {
                $payload[$optionalKey] = $request->input($optionalKey);
            }
        }

        $counts = $this->importService->import($request->user(), $payload);

        return response()->json([
            'message' => 'imported',
            'counts' => $counts,
        ]);
    }
}
