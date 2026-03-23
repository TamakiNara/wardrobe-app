<?php

namespace App\Services\Outfits;

use App\Models\Item;
use App\Models\Outfit;

class OutfitStatusService
{
    public function invalidateActiveOutfitsContainingItem(Item $item): int
    {
        // TODO: invalid 理由の保持や event log 連携が必要になったら service を拡張する
        return Outfit::query()
            ->where('user_id', $item->user_id)
            ->where('status', 'active')
            ->whereHas('outfitItems', fn ($query) => $query->where('item_id', $item->id))
            ->update([
                'status' => 'invalid',
            ]);
    }
}
