<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Settings\UserTpoService;
use App\Support\UserTpoPayloadBuilder;
use Illuminate\Http\Request;

class SettingsTpoController extends Controller
{
    public function __construct(
        private readonly UserTpoService $userTpoService,
    ) {}

    public function index(Request $request)
    {
        $validated = $request->validate([
            'active_only' => ['nullable', 'boolean'],
        ]);

        $tpos = $this->userTpoService->list(
            $request->user(),
            filter_var($validated['active_only'] ?? false, FILTER_VALIDATE_BOOLEAN),
        );

        return response()->json([
            'tpos' => $tpos->map(fn ($tpo) => UserTpoPayloadBuilder::build($tpo))->all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
        ], [
            'name.required' => 'TPO 名を入力してください。',
        ]);

        $tpo = $this->userTpoService->create($request->user(), $validated);

        return response()->json([
            'message' => 'created',
            'tpo' => UserTpoPayloadBuilder::build($tpo),
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:50'],
            'isActive' => ['sometimes', 'boolean'],
            'sortOrder' => ['sometimes', 'integer', 'min:1'],
        ], [
            'name.required' => 'TPO 名を入力してください。',
        ]);

        if ($validated === []) {
            return response()->json([
                'message' => '更新項目がありません。',
            ], 422);
        }

        $tpo = $this->userTpoService->update($request->user(), $id, $validated);

        return response()->json([
            'message' => 'updated',
            'tpo' => UserTpoPayloadBuilder::build($tpo),
        ]);
    }
}
