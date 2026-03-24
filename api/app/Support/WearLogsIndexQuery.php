<?php

namespace App\Support;

use App\Models\WearLog;
use App\Models\User;
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

        $wearLogs = WearLog::query()
            ->where('user_id', $user->id)
            ->with(['sourceOutfit', 'wearLogItems.sourceItem'])
            ->get();

        $filteredWearLogs = $wearLogs
            ->filter(function (WearLog $wearLog) use ($keyword, $status, $dateFrom, $dateTo) {
                $normalizedKeyword = mb_strtolower($keyword, 'UTF-8');
                $sourceOutfitName = mb_strtolower((string) ($wearLog->sourceOutfit?->name ?? ''), 'UTF-8');
                $memo = mb_strtolower((string) ($wearLog->memo ?? ''), 'UTF-8');
                $itemNames = $wearLog->wearLogItems
                    ->map(fn ($wearLogItem) => mb_strtolower((string) ($wearLogItem->sourceItem?->name ?? ''), 'UTF-8'))
                    ->filter()
                    ->implode(' ');
                $eventDate = $wearLog->event_date?->format('Y-m-d');

                $matchKeyword = $normalizedKeyword === ''
                    || str_contains($sourceOutfitName, $normalizedKeyword)
                    || str_contains($memo, $normalizedKeyword)
                    || str_contains($itemNames, $normalizedKeyword);
                $matchStatus = $status === '' || $wearLog->status === $status;
                $matchDateFrom = $dateFrom === '' || ($eventDate !== null && $eventDate >= $dateFrom);
                $matchDateTo = $dateTo === '' || ($eventDate !== null && $eventDate <= $dateTo);

                return $matchKeyword && $matchStatus && $matchDateFrom && $matchDateTo;
            })
            ->values();

        $sortedWearLogs = $sort === 'date_asc'
            ? $filteredWearLogs
                ->sort(function (WearLog $left, WearLog $right) {
                    return [$left->event_date?->format('Y-m-d'), $left->display_order]
                        <=> [$right->event_date?->format('Y-m-d'), $right->display_order];
                })
                ->values()
            : $filteredWearLogs
                ->sort(function (WearLog $left, WearLog $right) {
                    return [$right->event_date?->format('Y-m-d'), $left->display_order]
                        <=> [$left->event_date?->format('Y-m-d'), $right->display_order];
                })
                ->values();

        $pagination = ListQuerySupport::paginate($sortedWearLogs, $page);

        return [
            'wearLogs' => $pagination['items']
                ->map(fn (WearLog $wearLog) => WearLogPayloadBuilder::buildListItem($wearLog))
                ->all(),
            'meta' => [
                'total' => $pagination['total'],
                'totalAll' => $wearLogs->count(),
                'page' => $pagination['page'],
                'lastPage' => $pagination['lastPage'],
            ],
        ];
    }
}
