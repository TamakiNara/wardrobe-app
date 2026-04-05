<?php

namespace App\Support;

use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateImage;
use App\Models\PurchaseCandidateMaterial;
use Illuminate\Support\Facades\Storage;

class PurchaseCandidatePayloadBuilder
{
    public static function buildListItem(PurchaseCandidate $candidate): array
    {
        $candidate->loadMissing(['category', 'images', 'colors']);

        $primaryImage = self::resolvePrimaryImage($candidate);

        return [
            'id' => $candidate->id,
            'status' => $candidate->status,
            'priority' => $candidate->priority,
            'name' => $candidate->name,
            'category_id' => $candidate->category_id,
            'category_name' => $candidate->category?->name,
            'brand_name' => $candidate->brand_name,
            'price' => $candidate->price,
            'sale_price' => $candidate->sale_price,
            'sale_ends_at' => $candidate->sale_ends_at?->toISOString(),
            'purchase_url' => $candidate->purchase_url,
            'colors' => $candidate->colors
                ->sortBy('sort_order')
                ->take(4)
                ->values()
                ->map(fn ($color) => [
                    'role' => $color->role,
                    'mode' => $color->mode,
                    'value' => $color->value,
                    'hex' => $color->hex,
                    'label' => $color->label,
                ])
                ->all(),
            'converted_item_id' => $candidate->converted_item_id,
            'converted_at' => $candidate->converted_at?->toISOString(),
            'primary_image' => $primaryImage === null ? null : self::buildImage($primaryImage),
            'updated_at' => $candidate->updated_at?->toISOString(),
        ];
    }

    public static function buildDetail(PurchaseCandidate $candidate): array
    {
        $candidate->loadMissing(['category', 'colors', 'seasons', 'tpos', 'images', 'materials']);

        return [
            'id' => $candidate->id,
            'status' => $candidate->status,
            'priority' => $candidate->priority,
            'name' => $candidate->name,
            'category_id' => $candidate->category_id,
            'category_name' => $candidate->category?->name,
            'brand_name' => $candidate->brand_name,
            'price' => $candidate->price,
            'sale_price' => $candidate->sale_price,
            'sale_ends_at' => $candidate->sale_ends_at?->toISOString(),
            'purchase_url' => $candidate->purchase_url,
            'memo' => $candidate->memo,
            'wanted_reason' => $candidate->wanted_reason,
            'size_gender' => $candidate->size_gender,
            'size_label' => $candidate->size_label,
            'size_note' => $candidate->size_note,
            'size_details' => $candidate->size_details,
            'is_rain_ok' => $candidate->is_rain_ok,
            'converted_item_id' => $candidate->converted_item_id,
            'converted_at' => $candidate->converted_at?->toISOString(),
            'colors' => $candidate->colors
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($color) => [
                    'role' => $color->role,
                    'mode' => $color->mode,
                    'value' => $color->value,
                    'hex' => $color->hex,
                    'label' => $color->label,
                ])
                ->all(),
            'seasons' => $candidate->seasons
                ->sortBy('sort_order')
                ->pluck('season')
                ->values()
                ->all(),
            'tpos' => $candidate->tpos
                ->sortBy('sort_order')
                ->pluck('tpo')
                ->values()
                ->all(),
            'materials' => ItemMaterialSupport::buildPayload(
                $candidate->materials
                    ->map(fn (PurchaseCandidateMaterial $material) => [
                        'part_label' => $material->part_label,
                        'material_name' => $material->material_name,
                        'ratio' => $material->ratio,
                    ])
                    ->all(),
            ),
            'images' => $candidate->images
                ->sortBy('sort_order')
                ->values()
                ->map(fn (PurchaseCandidateImage $image) => self::buildImage($image))
                ->all(),
            'created_at' => $candidate->created_at?->toISOString(),
            'updated_at' => $candidate->updated_at?->toISOString(),
        ];
    }

    public static function buildItemDraft(PurchaseCandidate $candidate): array
    {
        $candidate->loadMissing(['colors', 'seasons', 'tpos', 'images', 'materials']);

        $resolvedCategory = PurchaseCandidateCategoryMap::resolveItemDraftCategory($candidate->category_id);

        if ($resolvedCategory === null) {
            return [];
        }

        return [
            'name' => $candidate->name,
            'source_category_id' => $candidate->category_id,
            'category' => $resolvedCategory['category'],
            'subcategory' => $resolvedCategory['subcategory'] ?? null,
            'shape' => $resolvedCategory['shape'],
            'brand_name' => $candidate->brand_name,
            'price' => $candidate->price,
            'purchase_url' => $candidate->purchase_url,
            'memo' => $candidate->memo,
            'size_gender' => $candidate->size_gender,
            'size_label' => $candidate->size_label,
            'size_note' => $candidate->size_note,
            'purchased_at' => null,
            'size_details' => $candidate->size_details,
            'spec' => null,
            'is_rain_ok' => $candidate->is_rain_ok,
            'colors' => $candidate->colors
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($color) => [
                    'role' => $color->role,
                    'mode' => $color->mode,
                    'value' => $color->value,
                    'hex' => $color->hex,
                    'label' => $color->label,
                ])
                ->all(),
            'seasons' => $candidate->seasons
                ->sortBy('sort_order')
                ->pluck('season')
                ->values()
                ->all(),
            'tpos' => $candidate->tpos
                ->sortBy('sort_order')
                ->pluck('tpo')
                ->values()
                ->all(),
            'materials' => ItemMaterialSupport::buildPayload(
                $candidate->materials
                    ->map(fn (PurchaseCandidateMaterial $material) => [
                        'part_label' => $material->part_label,
                        'material_name' => $material->material_name,
                        'ratio' => $material->ratio,
                    ])
                    ->all(),
            ),
        ];
    }

    public static function buildDuplicateDraft(
        PurchaseCandidate $candidate,
        string $duplicatedName,
    ): array {
        $candidate->loadMissing(['colors', 'seasons', 'tpos', 'images', 'materials']);

        return [
            'status' => 'considering',
            'priority' => $candidate->priority,
            'name' => $duplicatedName,
            'category_id' => $candidate->category_id,
            'brand_name' => $candidate->brand_name,
            'price' => $candidate->price,
            'sale_price' => $candidate->sale_price,
            'sale_ends_at' => $candidate->sale_ends_at?->toISOString(),
            'purchase_url' => $candidate->purchase_url,
            'memo' => $candidate->memo,
            'wanted_reason' => $candidate->wanted_reason,
            'size_gender' => $candidate->size_gender,
            'size_label' => $candidate->size_label,
            'size_note' => $candidate->size_note,
            'size_details' => $candidate->size_details,
            'is_rain_ok' => $candidate->is_rain_ok,
            'colors' => $candidate->colors
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($color) => [
                    'role' => $color->role,
                    'mode' => $color->mode,
                    'value' => $color->value,
                    'hex' => $color->hex,
                    'label' => $color->label,
                ])
                ->all(),
            'seasons' => $candidate->seasons
                ->sortBy('sort_order')
                ->pluck('season')
                ->values()
                ->all(),
            'tpos' => $candidate->tpos
                ->sortBy('sort_order')
                ->pluck('tpo')
                ->values()
                ->all(),
            'materials' => ItemMaterialSupport::buildPayload(
                $candidate->materials
                    ->map(fn (PurchaseCandidateMaterial $material) => [
                        'part_label' => $material->part_label,
                        'material_name' => $material->material_name,
                        'ratio' => $material->ratio,
                    ])
                    ->all(),
            ),
            'images' => $candidate->images
                ->sortBy('sort_order')
                ->values()
                ->map(fn (PurchaseCandidateImage $image) => self::buildDuplicateImage($image))
                ->all(),
        ];
    }

    public static function buildCandidateSummary(PurchaseCandidate $candidate): array
    {
        return [
            'id' => $candidate->id,
            'status' => $candidate->status,
            'priority' => $candidate->priority,
            'name' => $candidate->name,
            'converted_item_id' => $candidate->converted_item_id,
            'converted_at' => $candidate->converted_at?->toISOString(),
        ];
    }

    public static function buildImage(PurchaseCandidateImage $image): array
    {
        return [
            'id' => $image->id,
            'purchase_candidate_id' => $image->purchase_candidate_id,
            'disk' => $image->disk,
            'path' => $image->path,
            'url' => self::buildImageUrl($image),
            'original_filename' => $image->original_filename,
            'mime_type' => $image->mime_type,
            'file_size' => $image->file_size,
            'sort_order' => $image->sort_order,
            'is_primary' => $image->is_primary,
        ];
    }

    public static function buildDuplicateImage(PurchaseCandidateImage $image): array
    {
        return array_merge(self::buildImage($image), [
            'source_image_id' => $image->id,
        ]);
    }

    private static function resolvePrimaryImage(PurchaseCandidate $candidate): ?PurchaseCandidateImage
    {
        /** @var PurchaseCandidateImage|null $primaryImage */
        $primaryImage = $candidate->images
            ->sortBy('sort_order')
            ->firstWhere('is_primary', true);

        return $primaryImage ?? $candidate->images->sortBy('sort_order')->first();
    }

    private static function buildImageUrl(PurchaseCandidateImage $image): ?string
    {
        if ($image->disk === null || $image->path === null) {
            return null;
        }

        return Storage::disk($image->disk)->url($image->path);
    }
}
