<?php

namespace App\Services\ImportExport;

use App\Models\Item;
use App\Models\ItemMaterial;
use App\Models\Outfit;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateMaterial;
use App\Models\User;
use App\Support\ImportExportImageSupport;
use App\Support\ItemMaterialSupport;
use App\Support\ItemSpecPayloadSupport;

class ExportService
{
    public function export(User $user): array
    {
        return [
            'version' => 1,
            'exported_at' => now()->toISOString(),
            'owner' => [
                'user_id' => $user->id,
            ],
            'items' => Item::query()
                ->where('user_id', $user->id)
                ->with(['images', 'materials'])
                ->orderBy('id')
                ->get()
                ->map(fn (Item $item) => $this->buildItemPayload($item))
                ->all(),
            'purchase_candidates' => PurchaseCandidate::query()
                ->where('user_id', $user->id)
                ->with(['colors', 'seasons', 'tpos', 'images', 'materials'])
                ->orderBy('id')
                ->get()
                ->map(fn (PurchaseCandidate $candidate) => $this->buildPurchaseCandidatePayload($candidate))
                ->all(),
            'outfits' => Outfit::query()
                ->where('user_id', $user->id)
                ->with('outfitItems')
                ->orderBy('id')
                ->get()
                ->map(fn (Outfit $outfit) => $this->buildOutfitPayload($outfit))
                ->all(),
        ];
    }

    private function buildItemPayload(Item $item): array
    {
        return [
            'id' => $item->id,
            'status' => $item->status,
            'care_status' => $item->care_status,
            'name' => $item->name,
            'brand_name' => $item->brand_name,
            'price' => $item->price,
            'purchase_url' => $item->purchase_url,
            'memo' => $item->memo,
            'purchased_at' => $item->purchased_at?->toDateString(),
            'size_gender' => $item->size_gender,
            'size_label' => $item->size_label,
            'size_note' => $item->size_note,
            'size_details' => $item->size_details,
            'is_rain_ok' => $item->is_rain_ok,
            'category' => $item->category,
            'subcategory' => $item->subcategory,
            'shape' => $item->shape,
            'colors' => $item->colors ?? [],
            'seasons' => $item->seasons ?? [],
            'tpo_ids' => $item->tpo_ids ?? [],
            'tpos' => $item->tpos ?? [],
            'spec' => ItemSpecPayloadSupport::buildResponseSpec($item->spec),
            'materials' => ItemMaterialSupport::buildPayload(
                $item->materials
                    ->map(fn (ItemMaterial $material) => [
                        'part_label' => $material->part_label,
                        'material_name' => $material->material_name,
                        'ratio' => $material->ratio,
                    ])
                    ->all(),
            ),
            'images' => ImportExportImageSupport::buildExportPayload($item->images),
        ];
    }

    private function buildPurchaseCandidatePayload(PurchaseCandidate $candidate): array
    {
        return [
            'id' => $candidate->id,
            'group_id' => $candidate->group_id,
            'group_order' => $candidate->group_order,
            'status' => $candidate->status,
            'priority' => $candidate->priority,
            'name' => $candidate->name,
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
            'spec' => ItemSpecPayloadSupport::buildResponseSpec(
                is_array($candidate->spec) ? $candidate->spec : null,
            ),
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
                    'custom_label' => $color->custom_label,
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
            'images' => ImportExportImageSupport::buildExportPayload($candidate->images),
        ];
    }

    private function buildOutfitPayload(Outfit $outfit): array
    {
        return [
            'id' => $outfit->id,
            'status' => $outfit->status,
            'name' => $outfit->name,
            'memo' => $outfit->memo,
            'seasons' => $outfit->seasons ?? [],
            'tpo_ids' => $outfit->tpo_ids ?? [],
            'tpos' => $outfit->tpos ?? [],
            'outfit_items' => $outfit->outfitItems
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($outfitItem) => [
                    'item_id' => $outfitItem->item_id,
                    'sort_order' => $outfitItem->sort_order,
                ])
                ->all(),
        ];
    }
}
