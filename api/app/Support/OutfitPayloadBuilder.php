<?php

namespace App\Support;

use App\Models\Outfit;

class OutfitPayloadBuilder
{
    public static function buildDetail(Outfit $outfit): array
    {
        $outfit->loadMissing(['outfitItems.item', 'user']);
        $user = $outfit->user;

        return [
            'id' => $outfit->id,
            'status' => $outfit->status,
            'name' => $outfit->name,
            'memo' => $outfit->memo,
            'seasons' => $outfit->seasons ?? [],
            'tpos' => $user !== null
                ? UserTpoNameResolver::resolveNames($user, $outfit->tpo_ids ?? [], $outfit->tpos ?? [])
                : ($outfit->tpos ?? []),
            'tpo_ids' => $outfit->tpo_ids ?? [],
            'outfit_items' => $outfit->outfitItems
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($outfitItem) => [
                    'id' => $outfitItem->id,
                    'item_id' => $outfitItem->item_id,
                    'sort_order' => $outfitItem->sort_order,
                    'item' => $outfitItem->item,
                ])
                ->all(),
        ];
    }
}
