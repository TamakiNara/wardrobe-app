<?php

namespace App\Support;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class OutfitsIndexQuery
{
    public static function build(User $user, Request $request, string $status = 'active'): array
    {
        $keyword = trim((string) $request->query('keyword', ''));
        $season = trim((string) $request->query('season', ''));
        $tpo = trim((string) $request->query('tpo', ''));
        $sort = $request->query('sort') === 'name_asc' ? 'name_asc' : 'updated_at_desc';
        $page = ListQuerySupport::normalizePage($request->query('page', 1));
        $hasItemFilter = $request->query('item_id') !== null && trim((string) $request->query('item_id')) !== '';
        $itemFilter = $hasItemFilter
            ? self::resolveItemFilter($user, $request->query('item_id'))
            : null;
        $visibleOutfitsQuery = self::buildVisibleOutfitsQuery($user, $status);
        $visibleOutfits = $visibleOutfitsQuery
            ->get(['id', 'name', 'seasons', 'tpo_ids', 'tpos']);
        $tpoNameById = UserTpoNameResolver::buildNameMap(
            $user,
            $visibleOutfits
                ->flatMap(fn (Outfit $outfit) => is_array($outfit->tpo_ids) ? $outfit->tpo_ids : [])
                ->all()
        );
        $query = self::buildFilteredOutfitsQuery(
            $user,
            $status,
            $keyword,
            $season,
            $tpo,
            $sort,
            $tpoNameById->all(),
            $hasItemFilter,
            $itemFilter?->id
        );
        $pagination = $query->paginate(ListQuerySupport::PAGE_SIZE, ['*'], 'page', $page);

        return [
            'outfits' => $pagination->getCollection()
                ->map(fn (Outfit $outfit) => OutfitPayloadBuilder::buildDetail($outfit))
                ->values()
                ->all(),
            'meta' => [
                'total' => $pagination->total(),
                'totalAll' => $visibleOutfits->count(),
                'page' => $pagination->currentPage(),
                'lastPage' => $pagination->lastPage(),
                'filters' => [
                    'item' => $itemFilter ? [
                        'id' => $itemFilter->id,
                        'name' => $itemFilter->name,
                    ] : null,
                ],
                'availableTpos' => ListQuerySupport::buildOrderedOptions(
                    $visibleOutfits->flatMap(
                        fn (Outfit $outfit) => UserTpoNameResolver::resolveNamesFromMap($tpoNameById, $outfit->tpo_ids ?? [], $outfit->tpos ?? [])
                    )->all(),
                    ['仕事', '休日', 'フォーマル'],
                ),
            ],
        ];
    }

    private static function buildVisibleOutfitsQuery(User $user, string $status): Builder
    {
        return Outfit::query()
            ->where('user_id', $user->id)
            ->where('status', $status);
    }

    private static function resolveItemFilter(User $user, mixed $itemId): ?Item
    {
        $normalizedItemId = filter_var($itemId, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1],
        ]);

        if ($normalizedItemId === false) {
            return null;
        }

        return Item::query()
            ->where('user_id', $user->id)
            ->whereKey((int) $normalizedItemId)
            ->first(['id', 'name']);
    }

    private static function buildFilteredOutfitsQuery(
        User $user,
        string $status,
        string $keyword,
        string $season,
        string $tpo,
        string $sort,
        array $tpoNameById,
        bool $hasItemFilter,
        ?int $itemFilterId
    ): Builder {
        $query = self::buildVisibleOutfitsQuery($user, $status)
            ->with(['outfitItems.item', 'user']);

        if ($hasItemFilter) {
            if ($itemFilterId === null) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereHas('outfitItems', function (Builder $builder) use ($itemFilterId) {
                    $builder->where('item_id', $itemFilterId);
                });
            }
        }

        if ($keyword !== '') {
            $query->where('name', 'like', '%'.$keyword.'%');
        }

        if ($season !== '') {
            $query->where(function (Builder $builder) use ($season) {
                $builder
                    ->whereNull('seasons')
                    ->orWhereJsonLength('seasons', 0)
                    ->orWhereJsonContains('seasons', 'オール');

                if ($season !== 'オール') {
                    $builder->orWhereJsonContains('seasons', $season);
                }
            });
        }

        if ($tpo !== '') {
            $resolvedTpoIds = collect($tpoNameById)
                ->filter(fn (string $name) => $name === $tpo)
                ->keys()
                ->map(fn (mixed $id) => (int) $id)
                ->filter(fn (int $id) => $id > 0)
                ->values();

            $query->where(function (Builder $builder) use ($resolvedTpoIds, $tpo) {
                $builder->whereJsonContains('tpos', $tpo);

                foreach ($resolvedTpoIds as $resolvedTpoId) {
                    $builder->orWhereJsonContains('tpo_ids', $resolvedTpoId);
                }
            });
        }

        if ($sort === 'name_asc') {
            return $query->orderBy('name');
        }

        return $query->latest();
    }
}
