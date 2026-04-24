<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PurchaseCandidates\PurchaseCandidateService;
use App\Support\ItemMaterialSupport;
use App\Support\ItemMaterialValidator;
use App\Support\PurchaseCandidatePayloadBuilder;
use App\Support\PurchaseCandidatesIndexQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PurchaseCandidateController extends Controller
{
    public function __construct(
        private readonly PurchaseCandidateService $purchaseCandidateService,
    ) {}

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
        $payload = $this->purchaseCandidateService->duplicate($request->user(), $id);

        return response()->json([
            'message' => 'duplicated_payload_ready',
            'purchaseCandidate' => $payload,
        ]);
    }

    public function colorVariant(Request $request, int $id): JsonResponse
    {
        $payload = $this->purchaseCandidateService->colorVariant($request->user(), $id);

        return response()->json([
            'message' => 'color_variant_payload_ready',
            'purchaseCandidate' => $payload,
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
        $this->prepareMaterialsForValidation($request);

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:considering,on_hold,purchased,dropped'],
            'priority' => ['nullable', 'string', 'in:high,medium,low'],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'string', 'exists:category_master,id'],
            'variant_source_candidate_id' => ['nullable', 'integer', 'exists:purchase_candidates,id'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'save_brand_as_candidate' => ['nullable', 'boolean'],
            'price' => ['nullable', 'integer', 'min:0'],
            'sale_price' => ['nullable', 'integer', 'min:0'],
            'sale_ends_at' => ['nullable', 'date'],
            'purchase_url' => ['nullable', 'url'],
            'memo' => ['nullable', 'string'],
            'wanted_reason' => ['nullable', 'string'],
            'size_gender' => ['nullable', 'string', 'in:women,men,unisex'],
            'size_label' => ['nullable', 'string', 'max:50'],
            'size_note' => ['nullable', 'string'],
            'size_details' => ['nullable', 'array:structured,custom_fields'],
            'size_details.structured' => ['nullable', 'array:shoulder_width,body_width,body_length,sleeve_length,sleeve_width,cuff_width,neck_circumference,waist,hip,rise,inseam,hem_width,thigh_width,total_length'],
            'size_details.structured.shoulder_width' => ['nullable', 'numeric'],
            'size_details.structured.body_width' => ['nullable', 'numeric'],
            'size_details.structured.body_length' => ['nullable', 'numeric'],
            'size_details.structured.sleeve_length' => ['nullable', 'numeric'],
            'size_details.structured.sleeve_width' => ['nullable', 'numeric'],
            'size_details.structured.cuff_width' => ['nullable', 'numeric'],
            'size_details.structured.neck_circumference' => ['nullable', 'numeric'],
            'size_details.structured.waist' => ['nullable', 'numeric'],
            'size_details.structured.hip' => ['nullable', 'numeric'],
            'size_details.structured.rise' => ['nullable', 'numeric'],
            'size_details.structured.inseam' => ['nullable', 'numeric'],
            'size_details.structured.hem_width' => ['nullable', 'numeric'],
            'size_details.structured.thigh_width' => ['nullable', 'numeric'],
            'size_details.structured.total_length' => ['nullable', 'numeric'],
            'size_details.custom_fields' => ['nullable', 'array', 'max:10'],
            'size_details.custom_fields.*' => ['array:label,value,sort_order'],
            'size_details.custom_fields.*.label' => ['required_with:size_details.custom_fields.*.value', 'string', 'max:50'],
            'size_details.custom_fields.*.value' => ['required_with:size_details.custom_fields.*.label', 'numeric'],
            'size_details.custom_fields.*.sort_order' => ['required', 'integer', 'min:1'],
            'spec' => ['nullable', 'array:tops,bottoms,skirt,legwear'],
            'spec.tops' => ['nullable', 'array:sleeve,length,neck,design,fit'],
            'spec.tops.sleeve' => ['nullable', 'string', 'max:100'],
            'spec.tops.length' => ['nullable', 'string', 'max:100'],
            'spec.tops.neck' => ['nullable', 'string', 'max:100'],
            'spec.tops.design' => ['nullable', 'string', 'max:100'],
            'spec.tops.fit' => ['nullable', 'string', 'max:100'],
            'spec.bottoms' => ['nullable', 'array:length_type,rise_type'],
            'spec.bottoms.length_type' => ['nullable', 'string', 'in:mini,short,half,cropped,ankle,full,knee,midi'],
            'spec.bottoms.rise_type' => ['nullable', 'string', 'in:high_waist,low_rise'],
            'spec.skirt' => ['nullable', 'array:length_type,material_type,design_type'],
            'spec.skirt.length_type' => ['nullable', 'string', 'in:mini,knee,midi,mid_calf,long,maxi'],
            'spec.skirt.material_type' => ['nullable', 'string', 'in:tulle,lace,denim,leather,satin'],
            'spec.skirt.design_type' => ['nullable', 'string', 'in:tuck,gather,pleats,tiered,wrap,balloon,trench'],
            'spec.legwear' => ['nullable', 'array:coverage_type'],
            'spec.legwear.coverage_type' => ['nullable', 'string', 'in:foot_cover,ankle_sneaker,crew,three_quarter,high_socks,stockings,tights,one_tenth,three_tenths,five_tenths,seven_tenths,seven_eighths,ten_tenths,twelve_tenths'],
            'is_rain_ok' => ['nullable', 'boolean'],
            'colors' => ['required', 'array', 'min:1'],
            'colors.*.role' => ['required', 'string', 'in:main,sub'],
            'colors.*.mode' => ['required', 'string', 'in:preset,custom'],
            'colors.*.value' => ['required', 'string', 'max:100'],
            'colors.*.hex' => ['required', 'string', 'max:20'],
            'colors.*.label' => ['required', 'string', 'max:100'],
            'colors.*.custom_label' => ['nullable', 'string', 'max:50'],
            'seasons' => ['nullable', 'array'],
            'seasons.*' => ['string', 'max:50'],
            'tpos' => ['nullable', 'array'],
            'tpos.*' => ['string', 'max:50'],
            'materials' => ['nullable', 'array'],
            'materials.*' => ['array:part_label,material_name,ratio'],
            'materials.*.part_label' => ['required', 'string', 'max:100'],
            'materials.*.material_name' => ['required', 'string', 'max:100'],
            'materials.*.ratio' => ['required', 'integer', 'between:1,100'],
            'duplicate_images' => ['nullable', 'array'],
            'duplicate_images.*' => ['array:source_image_id'],
            'duplicate_images.*.source_image_id' => ['required', 'integer', 'distinct'],
        ]);

        ItemMaterialValidator::validate($validated);

        return $validated;
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
            'variant_source_candidate_id',
            'brand_name',
            'save_brand_as_candidate',
            'price',
            'size_gender',
            'size_label',
            'size_note',
            'size_details',
            'spec',
            'is_rain_ok',
            'colors',
            'seasons',
            'tpos',
            'materials',
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

    private function prepareMaterialsForValidation(Request $request): void
    {
        $materials = $request->input('materials');

        if (! is_array($materials)) {
            return;
        }

        $normalized = array_map(function ($material) {
            if (! is_array($material)) {
                return $material;
            }

            return [
                'part_label' => ItemMaterialSupport::normalizeText($material['part_label'] ?? null),
                'material_name' => ItemMaterialSupport::normalizeText($material['material_name'] ?? null),
                'ratio' => $material['ratio'] ?? null,
            ];
        }, $materials);

        $request->merge([
            'materials' => $normalized,
        ]);
    }
}
