<?php

namespace App\Support;

use App\Models\WearLog;
use App\Models\WeatherRecord;

class WearLogPayloadBuilder
{
    private static function weatherCalendarStatusFromSourceType(?string $sourceType): string
    {
        return match ($sourceType) {
            'forecast_api' => 'forecast',
            'historical_api' => 'observed',
            'manual' => 'manual',
            default => 'manual',
        };
    }

    private static function weatherCalendarStatusPriority(string $status): int
    {
        return match ($status) {
            'observed' => 0,
            'manual' => 1,
            'forecast' => 2,
            default => 3,
        };
    }

    private static function weatherCalendarLocationPriority(WeatherRecord $record): array
    {
        $location = $record->location;

        return [
            $record->location_id === null ? 1 : 0,
            $location?->is_default ? 0 : 1,
            $location?->display_order ?? PHP_INT_MAX,
            $record->id,
        ];
    }

    /**
     * @param  iterable<WeatherRecord>  $weatherRecords
     * @return array{
     *     status: string,
     *     weather_code: string|null,
     *     has_weather: bool
     * }
     */
    private static function buildCalendarWeatherSummary(iterable $weatherRecords): array
    {
        $records = collect($weatherRecords)
            ->filter(fn ($record) => $record instanceof WeatherRecord)
            ->values();

        if ($records->isEmpty()) {
            return [
                'status' => 'none',
                'weather_code' => null,
                'has_weather' => false,
            ];
        }

        /** @var WeatherRecord|null $representative */
        $representative = $records->reduce(
            function (?WeatherRecord $selected, WeatherRecord $record): WeatherRecord {
                if ($selected === null) {
                    return $record;
                }

                $selectedStatus = self::weatherCalendarStatusFromSourceType($selected->source_type);
                $recordStatus = self::weatherCalendarStatusFromSourceType($record->source_type);
                $selectedPriority = self::weatherCalendarStatusPriority($selectedStatus);
                $recordPriority = self::weatherCalendarStatusPriority($recordStatus);

                if ($recordPriority < $selectedPriority) {
                    return $record;
                }

                if ($recordPriority > $selectedPriority) {
                    return $selected;
                }

                $selectedLocationPriority = self::weatherCalendarLocationPriority($selected);
                $recordLocationPriority = self::weatherCalendarLocationPriority($record);

                return $recordLocationPriority < $selectedLocationPriority ? $record : $selected;
            }
        );

        if (! $representative instanceof WeatherRecord) {
            return [
                'status' => 'none',
                'weather_code' => null,
                'has_weather' => false,
            ];
        }

        return [
            'status' => self::weatherCalendarStatusFromSourceType($representative->source_type),
            'weather_code' => $representative->weather_code,
            'has_weather' => true,
        ];
    }

    private static function hasFeedback(WearLog $wearLog): bool
    {
        return $wearLog->overall_rating !== null
            || $wearLog->outdoor_temperature_feel !== null
            || $wearLog->indoor_temperature_feel !== null
            || ! empty($wearLog->feedback_tags)
            || ($wearLog->feedback_memo !== null && trim($wearLog->feedback_memo) !== '');
    }

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
            'sort_order' => $wearLogItem->sort_order,
            'category' => $sourceItem?->category,
            'shape' => $sourceItem?->shape,
            'spec' => $sourceItem?->spec,
            'colors' => $colors,
        ];
    }

    public static function buildCalendarDaySummary(
        string $date,
        iterable $wearLogs,
        iterable $weatherRecords = []
    ): array {
        $entries = collect($wearLogs)->values();
        $weatherSummary = self::buildCalendarWeatherSummary($weatherRecords);

        return [
            'date' => $date,
            'plannedCount' => $entries->where('status', 'planned')->count(),
            'wornCount' => $entries->where('status', 'worn')->count(),
            'weather' => $weatherSummary,
            'has_feedback' => $entries->contains(fn (WearLog $wearLog) => self::hasFeedback($wearLog)),
            'dots' => $entries
                ->take(3)
                ->map(fn ($wearLog) => [
                    'status' => $wearLog->status,
                    'has_feedback' => self::hasFeedback($wearLog),
                ])
                ->values()
                ->all(),
            'overflowCount' => max($entries->count() - 3, 0),
        ];
    }

    public static function buildByDateListItem(WearLog $wearLog): array
    {
        $wearLog->loadMissing(['sourceOutfit', 'wearLogItems.sourceItem']);
        $wearLog->loadCount('wearLogItems');

        return [
            'id' => $wearLog->id,
            'status' => $wearLog->status,
            'event_date' => $wearLog->event_date?->format('Y-m-d'),
            'display_order' => $wearLog->display_order,
            'source_outfit_name' => $wearLog->sourceOutfit?->name,
            'items_count' => $wearLog->wear_log_items_count ?? $wearLog->wearLogItems()->count(),
            'memo' => $wearLog->memo,
            'outdoor_temperature_feel' => $wearLog->outdoor_temperature_feel,
            'indoor_temperature_feel' => $wearLog->indoor_temperature_feel,
            'overall_rating' => $wearLog->overall_rating,
            'feedback_tags' => $wearLog->feedback_tags,
            'thumbnail_items' => $wearLog->wearLogItems
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($wearLogItem) => self::buildThumbnailItem($wearLogItem))
                ->all(),
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
            'overall_rating' => $wearLog->overall_rating,
            'feedback_tags' => $wearLog->feedback_tags,
            'items_count' => $wearLog->wearLogItems->count(),
            'thumbnail_items' => $wearLog->wearLogItems
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($wearLogItem) => self::buildThumbnailItem($wearLogItem))
                ->all(),
        ];
    }

    /**
     * @param  iterable<WeatherRecord>|null  $weatherRecords
     */
    public static function buildDetail(WearLog $wearLog, ?iterable $weatherRecords = null): array
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
            'outdoor_temperature_feel' => $wearLog->outdoor_temperature_feel,
            'indoor_temperature_feel' => $wearLog->indoor_temperature_feel,
            'overall_rating' => $wearLog->overall_rating,
            'feedback_tags' => $wearLog->feedback_tags,
            'feedback_memo' => $wearLog->feedback_memo,
            'weather_records' => collect($weatherRecords ?? [])
                ->map(fn (WeatherRecord $record) => WeatherRecordPayloadBuilder::build($record))
                ->values()
                ->all(),
            'items' => $wearLog->wearLogItems
                ->sortBy('sort_order')
                ->values()
                ->map(function ($wearLogItem) {
                    return [
                        'id' => $wearLogItem->id,
                        'source_item_id' => $wearLogItem->source_item_id,
                        'item_name' => $wearLogItem->sourceItem?->name,
                        'source_item_status' => $wearLogItem->sourceItem?->status,
                        'source_item_care_status' => $wearLogItem->sourceItem?->care_status,
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
