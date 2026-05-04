<?php

namespace App\Services\WearLogs;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use App\Models\WearLog;
use App\Models\WeatherRecord;
use App\Support\WearLogFeedbackSupport;
use App\Support\WearLogPayloadBuilder;
use App\Support\WeatherRecordPayloadBuilder;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WearLogService
{
    public function store(User $user, array $validated): WearLog
    {
        $this->validatePayload($user, $validated, null);

        return DB::transaction(function () use ($user, $validated) {
            $wearLog = WearLog::query()->create([
                'user_id' => $user->id,
                'status' => $validated['status'],
                'event_date' => $validated['event_date'],
                'display_order' => $validated['display_order'],
                'source_outfit_id' => $validated['source_outfit_id'] ?? null,
                'memo' => $validated['memo'] ?? null,
                'outdoor_temperature_feel' => $validated['outdoor_temperature_feel'] ?? null,
                'indoor_temperature_feel' => $validated['indoor_temperature_feel'] ?? null,
                'overall_rating' => $validated['overall_rating'] ?? null,
                'feedback_tags' => WearLogFeedbackSupport::normalizeFeedbackTags($validated['feedback_tags'] ?? null),
                'feedback_memo' => $validated['feedback_memo'] ?? null,
            ]);

            $this->syncWearLogItems(
                $wearLog,
                $this->resolveWearLogItemsPayload(
                    $validated['items'] ?? [],
                    $validated['source_outfit_id'] ?? null
                )
            );

            return $wearLog->fresh()->load(['sourceOutfit', 'wearLogItems.sourceItem']);
        });
    }

    public function update(User $user, int $wearLogId, array $validated): WearLog
    {
        $wearLog = $this->findOwnedWearLog($user, $wearLogId);
        $this->validatePayload($user, $validated, $wearLog);

        return DB::transaction(function () use ($wearLog, $validated) {
            $wearLog->update([
                'status' => $validated['status'],
                'event_date' => $validated['event_date'],
                'display_order' => $validated['display_order'],
                'source_outfit_id' => $validated['source_outfit_id'] ?? null,
                'memo' => $validated['memo'] ?? null,
                'outdoor_temperature_feel' => $validated['outdoor_temperature_feel'] ?? null,
                'indoor_temperature_feel' => $validated['indoor_temperature_feel'] ?? null,
                'overall_rating' => $validated['overall_rating'] ?? null,
                'feedback_tags' => WearLogFeedbackSupport::normalizeFeedbackTags($validated['feedback_tags'] ?? null),
                'feedback_memo' => $validated['feedback_memo'] ?? null,
            ]);

            $wearLog->wearLogItems()->delete();
            $this->syncWearLogItems(
                $wearLog,
                $this->resolveWearLogItemsPayload(
                    $validated['items'] ?? [],
                    $validated['source_outfit_id'] ?? null
                )
            );

            return $wearLog->fresh()->load(['sourceOutfit', 'wearLogItems.sourceItem']);
        });
    }

    public function findOwnedWearLog(User $user, int $wearLogId): WearLog
    {
        return WearLog::query()
            ->where('user_id', $user->id)
            ->with(['sourceOutfit', 'wearLogItems.sourceItem'])
            ->findOrFail($wearLogId);
    }

    public function buildCalendarMonthSummary(User $user, string $month): array
    {
        $startOfMonth = CarbonImmutable::createFromFormat('Y-m', $month)->startOfMonth();
        $endOfMonth = $startOfMonth->endOfMonth();

        $wearLogs = WearLog::query()
            ->where('user_id', $user->id)
            ->whereBetween('event_date', [$startOfMonth->format('Y-m-d'), $endOfMonth->format('Y-m-d')])
            ->orderBy('event_date')
            ->orderBy('display_order')
            ->get([
                'id',
                'status',
                'event_date',
                'display_order',
                'outdoor_temperature_feel',
                'indoor_temperature_feel',
                'overall_rating',
                'feedback_tags',
                'feedback_memo',
            ]);

        $weatherRecords = WeatherRecord::query()
            ->where('user_id', $user->id)
            ->whereBetween('weather_date', [$startOfMonth->format('Y-m-d'), $endOfMonth->format('Y-m-d')])
            ->with(['location:id,is_default,display_order'])
            ->orderBy('weather_date')
            ->orderBy('id')
            ->get([
                'id',
                'weather_date',
                'location_id',
                'weather_code',
                'source_type',
            ]);

        $wearLogsByDate = $wearLogs
            ->groupBy(fn (WearLog $wearLog) => $wearLog->event_date?->format('Y-m-d'));
        $weatherRecordsByDate = $weatherRecords
            ->groupBy(fn (WeatherRecord $record) => $record->weather_date?->format('Y-m-d'));
        $dates = $wearLogsByDate
            ->keys()
            ->merge($weatherRecordsByDate->keys())
            ->filter(fn ($date) => is_string($date) && $date !== '')
            ->unique()
            ->sort()
            ->values();

        return [
            'month' => $startOfMonth->format('Y-m'),
            'days' => $dates
                ->map(fn (string $date) => WearLogPayloadBuilder::buildCalendarDaySummary(
                    $date,
                    $wearLogsByDate->get($date, collect()),
                    $weatherRecordsByDate->get($date, collect())
                ))
                ->values()
                ->all(),
        ];
    }

    public function buildByDateResponse(User $user, string $eventDate): array
    {
        $wearLogs = WearLog::query()
            ->where('user_id', $user->id)
            ->whereDate('event_date', $eventDate)
            ->with('sourceOutfit')
            ->withCount('wearLogItems')
            ->orderBy('display_order')
            ->get();

        $weatherRecords = $this->getWeatherRecordsByDate($user, $eventDate);

        return [
            'event_date' => $eventDate,
            'wearLogs' => $wearLogs
                ->map(fn (WearLog $wearLog) => WearLogPayloadBuilder::buildByDateListItem($wearLog))
                ->all(),
            'weatherRecords' => $weatherRecords
                ->map(fn (WeatherRecord $record) => WeatherRecordPayloadBuilder::build($record))
                ->all(),
        ];
    }

    public function delete(User $user, int $wearLogId): void
    {
        $wearLog = $this->findOwnedWearLog($user, $wearLogId);

        DB::transaction(function () use ($wearLog) {
            $wearLog->delete();
        });
    }

    private function validatePayload(User $user, array $validated, ?WearLog $wearLog): void
    {
        $items = collect($validated['items'] ?? [])
            ->values();

        if (($validated['source_outfit_id'] ?? null) === null && $items->isEmpty()) {
            throw ValidationException::withMessages([
                'source_outfit_id' => 'コーディネートまたはアイテムを1件以上指定してください。',
            ]);
        }

        $this->validateSourceOutfit($user, $validated['source_outfit_id'] ?? null, $wearLog);
        $this->validateItems($user, $items, $wearLog);
        $this->validateDisplayOrder($user, $validated['event_date'], (int) $validated['display_order'], $wearLog);
    }

    private function validateSourceOutfit(User $user, ?int $sourceOutfitId, ?WearLog $wearLog): void
    {
        if ($sourceOutfitId === null) {
            return;
        }

        $query = Outfit::query()
            ->where('user_id', $user->id)
            ->where('id', $sourceOutfitId);

        if ($wearLog !== null && $wearLog->source_outfit_id === $sourceOutfitId) {
            $outfit = $query->first();
        } else {
            $outfit = $query->where('status', 'active')->first();
        }

        if ($outfit === null) {
            throw ValidationException::withMessages([
                'source_outfit_id' => '使用できないコーディネートは選択できません。',
            ]);
        }
    }

    private function validateItems(User $user, Collection $items, ?WearLog $wearLog): void
    {
        $sortOrders = $items
            ->pluck('sort_order')
            ->filter(fn ($value) => is_int($value))
            ->values();

        if ($sortOrders->count() !== $sortOrders->unique()->count()) {
            throw ValidationException::withMessages([
                'items' => '同じ表示順を重複して登録することはできません。',
            ]);
        }

        if ($sortOrders->isNotEmpty()) {
            $expectedSortOrders = range(1, $sortOrders->count());
            $actualSortOrders = $sortOrders
                ->sort()
                ->values()
                ->all();

            if ($actualSortOrders !== $expectedSortOrders) {
                throw ValidationException::withMessages([
                    'items' => '表示順は 1 からの連番で指定してください。',
                ]);
            }
        }

        $itemIds = $items
            ->pluck('source_item_id')
            ->filter(fn ($value) => is_int($value))
            ->values();

        if ($itemIds->count() !== $itemIds->unique()->count()) {
            throw ValidationException::withMessages([
                'items' => '同じアイテムを重複して登録することはできません。',
            ]);
        }

        if ($itemIds->isEmpty()) {
            return;
        }

        $existingItemIds = $wearLog?->wearLogItems
            ->pluck('source_item_id')
            ->filter(fn ($value) => is_int($value))
            ->values()
            ->all() ?? [];

        $ownedItems = Item::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $itemIds)
            ->get()
            ->keyBy('id');

        foreach ($itemIds as $itemId) {
            $item = $ownedItems->get($itemId);
            $isExistingItem = in_array($itemId, $existingItemIds, true);

            if ($item === null) {
                throw ValidationException::withMessages([
                    'items' => '選択したアイテムに不正なデータが含まれています。',
                ]);
            }

            if (($item->status ?? 'active') !== 'active' && ! $isExistingItem) {
                throw ValidationException::withMessages([
                    'items' => '手放したアイテムは選択できません。',
                ]);
            }
        }
    }

    private function validateDisplayOrder(User $user, string $eventDate, int $displayOrder, ?WearLog $wearLog): void
    {
        $query = WearLog::query()
            ->where('user_id', $user->id)
            ->whereDate('event_date', $eventDate)
            ->where('display_order', $displayOrder);

        if ($wearLog !== null) {
            $query->where('id', '!=', $wearLog->id);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'display_order' => '同じ日の表示順が重複しています。',
            ]);
        }
    }

    private function syncWearLogItems(WearLog $wearLog, array $items): void
    {
        if ($items === []) {
            return;
        }

        $wearLog->wearLogItems()->createMany(
            collect($items)->map(function (array $item) {
                return [
                    'source_item_id' => $item['source_item_id'],
                    'item_source_type' => $item['item_source_type'],
                    'sort_order' => $item['sort_order'],
                ];
            })->all()
        );
    }

    private function resolveWearLogItemsPayload(array $items, ?int $sourceOutfitId): array
    {
        if ($items !== [] || $sourceOutfitId === null) {
            return $items;
        }

        $sourceOutfit = Outfit::query()
            ->with('outfitItems.item')
            ->findOrFail($sourceOutfitId);

        return $sourceOutfit->outfitItems
            ->map(function ($outfitItem) {
                return [
                    'source_item_id' => $outfitItem->item_id,
                    'item_source_type' => 'outfit',
                    'sort_order' => $outfitItem->sort_order,
                ];
            })
            ->values()
            ->all();
    }

    public function getWeatherRecordsByDate(User $user, string $eventDate): Collection
    {
        return WeatherRecord::query()
            ->where('user_id', $user->id)
            ->whereDate('weather_date', $eventDate)
            ->with('location')
            ->get()
            ->sortBy(
                fn (WeatherRecord $record) => sprintf(
                    '%010d-%010d',
                    $record->location?->display_order ?? PHP_INT_MAX,
                    $record->id,
                )
            )
            ->values();
    }
}
