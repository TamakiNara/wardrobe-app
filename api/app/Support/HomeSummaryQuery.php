<?php

namespace App\Support;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\PurchaseCandidate;
use App\Models\User;
use App\Models\WearLog;

class HomeSummaryQuery
{
    public static function build(User $user): array
    {
        return [
            'summary' => [
                'itemsCount' => self::countVisibleActiveItems($user),
                'outfitsCount' => Outfit::query()
                    ->where('user_id', $user->id)
                    ->where('status', 'active')
                    ->count(),
                'wearLogsCount' => WearLog::query()
                    ->where('user_id', $user->id)
                    ->count(),
                'purchaseCandidatesCount' => PurchaseCandidate::query()
                    ->where('user_id', $user->id)
                    ->count(),
            ],
        ];
    }

    private static function countVisibleActiveItems(User $user): int
    {
        $visibleCategoryIdsRaw = $user->visible_category_ids;
        $visibleCategoryIds = is_array($visibleCategoryIdsRaw)
            ? collect($visibleCategoryIdsRaw)->values()
            : null;

        $query = Item::query()
            ->where('user_id', $user->id)
            ->where('status', 'active');

        if ($visibleCategoryIds === null) {
            return $query->count();
        }

        return ListQuerySupport::applyVisibleItemFilter($query, $visibleCategoryIds)->count();
    }
}
