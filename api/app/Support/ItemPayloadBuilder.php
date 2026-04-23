<?php

namespace App\Support;

use App\Models\Item;
use App\Models\ItemImage;
use App\Models\ItemMaterial;
use Illuminate\Support\Facades\Storage;

class ItemPayloadBuilder
{
    public static function buildDetail(Item $item, bool $includeMaterials = true): array
    {
        $relations = ['images'];

        if ($includeMaterials) {
            $relations[] = 'materials';
        }

        $item->loadMissing($relations);

        return [
            'id' => $item->id,
            'name' => $item->name,
            'status' => $item->status,
            'care_status' => $item->care_status,
            'brand_name' => $item->brand_name,
            'price' => $item->price,
            'purchase_url' => $item->purchase_url,
            'memo' => $item->memo,
            'purchased_at' => $item->purchased_at?->toISOString(),
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
            'tpos' => $item->relationLoaded('user') || $item->user !== null
                ? UserTpoNameResolver::resolveNames($item->user, $item->tpo_ids ?? [], $item->tpos ?? [])
                : ($item->tpos ?? []),
            'tpo_ids' => $item->tpo_ids ?? [],
            // 分類軸の正本はトップレベルの shape とする。
            // spec.tops.shape は互換値なので、response には含めない。
            'spec' => ItemSpecPayloadSupport::buildResponseSpec($item->spec),
            'materials' => $includeMaterials
                ? ItemMaterialSupport::buildPayload(
                    $item->materials
                        ->map(fn (ItemMaterial $material) => [
                            'part_label' => $material->part_label,
                            'material_name' => $material->material_name,
                            'ratio' => $material->ratio,
                        ])
                        ->all(),
                )
                : [],
            'images' => $item->images
                ->sortBy('sort_order')
                ->values()
                ->map(fn (ItemImage $image) => self::buildImage($image))
                ->all(),
        ];
    }

    public static function buildImage(ItemImage $image): array
    {
        return [
            'id' => $image->id,
            'item_id' => $image->item_id,
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

    private static function buildImageUrl(ItemImage $image): ?string
    {
        if ($image->disk === null || $image->path === null) {
            return null;
        }

        return Storage::disk($image->disk)->url($image->path);
    }
}
