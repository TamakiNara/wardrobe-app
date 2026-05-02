<?php

namespace App\Support;

use App\Models\Item;
use App\Models\ItemImage;
use App\Models\ItemMaterial;

class ItemDuplicatePayloadBuilder
{
    public static function buildDuplicateDraft(Item $item, string $duplicateName): array
    {
        return self::buildBaseDraft($item, [
            'name' => $duplicateName,
        ]);
    }

    public static function buildColorVariantDraft(Item $item): array
    {
        return self::buildBaseDraft($item, [
            'colors' => [],
            'variant_source_item_id' => $item->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private static function buildBaseDraft(Item $item, array $overrides = []): array
    {
        $item->loadMissing(['images', 'materials']);

        $base = [
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
            'is_rain_ok' => (bool) $item->is_rain_ok,
            'sheerness' => $item->sheerness,
            'category' => $item->category,
            'subcategory' => $item->subcategory,
            'shape' => $item->shape,
            'colors' => $item->colors ?? [],
            'seasons' => $item->seasons ?? [],
            'tpos' => $item->tpos ?? [],
            'tpo_ids' => $item->tpo_ids ?? [],
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
            'images' => $item->images
                ->sortBy('sort_order')
                ->values()
                ->map(fn (ItemImage $image) => ItemPayloadBuilder::buildImage($image))
                ->all(),
        ];

        return array_merge($base, $overrides);
    }
}
