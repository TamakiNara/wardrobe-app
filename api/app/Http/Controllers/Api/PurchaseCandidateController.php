<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PurchaseCandidates\PurchaseCandidateService;
use App\Support\PurchaseCandidatePayloadBuilder;
use App\Support\PurchaseCandidatesIndexQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $validated = $this->validateRequest($request);
        $candidate = $this->purchaseCandidateService->store($request->user(), $validated);

        return response()->json([
            'message' => 'created',
            'purchaseCandidate' => PurchaseCandidatePayloadBuilder::buildDetail($candidate),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $this->validateRequest($request);
        $candidate = $this->purchaseCandidateService->update($request->user(), $id, $validated);

        return response()->json([
            'message' => 'updated',
            'purchaseCandidate' => PurchaseCandidatePayloadBuilder::buildDetail($candidate),
        ]);
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
        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'sort_order' => ['nullable', 'integer', 'min:1'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

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

    private function validateRequest(Request $request): array
    {
        return $request->validate([
            'status' => ['nullable', 'string', 'in:considering,on_hold,purchased,dropped'],
            'priority' => ['nullable', 'string', 'in:high,medium,low'],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'string', 'exists:category_master,id'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'integer', 'min:0'],
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
}
