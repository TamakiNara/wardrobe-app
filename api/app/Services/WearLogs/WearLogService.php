<?php

namespace App\Services\WearLogs;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use App\Models\WearLog;
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
            ]);

            $this->syncWearLogItems($wearLog, $validated['items'] ?? []);

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
            ]);

            $wearLog->wearLogItems()->delete();
            $this->syncWearLogItems($wearLog, $validated['items'] ?? []);

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
}
