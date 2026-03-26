<?php

namespace App\Support;

use App\Models\Item;
use App\Models\ItemImage;
use Illuminate\Support\Facades\Storage;

class ItemPayloadBuilder
{
    public static function buildDetail(Item $item): array
    {
        $item->loadMissing('images');

        return [
            'id' => $item->id,
            'name' => $item->name,
            'status' => $item->status,
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
            'shape' => $item->shape,
            'colors' => $item->colors ?? [],
            'seasons' => $item->seasons ?? [],
            'tpos' => $item->tpos ?? [],
            'spec' => $item->spec,
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
