<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Items\ItemImageService;
use App\Support\ItemPayloadBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemImageController extends Controller
{
    public function __construct(
        private readonly ItemImageService $itemImageService,
    ) {
    }

    public function store(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(
            [
                'image' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
                'sort_order' => ['nullable', 'integer', 'min:1'],
                'is_primary' => ['nullable', 'boolean'],
            ],
            [
                'image.required' => '画像を選択してください。',
                'image.image' => '対応していない画像形式です。JPEG / PNG / WebP を選んでください。',
                'image.mimes' => '対応していない画像形式です。JPEG / PNG / WebP を選んでください。',
                'image.max' => '画像サイズは5MB以下にしてください。',
                'sort_order.integer' => '画像の並び順が不正です。',
                'sort_order.min' => '画像の並び順が不正です。',
                'is_primary.boolean' => '代表画像フラグが不正です。',
            ],
        );

        $image = $this->itemImageService->addImage(
            $request->user(),
            $id,
            $validated['image'],
            $validated['sort_order'] ?? null,
            $validated['is_primary'] ?? null,
        );

        return response()->json([
            'message' => 'created',
            'image' => ItemPayloadBuilder::buildImage($image),
        ], 201);
    }

    public function destroy(Request $request, int $id, int $imageId): JsonResponse
    {
        $this->itemImageService->deleteImage($request->user(), $id, $imageId);

        return response()->json([
            'message' => 'deleted',
        ]);
    }
}
