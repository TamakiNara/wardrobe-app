<?php

namespace App\Support;

use App\Models\Item;

class ItemMaterialSync
{
    /**
     * @param  array<int, array<string, mixed>>  $materials
     */
    public static function sync(Item $item, array $materials): void
    {
        $normalized = ItemMaterialSupport::normalizeForStorage($materials);

        $item->materials()->delete();

        if ($normalized === []) {
            return;
        }

        $item->materials()->createMany($normalized);
    }
}
