<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImportExport\ExportService;
use App\Services\ImportExport\ImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ImportExportController extends Controller
{
    public function __construct(
        private readonly ExportService $exportService,
        private readonly ImportService $importService,
    ) {}

    public function export(Request $request): JsonResponse
    {
        $user = $request->user();
        $startedAt = microtime(true);

        Log::info('import_export.export.start', [
            'operation' => 'import_export.export.start',
            'user_id' => $user->id,
            'target' => 'backup',
        ]);

        try {
            $payload = $this->exportService->export($user);

            Log::info('import_export.export.completed', [
                'operation' => 'import_export.export.completed',
                'user_id' => $user->id,
                'target' => 'backup',
                'result' => 'success',
                ...$this->buildExportCountSummary($payload),
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);

            return response()->json($payload);
        } catch (\Throwable $exception) {
            Log::error('import_export.export.failed', [
                'operation' => 'import_export.export.failed',
                'user_id' => $user->id,
                'target' => 'backup',
                'result' => 'failed',
                'exception_class' => $exception::class,
                'message' => $exception->getMessage(),
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);

            throw $exception;
        }
    }

    public function import(Request $request): JsonResponse
    {
        $user = $request->user();
        $startedAt = microtime(true);

        Log::info('import_export.import.start', [
            'operation' => 'import_export.import.start',
            'user_id' => $user->id,
            'target' => 'backup',
            ...$this->buildImportPayloadSummary($request),
        ]);

        try {
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
                'shopping_memos' => ['sometimes', 'array'],
                'shopping_memo_items' => ['sometimes', 'array'],
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
                'shopping_memos' => $request->input('shopping_memos', []),
                'shopping_memo_items' => $request->input('shopping_memo_items', []),
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

            $counts = $this->importService->import(
                $user,
                $payload,
                $startedAt,
            );

            return response()->json([
                'message' => 'imported',
                'counts' => $counts,
            ]);
        } catch (\Throwable $exception) {
            Log::error('import_export.import.failed', [
                'operation' => 'import_export.import.failed',
                'user_id' => $user->id,
                'target' => 'backup',
                'result' => 'failed',
                'exception_class' => $exception::class,
                'message' => $exception->getMessage(),
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);

            throw $exception;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, int>
     */
    private function buildExportCountSummary(array $payload): array
    {
        $keys = [
            'user_tpos',
            'user_brands',
            'items',
            'purchase_candidates',
            'shopping_memos',
            'shopping_memo_items',
            'outfits',
            'wear_logs',
            'weather_locations',
            'weather_records',
        ];

        $counts = [];

        foreach ($keys as $key) {
            $counts[$key] = is_array($payload[$key] ?? null) ? count($payload[$key]) : 0;
        }

        return $counts;
    }

    /**
     * @return array<string, int|bool|null>
     */
    private function buildImportPayloadSummary(Request $request): array
    {
        $keys = [
            'user_tpos',
            'user_brands',
            'visible_category_ids',
            'user_preferences',
            'items',
            'purchase_candidates',
            'shopping_memos',
            'shopping_memo_items',
            'outfits',
            'wear_logs',
            'weather_locations',
            'weather_records',
        ];

        $summary = [
            'version' => $request->integer('version'),
            'has_owner' => $request->exists('owner'),
        ];

        foreach ($keys as $key) {
            $value = $request->input($key);
            $summary[$key] = is_array($value) ? count($value) : 0;
        }

        return $summary;
    }

    private function elapsedMilliseconds(float $startedAt): int
    {
        return (int) round((microtime(true) - $startedAt) * 1000);
    }
}
