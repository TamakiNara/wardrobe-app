<?php

namespace App\Support;

use App\Models\PurchaseCandidate;
use App\Models\User;
use Illuminate\Http\Request;

class PurchaseCandidatesIndexQuery
{
    public static function build(User $user, Request $request): array
    {
        $keyword = trim((string) $request->query('keyword', ''));
        $status = trim((string) $request->query('status', ''));
        $priority = trim((string) $request->query('priority', ''));
        $categoryId = trim((string) $request->query('category', ''));
        $sort = $request->query('sort') === 'name_asc' ? 'name_asc' : 'updated_at_desc';
        $page = ListQuerySupport::normalizePage($request->query('page', 1));

        $candidates = PurchaseCandidate::query()
            ->where('user_id', $user->id)
            ->with(['category', 'images'])
            ->get();

        $filtered = $candidates
            ->filter(function (PurchaseCandidate $candidate) use ($keyword, $status, $priority, $categoryId) {
                $normalizedKeyword = mb_strtolower($keyword, 'UTF-8');
                $name = mb_strtolower((string) $candidate->name, 'UTF-8');
                $brandName = mb_strtolower((string) ($candidate->brand_name ?? ''), 'UTF-8');
                $wantedReason = mb_strtolower((string) ($candidate->wanted_reason ?? ''), 'UTF-8');
                $memo = mb_strtolower((string) ($candidate->memo ?? ''), 'UTF-8');

                $matchKeyword = $normalizedKeyword === ''
                    || str_contains($name, $normalizedKeyword)
                    || str_contains($brandName, $normalizedKeyword)
                    || str_contains($wantedReason, $normalizedKeyword)
                    || str_contains($memo, $normalizedKeyword);
                $matchStatus = $status === '' || $candidate->status === $status;
                $matchPriority = $priority === '' || $candidate->priority === $priority;
                $matchCategory = $categoryId === '' || $candidate->category_id === $categoryId;

                return $matchKeyword && $matchStatus && $matchPriority && $matchCategory;
            })
            ->values();

        if ($sort === 'name_asc') {
            $filtered = $filtered
                ->sortBy(fn (PurchaseCandidate $candidate) => mb_strtolower($candidate->name, 'UTF-8'))
                ->values();
        } else {
            $filtered = $filtered
                ->sortByDesc(fn (PurchaseCandidate $candidate) => $candidate->updated_at?->timestamp ?? 0)
                ->values();
        }

        $pagination = ListQuerySupport::paginate($filtered, $page);

        return [
            'purchaseCandidates' => $pagination['items']
                ->map(fn (PurchaseCandidate $candidate) => PurchaseCandidatePayloadBuilder::buildListItem($candidate))
                ->all(),
            'meta' => [
                'total' => $pagination['total'],
                'totalAll' => $candidates->count(),
                'page' => $pagination['page'],
                'lastPage' => $pagination['lastPage'],
            ],
        ];
    }
}
