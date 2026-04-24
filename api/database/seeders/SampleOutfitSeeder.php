<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use App\Models\UserTpo;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Database\Seeder;

class SampleOutfitSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedStandardUserOutfits();
        $this->seedLargeUserOutfits();
    }

    private function seedStandardUserOutfits(): void
    {
        $emptyUser = User::query()->where('email', TestSeedUsers::EMPTY_EMAIL)->firstOrFail();
        $user = User::query()->where('email', TestSeedUsers::STANDARD_EMAIL)->firstOrFail();
        $items = Item::query()->where('user_id', $user->id)->get()->keyBy('name');

        Outfit::query()->where('user_id', $emptyUser->id)->delete();
        Outfit::query()->where('user_id', $user->id)->delete();

        $definitions = [
            [
                'name' => '通勤コーデ',
                'memo' => '迷ったらこれを着る定番の通勤セット。',
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'items' => ['黒カーディガン', '白Tシャツ', 'アンクルパンツ', 'クルーソックス', 'スニーカー'],
            ],
            [
                'name' => '休日コーデ',
                'memo' => null,
                'seasons' => ['春', '夏'],
                'tpos' => ['休日', 'フォーマル'],
                'items' => ['白Tシャツ', 'ミディスカート', 'ベージュストッキング', 'トートバッグ'],
            ],
            [
                'name' => '雨の日コーデ',
                'memo' => '足元とバッグを合わせて動きやすさ重視。',
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事', '休日'],
                'items' => ['黒カーディガン', 'アンクルパンツ', 'アンクルソックス', 'スニーカー', 'トートバッグ'],
            ],
            [
                'name' => 'きれいめ通勤コーデ',
                'memo' => 'シャツとローファーで少しきれいめに寄せた仕事用セット。',
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'items' => ['ブルーシャツ', 'ひざ丈スカート', 'ベージュストッキング', 'ローファー', 'シルバーネックレス'],
            ],
            [
                'name' => '気温差コーデ',
                'memo' => '朝晩の気温差確認用。クリーニング中アイテムの導線確認にも使う。',
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
                'items' => ['ベージュトレンチコート', 'アイボリーニット', 'フルレングスパンツ', 'ブラックタイツ', 'スニーカー'],
            ],
            [
                'name' => 'ワンピース重ねコーデ',
                'memo' => 'トップスの上にワンピースを重ねる順序確認用。',
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'items' => ['白Tシャツ', 'ネイビーワンピース', 'ベージュストッキング', 'ローファー'],
            ],
            [
                'name' => 'ワンピースパンツ重ねコーデ',
                'memo' => 'ワンピースの下にパンツを重ねる許容ケース確認用。',
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
                'items' => ['ネイビーワンピース', 'アンクルパンツ', 'ベージュストッキング', 'ローファー'],
            ],
            [
                'name' => 'トップス下ワンピースパンツコーデ',
                'memo' => 'トップスの上にワンピースとパンツを重ねる順序確認用。',
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
                'items' => ['白Tシャツ', 'ネイビーワンピース', 'アンクルパンツ', 'ベージュストッキング', 'ローファー'],
            ],
            [
                'name' => 'トップス上ワンピースパンツコーデ',
                'memo' => 'ワンピースの上にトップスとパンツを重ねる順序確認用。',
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
                'items' => ['ネイビーワンピース', 'アイボリーニット', 'アンクルパンツ', 'ベージュストッキング', 'ローファー'],
            ],
            [
                'name' => 'オールインワン羽織りコーデ',
                'memo' => 'オールインワンの上にトップスを重ねる順序確認用。',
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
                'items' => ['ブラックオールインワン', 'アイボリーニット', 'クルーソックス', 'スニーカー'],
            ],
            [
                'status' => 'invalid',
                'name' => '旧オールインワン羽織りコーデ',
                'memo' => '手放し済みトップスを含む無効コーデ確認用。',
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
                'items' => ['ブラックオールインワン', 'グレーパーカー', 'クルーソックス', 'スニーカー'],
            ],
            [
                'status' => 'invalid',
                'name' => '旧通勤コーデ',
                'memo' => '候補外データ確認用に残している過去のセット。',
                'seasons' => ['秋', '冬'],
                'tpos' => ['仕事'],
                'items' => ['グレーパーカー', 'アンクルパンツ', 'クルーソックス', 'スニーカー'],
            ],
        ];

        foreach ($definitions as $definition) {
            $outfit = Outfit::query()->create([
                'user_id' => $user->id,
                'status' => $definition['status'] ?? 'active',
                'name' => $definition['name'],
                'memo' => $definition['memo'],
                'seasons' => $definition['seasons'],
                'tpos' => $definition['tpos'],
                'tpo_ids' => $this->resolveTpoIds($user, $definition['tpos']),
            ]);

            foreach ($definition['items'] as $index => $itemName) {
                $item = $items->get($itemName);
                if ($item === null) {
                    continue;
                }

                $outfit->outfitItems()->create([
                    'item_id' => $item->id,
                    'sort_order' => $index + 1,
                ]);
            }
        }
    }

    private function seedLargeUserOutfits(): void
    {
        $user = User::query()->where('email', TestSeedUsers::LARGE_EMAIL)->firstOrFail();
        $items = Item::query()->where('user_id', $user->id)->get();

        Outfit::query()->where('user_id', $user->id)->delete();

        if ($items->count() < 3) {
            return;
        }

        $outfits = Outfit::factory()
            ->count(12)
            ->create([
                'user_id' => $user->id,
            ]);

        $userTpos = UserTpo::query()
            ->where('user_id', $user->id)
            ->pluck('id', 'name');

        $outfits->each(function (Outfit $outfit) use ($userTpos) {
            $outfit->forceFill([
                'tpo_ids' => collect($outfit->tpos ?? [])
                    ->map(fn ($name) => $userTpos->get($name))
                    ->filter()
                    ->values()
                    ->all(),
            ])->save();
        });

        foreach ($outfits as $outfit) {
            $selectedItems = $items->shuffle()->take(random_int(3, 5))->values();

            foreach ($selectedItems as $index => $item) {
                $outfit->outfitItems()->create([
                    'item_id' => $item->id,
                    'sort_order' => $index + 1,
                ]);
            }
        }
    }

    private function resolveTpoIds(User $user, array $names): array
    {
        $tpoIds = UserTpo::query()
            ->where('user_id', $user->id)
            ->whereIn('name', $names)
            ->pluck('id', 'name');

        return collect($names)
            ->map(fn ($name) => $tpoIds->get($name))
            ->filter()
            ->values()
            ->all();
    }
}
