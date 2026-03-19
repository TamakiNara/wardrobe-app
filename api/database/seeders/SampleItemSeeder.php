<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\User;
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
                'category' => 'tops',
                'shape' => 'cardigan',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#1F1F1F', 'label' => 'ブラック'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['通勤', '休日'],
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
                'name' => 'デニムパンツ',
                'category' => 'bottoms',
                'shape' => 'straight',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'navy', 'hex' => '#2F4058', 'label' => 'ネイビー'],
                ],
                'seasons' => ['春', '秋', '冬'],
                'tpos' => ['通勤', '休日'],
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
                'tpos' => ['休日', 'お出かけ'],
                'spec' => null,
            ],
            [
                'name' => 'スニーカー',
                'category' => 'shoes',
                'shape' => 'sneakers',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'white', 'hex' => '#ECECEC', 'label' => 'ホワイト'],
                    ['role' => 'sub', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#9AA0A6', 'label' => 'グレー'],
                ],
                'seasons' => ['春', '夏', '秋'],
                'tpos' => ['通勤', '休日'],
                'spec' => null,
            ],
            [
                'name' => 'トートバッグ',
                'category' => 'accessories',
                'shape' => 'tote',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'beige', 'hex' => '#D3C0A4', 'label' => 'ベージュ'],
                ],
                'seasons' => ['春', '夏', '秋', '冬'],
                'tpos' => ['通勤', '休日', 'お出かけ'],
                'spec' => null,
            ],
        ];

        foreach ($items as $item) {
            Item::query()->updateOrCreate(
                ['user_id' => $user->id, 'name' => $item['name']],
                $item,
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
    }
}
