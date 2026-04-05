<?php

namespace App\Support;

use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class ItemsIndexQuery
{
    public static function build(User $user, Request $request): array
    {
        $keyword = trim((string) $request->query('keyword', ''));
        $brand = trim((string) $request->query('brand', ''));
        $category = trim((string) $request->query('category', ''));
        $season = trim((string) $request->query('season', ''));
        $tpo = trim((string) $request->query('tpo', ''));
        $sort = $request->query('sort') === 'name_asc' ? 'name_asc' : 'updated_at_desc';
        $page = ListQuerySupport::normalizePage($request->query('page', 1));
        $shouldReturnAll = filter_var($request->query('all', false), FILTER_VALIDATE_BOOLEAN);
        $visibleCategoryIdsRaw = $user->visible_category_ids;
        $visibleCategoryIds = is_array($visibleCategoryIdsRaw)
            ? collect($visibleCategoryIdsRaw)
            : null;
        $visibleItemsQuery = self::buildVisibleItemsQuery($user, $visibleCategoryIds);
        $visibleItems = $visibleItemsQuery
            ->get(['id', 'category', 'brand_name', 'seasons', 'tpo_ids', 'tpos']);
        $tpoNameById = UserTpoNameResolver::buildNameMap(
            $user,
            $visibleItems
                ->flatMap(fn (Item $item) => is_array($item->tpo_ids) ? $item->tpo_ids : [])
                ->all()
        );
        $query = self::buildFilteredItemsQuery(
            $user,
            $visibleCategoryIds,
            $keyword,
            $brand,
            $category,
            $season,
            $tpo,
            $sort,
            $tpoNameById->all()
        );
        $items = $shouldReturnAll
            ? $query->get()
            : $query->paginate(ListQuerySupport::PAGE_SIZE, ['*'], 'page', $page);
        $filteredItems = $shouldReturnAll ? $items : $items->getCollection();
        $filteredCount = $shouldReturnAll ? $filteredItems->count() : $items->total();

        return [
            'items' => $filteredItems
                ->map(fn (Item $item) => ItemPayloadBuilder::buildDetail($item, false))
                ->values()
                ->all(),
            'meta' => [
                'total' => $filteredCount,
                'totalAll' => $visibleItems->count(),
                'page' => $shouldReturnAll ? 1 : $items->currentPage(),
                'lastPage' => $shouldReturnAll ? 1 : $items->lastPage(),
                'availableCategories' => $visibleItems
                    ->map(
                        fn (Item $item) => ListQuerySupport::resolveCurrentItemCategoryValue(
                            is_string($item->category) ? $item->category : null,
                            is_string($item->shape) ? $item->shape : null,
                        )
                    )
                    ->filter(fn (mixed $value) => is_string($value) && $value !== '')
                    ->unique()
                    ->values()
                    ->all(),
                'availableBrands' => $visibleItems
                    ->pluck('brand_name')
                    ->map(fn (mixed $value) => is_string($value) ? trim($value) : '')
                    ->filter()
                    ->unique()
                    ->sort()
                    ->values()
                    ->all(),
                'availableSeasons' => ListQuerySupport::buildOrderedOptions(
                    $visibleItems->flatMap(fn (Item $item) => is_array($item->seasons) ? $item->seasons : [])->all(),
                    ['春', '夏', '秋', '冬', 'オール'],
                ),
                'availableTpos' => ListQuerySupport::buildOrderedOptions(
                    $visibleItems->flatMap(
                        fn (Item $item) => UserTpoNameResolver::resolveNamesFromMap($tpoNameById, $item->tpo_ids ?? [], $item->tpos ?? [])
                    )->all(),
                    ['仕事', '休日', 'フォーマル'],
                ),
            ],
        ];
    }

    private static function buildVisibleItemsQuery(User $user, ?\Illuminate\Support\Collection $visibleCategoryIds): Builder
    {
        return ListQuerySupport::applyVisibleItemFilter(
            Item::query()
                ->where('user_id', $user->id)
                ->where('status', 'active'),
            $visibleCategoryIds
        );
    }

    private static function buildFilteredItemsQuery(
        User $user,
        ?\Illuminate\Support\Collection $visibleCategoryIds,
        string $keyword,
        string $brand,
        string $category,
        string $season,
        string $tpo,
        string $sort,
        array $tpoNameById
    ): Builder {
        $query = self::buildVisibleItemsQuery($user, $visibleCategoryIds)
            ->with(['images', 'user']);

        if ($keyword !== '') {
            $query->where('name', 'like', '%'.$keyword.'%');
        }

        if ($brand !== '') {
            $query->where('brand_name', 'like', '%'.$brand.'%');
        }

        if ($category !== '') {
            $categoryFilters = ListQuerySupport::itemCategoryFilterMap($category);

            $query->where(function (Builder $builder) use ($categoryFilters) {
                foreach ($categoryFilters as $categoryFilter) {
                    $builder->orWhere(function (Builder $nested) use ($categoryFilter) {
                        $nested->where('category', $categoryFilter['category']);

                        if (isset($categoryFilter['shapes'])) {
                            $nested->whereIn('shape', $categoryFilter['shapes']);
                        }
                    });
                }
            });
        }

        if ($season !== '') {
            $query->whereJsonContains('seasons', $season);
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
