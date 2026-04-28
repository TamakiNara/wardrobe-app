<?php

namespace App\Support;

use App\Models\Item;
use App\Models\User;
use Illuminate\Http\Request;

class DisposedItemsIndexQuery
{
    private const STORAGE_UNDERWEAR = 'underwear';

    public static function build(User $user, Request $request): array
    {
        $page = ListQuerySupport::normalizePage($request->query('page', 1));
        $storage = self::normalizeStorage($request->query('storage'));
        $pagination = self::applyUnderwearStorageFilter(
            Item::query()
                ->where('user_id', $user->id)
                ->where('status', 'disposed')
                ->with(['images', 'user']),
            $storage,
        )
            ->latest()
            ->paginate(ListQuerySupport::PAGE_SIZE, ['*'], 'page', $page);

        return [
            'items' => $pagination->getCollection()
                ->map(fn (Item $item) => ItemPayloadBuilder::buildDetail($item, false))
                ->values()
                ->all(),
            'meta' => [
                'total' => $pagination->total(),
                'totalAll' => $pagination->total(),
                'page' => $pagination->currentPage(),
                'lastPage' => $pagination->lastPage(),
            ],
        ];
    }

    private static function normalizeStorage(mixed $storage): ?string
    {
        return is_string($storage) && trim($storage) === self::STORAGE_UNDERWEAR
            ? self::STORAGE_UNDERWEAR
            : null;
    }

    private static function applyUnderwearStorageFilter(
        \Illuminate\Database\Eloquent\Builder $query,
        ?string $storage,
    ): \Illuminate\Database\Eloquent\Builder {
        return $query->where(function (\Illuminate\Database\Eloquent\Builder $builder) use ($storage) {
            if ($storage === self::STORAGE_UNDERWEAR) {
                $builder
                    ->where('category', 'underwear')
                    ->orWhere(function (\Illuminate\Database\Eloquent\Builder $legacy) {
                        $legacy
                            ->where('category', 'inner')
                            ->where(function (\Illuminate\Database\Eloquent\Builder $inner) {
                                $inner
                                    ->where('subcategory', 'underwear')
                                    ->orWhere('shape', 'underwear');
                            });
                    });

                return;
            }

            $builder
                ->where('category', '!=', 'underwear')
                ->where(function (\Illuminate\Database\Eloquent\Builder $legacy) {
                    $legacy
                        ->where('category', '!=', 'inner')
                        ->orWhere(function (\Illuminate\Database\Eloquent\Builder $inner) {
                            $inner
                                ->where(function (\Illuminate\Database\Eloquent\Builder $notLegacyUnderwear) {
                                    $notLegacyUnderwear
                                        ->whereNull('subcategory')
                                        ->orWhere('subcategory', '!=', 'underwear');
                                })
                                ->where(function (\Illuminate\Database\Eloquent\Builder $notLegacyShape) {
                                    $notLegacyShape
                                        ->whereNull('shape')
                                        ->orWhere('shape', '!=', 'underwear');
                                });
                        });
                });
        });
    }
}
