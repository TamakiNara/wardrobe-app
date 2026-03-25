<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PurchaseCandidates\PurchaseCandidateService;
use App\Support\PurchaseCandidatePayloadBuilder;
use App\Support\PurchaseCandidatesIndexQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PurchaseCandidateController extends Controller
{
    public function __construct(
        private readonly PurchaseCandidateService $purchaseCandidateService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json(PurchaseCandidatesIndexQuery::build($request->user(), $request));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $candidate = $this->purchaseCandidateService->findOwnedCandidate($request->user(), $id);

        return response()->json([
            'purchaseCandidate' => PurchaseCandidatePayloadBuilder::buildDetail($candidate),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateStoreRequest($request);
        $candidate = $this->purchaseCandidateService->store($request->user(), $validated);

        return response()->json([
            'message' => 'created',
            'purchaseCandidate' => PurchaseCandidatePayloadBuilder::buildDetail($candidate),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $candidate = $this->purchaseCandidateService->findOwnedCandidate($request->user(), $id);
        $validated = $this->validateUpdateRequest($request, $candidate);
        $candidate = $this->purchaseCandidateService->update($request->user(), $id, $validated);

        return response()->json([
            'message' => 'updated',
            'purchaseCandidate' => PurchaseCandidatePayloadBuilder::buildDetail($candidate),
        ]);
    }

    public function duplicate(Request $request, int $id): JsonResponse
    {
        $candidate = $this->purchaseCandidateService->duplicate($request->user(), $id);

        return response()->json([
            'message' => 'created',
            'purchaseCandidate' => PurchaseCandidatePayloadBuilder::buildDetail($candidate),
        ], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->purchaseCandidateService->delete($request->user(), $id);

        return response()->json([
            'message' => 'deleted',
        ]);
    }

    public function uploadImage(Request $request, int $id): JsonResponse
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

        $image = $this->purchaseCandidateService->addImage(
            $request->user(),
            $id,
            $validated['image'],
            $validated['sort_order'] ?? null,
            $validated['is_primary'] ?? null,
        );

        return response()->json([
            'message' => 'created',
            'image' => PurchaseCandidatePayloadBuilder::buildImage($image),
        ], 201);
    }

    public function deleteImage(Request $request, int $id, int $imageId): JsonResponse
    {
        $this->purchaseCandidateService->deleteImage($request->user(), $id, $imageId);

        return response()->json([
            'message' => 'deleted',
        ]);
    }

    public function itemDraft(Request $request, int $id): JsonResponse
    {
        return response()->json(
            $this->purchaseCandidateService->buildItemDraft($request->user(), $id)
        );
    }

    private function validateStoreRequest(Request $request): array
    {
        return $request->validate([
            'status' => ['nullable', 'string', 'in:considering,on_hold,purchased,dropped'],
            'priority' => ['nullable', 'string', 'in:high,medium,low'],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'string', 'exists:category_master,id'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'integer', 'min:0'],
            'sale_price' => ['nullable', 'integer', 'min:0'],
            'sale_ends_at' => ['nullable', 'date'],
            'purchase_url' => ['nullable', 'url'],
            'memo' => ['nullable', 'string'],
            'wanted_reason' => ['nullable', 'string'],
            'size_gender' => ['nullable', 'string', 'in:women,men,unisex,unknown'],
            'size_label' => ['nullable', 'string', 'max:50'],
            'size_note' => ['nullable', 'string'],
            'is_rain_ok' => ['nullable', 'boolean'],
            'colors' => ['required', 'array', 'min:1'],
            'colors.*.role' => ['required', 'string', 'in:main,sub'],
            'colors.*.mode' => ['required', 'string', 'in:preset,custom'],
            'colors.*.value' => ['required', 'string', 'max:100'],
            'colors.*.hex' => ['required', 'string', 'max:20'],
            'colors.*.label' => ['required', 'string', 'max:100'],
            'seasons' => ['nullable', 'array'],
            'seasons.*' => ['string', 'max:50'],
            'tpos' => ['nullable', 'array'],
            'tpos.*' => ['string', 'max:50'],
        ]);
    }

    private function validateUpdateRequest(Request $request, \App\Models\PurchaseCandidate $candidate): array
    {
        if ($candidate->status === 'purchased') {
            $this->ensurePurchasedUpdatePayloadContainsOnlyEditableFields($request);

            return $request->validate([
                'priority' => ['nullable', 'string', 'in:high,medium,low'],
                'sale_price' => ['nullable', 'integer', 'min:0'],
                'sale_ends_at' => ['nullable', 'date'],
                'purchase_url' => ['nullable', 'url'],
                'memo' => ['nullable', 'string'],
                'wanted_reason' => ['nullable', 'string'],
            ]);
        }

        return $this->validateStoreRequest($request);
    }

    private function ensurePurchasedUpdatePayloadContainsOnlyEditableFields(Request $request): void
    {
        $forbiddenFields = [
            'status',
            'name',
            'category_id',
            'brand_name',
            'price',
            'size_gender',
            'size_label',
            'size_note',
            'is_rain_ok',
            'colors',
            'seasons',
            'tpos',
        ];

        $messages = [];
        foreach ($forbiddenFields as $field) {
            if ($request->exists($field)) {
                $messages[$field] = '購入済みの購入検討では変更できません。';
            }
        }

        if ($messages !== []) {
            throw ValidationException::withMessages($messages);
        }
    }
}
