<?php

namespace App\Support;

use App\Models\WearLog;

class WearLogPayloadBuilder
{
    public static function buildListItem(WearLog $wearLog): array
    {
        $wearLog->loadMissing(['sourceOutfit', 'wearLogItems.sourceItem']);

        return [
            'id' => $wearLog->id,
            'status' => $wearLog->status,
            'event_date' => $wearLog->event_date?->format('Y-m-d'),
            'display_order' => $wearLog->display_order,
            'source_outfit_id' => $wearLog->source_outfit_id,
            'source_outfit_name' => $wearLog->sourceOutfit?->name,
            'source_outfit_status' => $wearLog->sourceOutfit?->status,
            'has_disposed_items' => $wearLog->wearLogItems->contains(
                fn ($wearLogItem) => $wearLogItem->sourceItem?->status === 'disposed'
            ),
            'memo' => $wearLog->memo,
            'items_count' => $wearLog->wearLogItems->count(),
        ];
    }

    public static function buildDetail(WearLog $wearLog): array
    {
        $wearLog->loadMissing(['sourceOutfit', 'wearLogItems.sourceItem']);

        return [
            'id' => $wearLog->id,
            'status' => $wearLog->status,
            'event_date' => $wearLog->event_date?->format('Y-m-d'),
            'display_order' => $wearLog->display_order,
            'source_outfit_id' => $wearLog->source_outfit_id,
            'source_outfit_name' => $wearLog->sourceOutfit?->name,
            'source_outfit_status' => $wearLog->sourceOutfit?->status,
            'memo' => $wearLog->memo,
            'items' => $wearLog->wearLogItems
                ->sortBy('sort_order')
                ->values()
                ->map(function ($wearLogItem) {
                    return [
                        'id' => $wearLogItem->id,
                        'source_item_id' => $wearLogItem->source_item_id,
                        'item_name' => $wearLogItem->sourceItem?->name,
                        'source_item_status' => $wearLogItem->sourceItem?->status,
                        'sort_order' => $wearLogItem->sort_order,
                        'item_source_type' => $wearLogItem->item_source_type,
                    ];
                })
                ->all(),
            'created_at' => $wearLog->created_at?->toISOString(),
            'updated_at' => $wearLog->updated_at?->toISOString(),
        ];
    }
}
