<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
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
                'items' => ['黒カーディガン', '白Tシャツ', 'デニムパンツ', 'スニーカー'],
            ],
            [
                'name' => '休日コーデ',
                'memo' => null,
                'seasons' => ['春', '夏'],
                'tpos' => ['休日', 'フォーマル'],
                'items' => ['白Tシャツ', '黒スカート', 'トートバッグ'],
            ],
            [
                'name' => '雨の日コーデ',
                'memo' => '足元とバッグを合わせて動きやすさ重視。',
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事', '休日'],
                'items' => ['黒カーディガン', 'デニムパンツ', 'スニーカー', 'トートバッグ'],
            ],
            [
                'name' => 'きれいめ通勤コーデ',
                'memo' => 'シャツとローファーで少しきれいめに寄せた仕事用セット。',
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'items' => ['ブルーシャツ', '黒スカート', 'ローファー', 'シルバーネックレス'],
            ],
            [
                'name' => '気温差コーデ',
                'memo' => '朝晩の気温差確認用。クリーニング中アイテムの導線確認にも使う。',
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
                'items' => ['ベージュトレンチコート', 'アイボリーニット', 'デニムパンツ', 'スニーカー'],
            ],
            [
                'status' => 'invalid',
                'name' => '旧通勤コーデ',
                'memo' => '候補外データ確認用に残している過去のセット。',
                'seasons' => ['秋', '冬'],
                'tpos' => ['仕事'],
                'items' => ['グレーパーカー', 'デニムパンツ', 'スニーカー'],
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
            ]);

            foreach ($definition['items'] as $index => $itemName) {
                $item = $items->get($itemName);
                if ($item === null) {
                    continue;
                }

                $outfit->outfitItems()->create([
                    'item_id' => $item->id,
                    'sort_order' => $index,
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

        foreach ($outfits as $outfit) {
            $selectedItems = $items->shuffle()->take(random_int(3, 5))->values();

            foreach ($selectedItems as $index => $item) {
                $outfit->outfitItems()->create([
                    'item_id' => $item->id,
                    'sort_order' => $index,
                ]);
            }
        }
    }
}
