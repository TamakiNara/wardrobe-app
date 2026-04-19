<?php

namespace App\Support;

use App\Models\PurchaseCandidate;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class PurchaseCandidatesIndexQuery
{
    public static function build(User $user, Request $request): array
    {
        $keyword = trim((string) $request->query('keyword', ''));
        $status = trim((string) $request->query('status', ''));
        $priority = trim((string) $request->query('priority', ''));
        $category = trim((string) $request->query('category', ''));
        $subcategory = trim((string) $request->query('subcategory', ''));
        $brand = trim((string) $request->query('brand', ''));
        $sort = $request->query('sort') === 'name_asc' ? 'name_asc' : 'updated_at_desc';
        $page = ListQuerySupport::normalizePage($request->query('page', 1));
        $visibleCandidatesQuery = self::buildVisibleCandidatesQuery($user);
        $visibleCandidatesCount = (clone $visibleCandidatesQuery)->count();
        $availableBrands = (clone $visibleCandidatesQuery)
            ->whereNotNull('brand_name')
            ->where('brand_name', '!=', '')
            ->distinct()
            ->orderBy('brand_name')
            ->pluck('brand_name')
            ->map(fn (?string $brandName) => trim((string) $brandName))
            ->filter(fn (string $brandName) => $brandName !== '')
            ->values()
            ->all();
        $query = self::buildFilteredCandidatesQuery(
            $user,
            $keyword,
            $status,
            $priority,
            $category,
            $subcategory,
            $brand,
            $sort
        );
        $pagination = ListQuerySupport::paginate(
            self::buildListEntries($query->get(), $sort),
            $page,
            ListQuerySupport::PAGE_SIZE
        );

        return [
            'purchaseCandidateEntries' => $pagination['items']
                ->map(fn (array $entry) => self::buildListEntryPayload($entry))
                ->all(),
            'availableBrands' => $availableBrands,
            'meta' => [
                'total' => $pagination['total'],
                'totalAll' => $visibleCandidatesCount,
                'per_page' => ListQuerySupport::PAGE_SIZE,
                'current_page' => $pagination['page'],
                'page' => $pagination['page'],
                'lastPage' => $pagination['lastPage'],
            ],
        ];
    }

    /**
     * @param  Collection<int, PurchaseCandidate>  $candidates
     * @return Collection<int, array{type:string, representative:PurchaseCandidate, candidates:Collection<int, PurchaseCandidate>}>
     */
    private static function buildListEntries(Collection $candidates, string $sort): Collection
    {
        $entries = collect();

        $candidates
            ->filter(fn (PurchaseCandidate $candidate) => $candidate->group_id === null)
            ->each(function (PurchaseCandidate $candidate) use ($entries) {
                $entries->push([
                    'type' => 'single',
                    'representative' => $candidate,
                    'candidates' => collect([$candidate]),
                ]);
            });

        $candidates
            ->filter(fn (PurchaseCandidate $candidate) => $candidate->group_id !== null)
            ->groupBy('group_id')
            ->each(function (Collection $groupCandidates, int|string $groupId) use ($entries) {
                $orderedCandidates = self::sortGroupCandidates($groupCandidates);

                $entries->push([
                    'type' => 'group',
                    'group_id' => (int) $groupId,
                    'representative' => $orderedCandidates->first(),
                    'candidates' => $orderedCandidates,
                ]);
            });

        return self::sortListEntries($entries, $sort)->values();
    }

    /**
     * @param  Collection<int, PurchaseCandidate>  $candidates
     * @return Collection<int, PurchaseCandidate>
     */
    private static function sortGroupCandidates(Collection $candidates): Collection
    {
        return $candidates
            ->sort(function (PurchaseCandidate $left, PurchaseCandidate $right) {
                $leftOrder = $left->group_order ?? PHP_INT_MAX;
                $rightOrder = $right->group_order ?? PHP_INT_MAX;

                if ($leftOrder !== $rightOrder) {
                    return $leftOrder <=> $rightOrder;
                }

                return $left->id <=> $right->id;
            })
            ->values();
    }

    /**
     * @param  Collection<int, array{type:string, representative:PurchaseCandidate, candidates:Collection<int, PurchaseCandidate>}>  $entries
     * @return Collection<int, array{type:string, representative:PurchaseCandidate, candidates:Collection<int, PurchaseCandidate>}>
     */
    private static function sortListEntries(Collection $entries, string $sort): Collection
    {
        return $entries
            ->sort(function (array $left, array $right) use ($sort) {
                /** @var PurchaseCandidate $leftRepresentative */
                $leftRepresentative = $left['representative'];
                /** @var PurchaseCandidate $rightRepresentative */
                $rightRepresentative = $right['representative'];

                if ($sort === 'name_asc') {
                    $nameComparison = strnatcasecmp(
                        (string) $leftRepresentative->name,
                        (string) $rightRepresentative->name
                    );

                    if ($nameComparison !== 0) {
                        return $nameComparison;
                    }

                    return $leftRepresentative->id <=> $rightRepresentative->id;
                }

                $leftTimestamp = $leftRepresentative->created_at?->getTimestamp() ?? 0;
                $rightTimestamp = $rightRepresentative->created_at?->getTimestamp() ?? 0;

                if ($leftTimestamp !== $rightTimestamp) {
                    return $rightTimestamp <=> $leftTimestamp;
                }

                return $rightRepresentative->id <=> $leftRepresentative->id;
            })
            ->values();
    }

    /**
     * @param  array{type:string, group_id?:int, candidates:Collection<int, PurchaseCandidate>}  $entry
     */
    private static function buildListEntryPayload(array $entry): array
    {
        if ($entry['type'] === 'group') {
            $candidates = $entry['candidates']
                ->map(fn (PurchaseCandidate $candidate) => PurchaseCandidatePayloadBuilder::buildListItem($candidate))
                ->values()
                ->all();

            return [
                'type' => 'group',
                'group_id' => $entry['group_id'] ?? null,
                'representative_candidate_id' => $candidates[0]['id'] ?? null,
                'candidates' => $candidates,
            ];
        }

        /** @var PurchaseCandidate $candidate */
        $candidate = $entry['candidates']->first();

        return [
            'type' => 'single',
            'candidate' => PurchaseCandidatePayloadBuilder::buildListItem($candidate),
        ];
    }

    /**
     * @return string[]
     */
    private static function resolveCategoryIdsForFilter(string $category, string $subcategory): array
    {
        if ($subcategory !== '') {
            $visibleCategoryId = ItemSubcategorySupport::visibleCategoryIdFor($category, $subcategory);

            return $visibleCategoryId === null ? [] : [$visibleCategoryId];
        }

        $visibleCategoryIdMap = ItemSubcategorySupport::visibleCategoryIdMap();

        if (array_key_exists($category, $visibleCategoryIdMap)) {
            return array_values($visibleCategoryIdMap[$category]);
        }

        return str_contains($category, '_') ? [$category] : [];
    }

    private static function buildVisibleCandidatesQuery(User $user): Builder
    {
        return PurchaseCandidate::query()
            ->where('user_id', $user->id);
    }

    private static function buildFilteredCandidatesQuery(
        User $user,
        string $keyword,
        string $status,
        string $priority,
        string $category,
        string $subcategory,
        string $brand,
        string $sort
    ): Builder {
        $query = self::buildVisibleCandidatesQuery($user)
            ->with(['category', 'images', 'colors']);

        if ($keyword !== '') {
            $query->where(function (Builder $builder) use ($keyword) {
                $builder
                    ->where('name', 'like', '%'.$keyword.'%')
                    ->orWhere('brand_name', 'like', '%'.$keyword.'%')
                    ->orWhere('wanted_reason', 'like', '%'.$keyword.'%')
                    ->orWhere('memo', 'like', '%'.$keyword.'%');
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($priority !== '') {
            $query->where('priority', $priority);
        }

        if ($category !== '') {
            $categoryIds = self::resolveCategoryIdsForFilter($category, $subcategory);

            if ($categoryIds === []) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('category_id', $categoryIds);
            }
        }

        if ($brand !== '') {
            $query->where('brand_name', 'like', '%'.$brand.'%');
        }

        if ($sort === 'name_asc') {
            return $query->orderBy('name');
        }

        return $query->latest();
    }
}
