<?php

namespace App\Support;

use App\Models\Outfit;
use App\Models\User;
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

        $outfits = Outfit::query()
            ->where('user_id', $user->id)
            ->where('status', $status)
            ->with(['outfitItems.item', 'user'])
            ->latest()
            ->get();
        $tpoNameById = UserTpoNameResolver::buildNameMap(
            $user,
            $outfits
                ->flatMap(fn (Outfit $outfit) => is_array($outfit->tpo_ids) ? $outfit->tpo_ids : [])
                ->all()
        );

        $filteredOutfits = $outfits
            ->filter(function (Outfit $outfit) use ($keyword, $season, $tpo, $tpoNameById) {
                $name = mb_strtolower((string) ($outfit->name ?? ''), 'UTF-8');
                $normalizedKeyword = mb_strtolower($keyword, 'UTF-8');
                $seasons = is_array($outfit->seasons) ? $outfit->seasons : [];
                $tpos = UserTpoNameResolver::resolveNamesFromMap($tpoNameById, $outfit->tpo_ids ?? [], $outfit->tpos ?? []);
                $isAllSeason = $seasons === [] || in_array('オール', $seasons, true);

                $matchKeyword = $normalizedKeyword === '' || str_contains($name, $normalizedKeyword);
                $matchSeason = $season === ''
                    || ($season === 'オール' ? $isAllSeason : in_array($season, $seasons, true) || $isAllSeason);
                $matchTpo = $tpo === '' || in_array($tpo, $tpos, true);

                return $matchKeyword && $matchSeason && $matchTpo;
            })
            ->values();

        if ($sort === 'name_asc') {
            $filteredOutfits = $filteredOutfits
                ->sortBy(fn (Outfit $outfit) => mb_strtolower((string) ($outfit->name ?? ''), 'UTF-8'))
                ->values();
        }

        $pagination = ListQuerySupport::paginate($filteredOutfits, $page);

        return [
            'outfits' => $pagination['items']
                ->map(fn (Outfit $outfit) => OutfitPayloadBuilder::buildDetail($outfit))
                ->values()
                ->all(),
            'meta' => [
                'total' => $pagination['total'],
                'totalAll' => $outfits->count(),
                'page' => $pagination['page'],
                'lastPage' => $pagination['lastPage'],
                'availableTpos' => ListQuerySupport::buildOrderedOptions(
                    $outfits->flatMap(
                        fn (Outfit $outfit) => UserTpoNameResolver::resolveNamesFromMap($tpoNameById, $outfit->tpo_ids ?? [], $outfit->tpos ?? [])
                    )->all(),
                    ['仕事', '休日', 'フォーマル'],
                ),
            ],
        ];
    }
}
