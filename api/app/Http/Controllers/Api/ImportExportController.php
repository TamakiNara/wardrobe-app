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
            'owner.user_id' => ['required', 'integer'],
            'items' => ['present', 'array'],
            'purchase_candidates' => ['present', 'array'],
            'outfits' => ['present', 'array'],
        ], [
            'owner.user_id.required' => 'このバックアップファイルは現在の形式に対応していないため復元できません。最新の形式で再度バックアップしてください。',
            'owner.user_id.integer' => 'バックアップファイルの所有者情報を確認できません。別のバックアップファイルを選択してください。',
        ]);

        $counts = $this->importService->import($request->user(), array_merge($validated, [
            'owner' => $request->input('owner', []),
            'items' => $request->input('items', []),
            'purchase_candidates' => $request->input('purchase_candidates', []),
            'outfits' => $request->input('outfits', []),
        ]));

        return response()->json([
            'message' => 'imported',
            'counts' => $counts,
        ]);
    }
}
