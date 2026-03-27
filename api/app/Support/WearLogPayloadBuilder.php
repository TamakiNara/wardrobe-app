<?php

namespace App\Support;

use App\Models\WearLog;

class WearLogPayloadBuilder
{
    private static function buildThumbnailItem($wearLogItem): array
    {
        $sourceItem = $wearLogItem->sourceItem;
        $colors = collect($sourceItem?->colors ?? [])
            ->map(function ($color) {
                return [
                    'role' => $color['role'] ?? null,
                    'hex' => $color['hex'] ?? null,
                    'label' => $color['label'] ?? null,
                ];
            })
            ->filter(fn ($color) => in_array($color['role'], ['main', 'sub'], true) && is_string($color['hex']))
            ->values()
            ->all();

        return [
            'source_item_id' => $wearLogItem->source_item_id,
            'category' => $sourceItem?->category,
            'colors' => $colors,
        ];
    }

    public static function buildCalendarDaySummary(string $date, iterable $wearLogs): array
    {
        $entries = collect($wearLogs)->values();

        return [
            'date' => $date,
            'plannedCount' => $entries->where('status', 'planned')->count(),
            'wornCount' => $entries->where('status', 'worn')->count(),
            'dots' => $entries
                ->take(3)
                ->map(fn ($wearLog) => [
                    'status' => $wearLog->status,
                ])
                ->values()
                ->all(),
            'overflowCount' => max($entries->count() - 3, 0),
        ];
    }

    public static function buildByDateListItem(WearLog $wearLog): array
    {
        $wearLog->loadMissing('sourceOutfit');
        $wearLog->loadCount('wearLogItems');

        return [
            'id' => $wearLog->id,
            'status' => $wearLog->status,
            'event_date' => $wearLog->event_date?->format('Y-m-d'),
            'display_order' => $wearLog->display_order,
            'source_outfit_name' => $wearLog->sourceOutfit?->name,
            'items_count' => $wearLog->wear_log_items_count ?? $wearLog->wearLogItems()->count(),
            'memo' => $wearLog->memo,
        ];
    }

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
            'thumbnail_items' => $wearLog->wearLogItems
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($wearLogItem) => self::buildThumbnailItem($wearLogItem))
                ->all(),
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
