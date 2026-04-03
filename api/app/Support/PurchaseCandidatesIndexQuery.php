<?php

namespace App\Support;

use App\Models\PurchaseCandidate;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class PurchaseCandidatesIndexQuery
{
    public static function build(User $user, Request $request): array
    {
        $keyword = trim((string) $request->query('keyword', ''));
        $status = trim((string) $request->query('status', ''));
        $priority = trim((string) $request->query('priority', ''));
        $categoryId = trim((string) $request->query('category', ''));
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
            $categoryId,
            $brand,
            $sort
        );
        $pagination = $query->paginate(ListQuerySupport::PAGE_SIZE, ['*'], 'page', $page);

        return [
            'purchaseCandidates' => $pagination->getCollection()
                ->map(fn (PurchaseCandidate $candidate) => PurchaseCandidatePayloadBuilder::buildListItem($candidate))
                ->all(),
            'availableBrands' => $availableBrands,
            'meta' => [
                'total' => $pagination->total(),
                'totalAll' => $visibleCandidatesCount,
                'page' => $pagination->currentPage(),
                'lastPage' => $pagination->lastPage(),
            ],
        ];
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
        string $categoryId,
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

        if ($categoryId !== '') {
            $query->where('category_id', $categoryId);
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
