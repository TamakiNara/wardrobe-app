<?php

namespace App\Support;

use App\Models\Item;

class ItemImageSync
{
    public static function sync(Item $item, array $images): void
    {
        $item->images()->delete();

        if ($images === []) {
            return;
        }

        $item->images()->createMany(
            collect($images)
                ->map(function (array $image) {
                    return [
                        'disk' => $image['disk'] ?? null,
                        'path' => $image['path'] ?? null,
                        'original_filename' => $image['original_filename'] ?? null,
                        'mime_type' => $image['mime_type'] ?? null,
                        'file_size' => $image['file_size'] ?? null,
                        'sort_order' => $image['sort_order'],
                        'is_primary' => (bool) ($image['is_primary'] ?? false),
                    ];
                })
                ->all()
        );
    }
}
