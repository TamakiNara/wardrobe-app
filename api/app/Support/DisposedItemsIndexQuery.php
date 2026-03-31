<?php

namespace App\Support;

use App\Models\Item;
use App\Models\User;
use Illuminate\Http\Request;

class DisposedItemsIndexQuery
{
    public static function build(User $user, Request $request): array
    {
        $page = ListQuerySupport::normalizePage($request->query('page', 1));
        $pagination = Item::query()
            ->where('user_id', $user->id)
            ->where('status', 'disposed')
            ->with(['images', 'user'])
            ->latest()
            ->paginate(ListQuerySupport::PAGE_SIZE, ['*'], 'page', $page);

        return [
            'items' => $pagination->getCollection()
                ->map(fn (Item $item) => ItemPayloadBuilder::buildDetail($item))
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
}
