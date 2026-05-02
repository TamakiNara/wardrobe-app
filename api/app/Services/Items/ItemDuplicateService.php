<?php

namespace App\Services\Items;

use App\Models\Item;
use App\Models\ItemGroup;
use App\Models\User;
use App\Support\ItemDuplicatePayloadBuilder;
use Illuminate\Validation\ValidationException;

class ItemDuplicateService
{
    public function duplicate(User $user, int $itemId): array
    {
        $sourceItem = $this->findOwnedItem($user, $itemId);

        return ItemDuplicatePayloadBuilder::buildDuplicateDraft(
            $sourceItem,
            $this->buildDuplicateName($sourceItem->name),
        );
    }

    public function colorVariant(User $user, int $itemId): array
    {
        $sourceItem = $this->findOwnedItem($user, $itemId);

        return ItemDuplicatePayloadBuilder::buildColorVariantDraft($sourceItem);
    }

    public function resolveColorVariantGroupForCreate(User $user, ?int $sourceItemId): ?ItemGroup
    {
        if ($sourceItemId === null) {
            return null;
        }

        $sourceItem = Item::query()
            ->where('user_id', $user->id)
            ->lockForUpdate()
            ->find($sourceItemId);

        if ($sourceItem === null) {
            throw ValidationException::withMessages([
                'variant_source_item_id' => '選択した元アイテムが見つかりません。',
            ]);
        }

        if ($sourceItem->group_id === null) {
            $group = ItemGroup::query()->create([
                'user_id' => $user->id,
            ]);

            $sourceItem->forceFill([
                'group_id' => $group->id,
                'group_order' => 1,
            ])->save();

            return $group;
        }

        $group = ItemGroup::query()
            ->where('user_id', $user->id)
            ->lockForUpdate()
            ->find($sourceItem->group_id);

        if ($group === null) {
            throw ValidationException::withMessages([
                'variant_source_item_id' => '元アイテムの色違いグループが見つかりません。',
            ]);
        }

        if ($sourceItem->group_order === null) {
            $sourceItem->forceFill([
                'group_order' => $group->nextGroupOrder(),
            ])->save();
        }

        return $group;
    }

    public function findOwnedItem(User $user, int $itemId): Item
    {
        return Item::query()
            ->where('user_id', $user->id)
            ->with(['images', 'materials', 'user'])
            ->findOrFail($itemId);
    }

    private function buildDuplicateName(?string $name): string
    {
        $baseName = trim((string) ($name ?? ''));

        if ($baseName === '') {
            return 'アイテム（コピー）';
        }

        if (str_ends_with($baseName, '（コピー）')) {
            return $baseName;
        }

        return $baseName.'（コピー）';
    }
}
