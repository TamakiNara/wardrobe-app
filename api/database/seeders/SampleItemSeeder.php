<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\User;
use App\Models\UserTpo;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Database\Seeder;

class SampleItemSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedStandardUserItems();
        $this->seedLargeUserItems();
    }

    private function seedStandardUserItems(): void
    {
        $user = User::query()->where('email', TestSeedUsers::STANDARD_EMAIL)->firstOrFail();

        Item::query()->where('user_id', $user->id)->delete();

        $items = [
            [
                'name' => '白Tシャツ',
                'brand_name' => 'UNIQLO',
                'category' => 'tops',
                'shape' => 'tshirt',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'white', 'hex' => '#ECECEC', 'label' => 'ホワイト'],
                ],
                'seasons' => ['春', '夏'],
                'tpos' => ['休日'],
                'spec' => [
                    'tops' => [
                        'shape' => 'tshirt',
                        'sleeve' => 'short',
                        'length' => 'normal',
                        'neck' => 'crew',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
            ],
            [
                'name' => '黒カーディガン',
                'brand_name' => 'GU',
                'category' => 'tops',
                'shape' => 'cardigan',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#1F1F1F', 'label' => 'ブラック'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事', '休日'],
                'spec' => [
                    'tops' => [
                        'shape' => 'cardigan',
                        'sleeve' => 'long',
                        'length' => 'normal',
                        'neck' => 'v',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
            ],
            [
                'name' => 'ブルーシャツ',
                'brand_name' => 'GLOBAL WORK',
                'category' => 'tops',
                'shape' => 'shirt',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'blue', 'hex' => '#0077D9', 'label' => 'ブルー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'spec' => [
                    'tops' => [
                        'shape' => 'shirt',
                        'sleeve' => 'long',
                        'length' => 'normal',
                        'neck' => 'crew',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
            ],
            [
                'name' => 'アイボリーニット',
                'brand_name' => 'BEAMS',
                'category' => 'tops',
                'shape' => 'knit',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'ivory', 'hex' => '#F2EEE4', 'label' => 'アイボリー'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['仕事', '休日'],
                'spec' => [
                    'tops' => [
                        'shape' => 'knit',
                        'sleeve' => 'long',
                        'length' => 'normal',
                        'neck' => 'crew',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
            ],
            [
                'name' => 'デニムパンツ',
                'brand_name' => '無印良品',
                'category' => 'bottoms',
                'shape' => 'straight',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'navy', 'hex' => '#2F4058', 'label' => 'ネイビー'],
                ],
                'seasons' => ['春', '秋', '冬'],
                'tpos' => ['仕事', '休日'],
                'spec' => null,
            ],
            [
                'name' => '黒スカート',
                'category' => 'bottoms',
                'shape' => 'a-line-skirt',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#1F1F1F', 'label' => 'ブラック'],
                ],
                'seasons' => ['春', '夏', '秋'],
                'tpos' => ['休日', 'フォーマル'],
                'spec' => null,
            ],
            [
                'name' => 'ベージュトレンチコート',
                'brand_name' => 'UNITED ARROWS',
                'category' => 'outer',
                'shape' => 'trench',
                'care_status' => 'in_cleaning',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'beige', 'hex' => '#D3C0A4', 'label' => 'ベージュ'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事', '休日'],
                'spec' => null,
            ],
            [
                'name' => 'スニーカー',
                'brand_name' => 'ABC-MART',
                'category' => 'shoes',
                'shape' => 'sneakers',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'white', 'hex' => '#ECECEC', 'label' => 'ホワイト'],
                    ['role' => 'sub', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#9AA0A6', 'label' => 'グレー'],
                ],
                'seasons' => ['春', '夏', '秋'],
                'tpos' => ['仕事', '休日'],
                'spec' => null,
            ],
            [
                'name' => 'ローファー',
                'brand_name' => 'ABC-MART',
                'category' => 'shoes',
                'shape' => 'pumps',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#1F1F1F', 'label' => 'ブラック'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事', 'フォーマル'],
                'spec' => null,
            ],
            [
                'name' => 'トートバッグ',
                'brand_name' => 'ZARA',
                'category' => 'accessories',
                'shape' => 'tote',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'beige', 'hex' => '#D3C0A4', 'label' => 'ベージュ'],
                ],
                'seasons' => ['春', '夏', '秋', '冬'],
                'tpos' => ['仕事', '休日', 'フォーマル'],
                'spec' => null,
            ],
            [
                'name' => 'シルバーネックレス',
                'category' => 'accessories',
                'shape' => 'accessory',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#B8BDC7', 'label' => 'シルバー'],
                ],
                'seasons' => ['春', '夏', '秋', '冬'],
                'tpos' => ['休日', 'フォーマル'],
                'spec' => null,
            ],
            [
                'status' => 'disposed',
                'name' => 'グレーパーカー',
                'category' => 'tops',
                'shape' => 'cardigan',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#9AA0A6', 'label' => 'グレー'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['休日'],
                'spec' => [
                    'tops' => [
                        'shape' => 'cardigan',
                        'sleeve' => 'long',
                        'length' => 'normal',
                        'neck' => 'crew',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
            ],
        ];

        foreach ($items as $item) {
            Item::query()->updateOrCreate(
                ['user_id' => $user->id, 'name' => $item['name']],
                [
                    ...$item,
                    'tpo_ids' => $this->resolveTpoIds($user, $item['tpos'] ?? []),
                ],
            );
        }
    }

    private function seedLargeUserItems(): void
    {
        $emptyUser = User::query()->where('email', TestSeedUsers::EMPTY_EMAIL)->firstOrFail();
        $user = User::query()->where('email', TestSeedUsers::LARGE_EMAIL)->firstOrFail();

        Item::query()->where('user_id', $emptyUser->id)->delete();
        Item::query()->where('user_id', $user->id)->delete();

        Item::factory()
            ->count(36)
            ->create([
                'user_id' => $user->id,
            ]);

        $userTpos = UserTpo::query()
            ->where('user_id', $user->id)
            ->pluck('id', 'name');

        Item::query()
            ->where('user_id', $user->id)
            ->each(function (Item $item) use ($userTpos) {
                $item->forceFill([
                    'tpo_ids' => collect($item->tpos ?? [])
                        ->map(fn ($name) => $userTpos->get($name))
                        ->filter()
                        ->values()
                        ->all(),
                ])->save();
            });
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
