<?php

namespace App\Support;

use App\Models\Item;
use App\Models\User;
use Illuminate\Http\Request;

class ItemsIndexQuery
{
    public static function build(User $user, Request $request): array
    {
        $keyword = trim((string) $request->query('keyword', ''));
        $category = trim((string) $request->query('category', ''));
        $season = trim((string) $request->query('season', ''));
        $tpo = trim((string) $request->query('tpo', ''));
        $sort = $request->query('sort') === 'name_asc' ? 'name_asc' : 'updated_at_desc';
        $page = ListQuerySupport::normalizePage($request->query('page', 1));
        $visibleCategoryIdsRaw = $user->visible_category_ids;
        $visibleCategoryIds = is_array($visibleCategoryIdsRaw)
            ? collect($visibleCategoryIdsRaw)
            : null;

        $visibleItems = Item::query()
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->filter(fn (Item $item) => ListQuerySupport::isItemVisibleForList($item, $visibleCategoryIds))
            ->values();

        $filteredItems = $visibleItems
            ->filter(function (Item $item) use ($keyword, $category, $season, $tpo) {
                $name = mb_strtolower((string) ($item->name ?? ''), 'UTF-8');
                $normalizedKeyword = mb_strtolower($keyword, 'UTF-8');
                $seasons = is_array($item->seasons) ? $item->seasons : [];
                $tpos = is_array($item->tpos) ? $item->tpos : [];

                $matchKeyword = $normalizedKeyword === '' || str_contains($name, $normalizedKeyword);
                $matchCategory = $category === '' || $item->category === $category;
                $matchSeason = $season === '' || in_array($season, $seasons, true);
                $matchTpo = $tpo === '' || in_array($tpo, $tpos, true);

                return $matchKeyword && $matchCategory && $matchSeason && $matchTpo;
            })
            ->values();

        if ($sort === 'name_asc') {
            $filteredItems = $filteredItems
                ->sortBy(fn (Item $item) => mb_strtolower((string) ($item->name ?? ''), 'UTF-8'))
                ->values();
        }

        $pagination = ListQuerySupport::paginate($filteredItems, $page);

        return [
            'items' => $pagination['items'],
            'meta' => [
                'total' => $pagination['total'],
                'totalAll' => $visibleItems->count(),
                'page' => $pagination['page'],
                'lastPage' => $pagination['lastPage'],
                'availableCategories' => $visibleItems
                    ->pluck('category')
                    ->filter(fn (mixed $value) => is_string($value) && $value !== '')
                    ->unique()
                    ->values()
                    ->all(),
                'availableSeasons' => ListQuerySupport::buildOrderedOptions(
                    $visibleItems->flatMap(fn (Item $item) => is_array($item->seasons) ? $item->seasons : [])->all(),
                    ['春', '夏', '秋', '冬', 'オール'],
                ),
                'availableTpos' => ListQuerySupport::buildOrderedOptions(
                    $visibleItems->flatMap(fn (Item $item) => is_array($item->tpos) ? $item->tpos : [])->all(),
                    ['仕事', '休日', 'フォーマル'],
                ),
            ],
        ];
    }
}
