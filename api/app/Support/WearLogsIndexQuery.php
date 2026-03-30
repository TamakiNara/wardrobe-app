<?php

namespace App\Support;

use App\Models\User;
use App\Models\WearLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class WearLogsIndexQuery
{
    public static function build(User $user, Request $request): array
    {
        $keyword = trim((string) $request->query('keyword', ''));
        $status = trim((string) $request->query('status', ''));
        $sort = $request->query('sort') === 'date_asc' ? 'date_asc' : 'date_desc';
        $dateFrom = trim((string) $request->query('date_from', ''));
        $dateTo = trim((string) $request->query('date_to', ''));
        $page = ListQuerySupport::normalizePage($request->query('page', 1));
        $visibleWearLogsQuery = self::buildVisibleWearLogsQuery($user);
        $visibleWearLogsCount = (clone $visibleWearLogsQuery)->count();
        $query = self::buildFilteredWearLogsQuery(
            $user,
            $keyword,
            $status,
            $dateFrom,
            $dateTo,
            $sort
        );
        $pagination = $query->paginate(ListQuerySupport::PAGE_SIZE, ['*'], 'page', $page);

        return [
            'wearLogs' => $pagination->getCollection()
                ->map(fn (WearLog $wearLog) => WearLogPayloadBuilder::buildListItem($wearLog))
                ->all(),
            'meta' => [
                'total' => $pagination->total(),
                'totalAll' => $visibleWearLogsCount,
                'page' => $pagination->currentPage(),
                'lastPage' => $pagination->lastPage(),
            ],
        ];
    }

    private static function buildVisibleWearLogsQuery(User $user): Builder
    {
        return WearLog::query()
            ->where('user_id', $user->id);
    }

    private static function buildFilteredWearLogsQuery(
        User $user,
        string $keyword,
        string $status,
        string $dateFrom,
        string $dateTo,
        string $sort
    ): Builder {
        $query = self::buildVisibleWearLogsQuery($user)
            ->with(['sourceOutfit', 'wearLogItems.sourceItem']);

        if ($keyword !== '') {
            $query->where(function (Builder $builder) use ($keyword) {
                $builder
                    ->where('memo', 'like', '%'.$keyword.'%')
                    ->orWhereHas('sourceOutfit', function (Builder $sourceOutfitQuery) use ($keyword) {
                        $sourceOutfitQuery->where('name', 'like', '%'.$keyword.'%');
                    })
                    ->orWhereHas('wearLogItems.sourceItem', function (Builder $itemQuery) use ($keyword) {
                        $itemQuery->where('name', 'like', '%'.$keyword.'%');
                    });
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($dateFrom !== '') {
            $query->whereDate('event_date', '>=', $dateFrom);
        }

        if ($dateTo !== '') {
            $query->whereDate('event_date', '<=', $dateTo);
        }

        if ($sort === 'date_asc') {
            return $query
                ->orderBy('event_date')
                ->orderBy('display_order');
        }

        return $query
            ->orderByDesc('event_date')
            ->orderBy('display_order');
    }
}
