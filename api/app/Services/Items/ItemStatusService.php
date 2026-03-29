<?php

namespace App\Services\Items;

use App\Models\Item;
use App\Models\User;
use App\Services\Outfits\OutfitStatusService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ItemStatusService
{
    public function __construct(
        private readonly OutfitStatusService $outfitStatusService,
    ) {}

    public function dispose(User $user, int $itemId): Item
    {
        $item = $this->findOwnedItem($user, $itemId);

        if (($item->status ?? 'active') === 'disposed') {
            throw ValidationException::withMessages([
                'status' => 'すでに手放したアイテムです。',
            ]);
        }

        return DB::transaction(function () use ($item) {
            $item->forceFill([
                'status' => 'disposed',
            ])->save();

            $this->outfitStatusService->invalidateActiveOutfitsContainingItem($item);

            // TODO: item_disposed / outfit_invalidated の event log を記録する
            return $item->fresh();
        });
    }

    public function reactivate(User $user, int $itemId): Item
    {
        $item = $this->findOwnedItem($user, $itemId);

        if (($item->status ?? 'active') === 'active') {
            throw ValidationException::withMessages([
                'status' => 'すでに所持品です。',
            ]);
        }

        return DB::transaction(function () use ($item) {
            $item->forceFill([
                'status' => 'active',
            ])->save();

            // TODO: item_reactivated の event log を記録する
            // TODO: 関連 outfit の restore は自動で行わない
            return $item->fresh();
        });
    }

    private function findOwnedItem(User $user, int $itemId): Item
    {
        return Item::query()
            ->where('user_id', $user->id)
            ->findOrFail($itemId);
    }
}
