<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\ItemImage;
use App\Models\User;
use App\Models\UserTpo;
use App\Support\ItemSpecNormalizer;
use App\Support\ItemSubcategorySupport;
use App\Support\ListQuerySupport;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

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
                        'sleeve' => 'short',
                        'length' => 'normal',
                        'neck' => 'crew',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
                'images' => [
                    ['file' => 'sample-shape-ivory-square.png', 'is_primary' => true],
                    ['file' => 'sample-shape-navy-portrait.png'],
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
                'size_gender' => 'women',
                'size_label' => 'M',
                'size_note' => '肩周りは標準、首回りはやや細め',
                'size_details' => [
                    'structured' => [
                        'shoulder_width' => 39,
                        'body_width' => 49,
                        'body_length' => 68,
                        'sleeve_length' => 58,
                        'neck_circumference' => 38,
                    ],
                    'custom_fields' => [
                        ['label' => '裄丈', 'value' => 77, 'sort_order' => 1],
                    ],
                ],
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'blue', 'hex' => '#0077D9', 'label' => 'ブルー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'spec' => [
                    'tops' => [
                        'sleeve' => 'long',
                        'length' => 'normal',
                        'neck' => 'crew',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
                'images' => [
                    ['file' => 'sample-shape-blue-landscape.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => 'アイボリーニット',
                'brand_name' => 'BEAMS',
                'category' => 'tops',
                'shape' => 'knit',
                'sheerness' => 'slight',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'ivory', 'hex' => '#F2EEE4', 'label' => 'アイボリー'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['仕事', '休日'],
                'spec' => [
                    'tops' => [
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
                'name' => 'ミニスカート',
                'category' => 'bottoms',
                'shape' => 'mini-skirt',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#8A9099', 'label' => 'グレー'],
                ],
                'seasons' => ['春', '夏'],
                'tpos' => ['休日'],
                'spec' => [
                    'bottoms' => [
                        'length_type' => 'mini',
                    ],
                ],
            ],
            [
                'name' => 'ひざ丈スカート',
                'category' => 'bottoms',
                'shape' => 'tight-skirt',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'navy', 'hex' => '#44516A', 'label' => 'ネイビー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'spec' => [
                    'bottoms' => [
                        'length_type' => 'knee',
                    ],
                ],
            ],
            [
                'name' => 'ミディスカート',
                'category' => 'bottoms',
                'shape' => 'flare-skirt',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'beige', 'hex' => '#CBB79D', 'label' => 'ベージュ'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['休日', 'フォーマル'],
                'spec' => [
                    'bottoms' => [
                        'length_type' => 'midi',
                    ],
                ],
            ],
            [
                'name' => 'アンクルパンツ',
                'category' => 'bottoms',
                'shape' => 'tapered',
                'size_gender' => 'women',
                'size_label' => 'M',
                'size_note' => 'ウエストはちょうどよく、足首はすっきり',
                'size_details' => [
                    'structured' => [
                        'waist' => 68,
                        'hip' => 94,
                        'rise' => 31,
                        'inseam' => 64,
                        'hem_width' => 16.5,
                        'thigh_width' => 29,
                    ],
                    'custom_fields' => [
                        ['label' => '総丈', 'value' => 92, 'sort_order' => 1],
                    ],
                ],
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#262626', 'label' => 'ブラック'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事', '休日'],
                'spec' => [
                    'bottoms' => [
                        'length_type' => 'ankle',
                    ],
                ],
            ],
            [
                'name' => 'フルレングスパンツ',
                'category' => 'bottoms',
                'shape' => 'wide',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'brown', 'hex' => '#7C6556', 'label' => 'ブラウン'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['仕事', '休日'],
                'spec' => [
                    'bottoms' => [
                        'length_type' => 'full',
                    ],
                ],
            ],
            [
                'name' => 'アンクルソックス',
                'category' => 'legwear',
                'shape' => 'socks',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'white', 'hex' => '#ECECEC', 'label' => 'ホワイト'],
                ],
                'seasons' => ['春', '夏', '秋'],
                'tpos' => ['休日'],
                'spec' => [
                    'legwear' => [
                        'coverage_type' => 'ankle_socks',
                    ],
                ],
            ],
            [
                'name' => 'クルーソックス',
                'category' => 'legwear',
                'shape' => 'socks',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#A4ACB6', 'label' => 'グレー'],
                ],
                'seasons' => ['春', '秋', '冬'],
                'tpos' => ['仕事', '休日'],
                'spec' => [
                    'legwear' => [
                        'coverage_type' => 'crew_socks',
                    ],
                ],
            ],
            [
                'name' => 'ひざ下ソックス',
                'category' => 'legwear',
                'shape' => 'socks',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'navy', 'hex' => '#485B78', 'label' => 'ネイビー'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['仕事'],
                'spec' => [
                    'legwear' => [
                        'coverage_type' => 'knee_socks',
                    ],
                ],
            ],
            [
                'name' => 'オーバーニーソックス',
                'category' => 'legwear',
                'shape' => 'socks',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#2B2B2B', 'label' => 'ブラック'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['休日'],
                'spec' => [
                    'legwear' => [
                        'coverage_type' => 'over_knee',
                    ],
                ],
            ],
            [
                'name' => 'ベージュストッキング',
                'category' => 'legwear',
                'shape' => 'stockings',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'beige', 'hex' => '#D8B89F', 'label' => 'ベージュ'],
                ],
                'seasons' => ['春', '夏', '秋', '冬'],
                'tpos' => ['仕事', 'フォーマル'],
                'spec' => [
                    'legwear' => [
                        'coverage_type' => 'stockings',
                    ],
                ],
            ],
            [
                'name' => 'ブラックタイツ',
                'category' => 'legwear',
                'shape' => 'tights',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#1F1F1F', 'label' => 'ブラック'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['仕事', '休日', 'フォーマル'],
                'spec' => [
                    'legwear' => [
                        'coverage_type' => 'tights',
                    ],
                ],
            ],
            [
                'name' => 'クロップドレギンス',
                'category' => 'legwear',
                'shape' => 'leggings',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#8E97A3', 'label' => 'グレー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
                'spec' => [
                    'legwear' => [
                        'coverage_type' => 'leggings_cropped',
                    ],
                ],
            ],
            [
                'name' => 'フルレングスレギンス',
                'category' => 'legwear',
                'shape' => 'leggings',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#30343A', 'label' => 'ブラック'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['休日'],
                'spec' => [
                    'legwear' => [
                        'coverage_type' => 'leggings_full',
                    ],
                ],
            ],
            [
                'name' => 'シームレスブラ',
                'brand_name' => 'PEACH JOHN',
                'category' => 'underwear',
                'shape' => 'bra',
                'size_gender' => 'women',
                'size_label' => 'M',
                'size_note' => '締め付けが少なく普段使いしやすい',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'beige', 'hex' => '#D8B89F', 'label' => 'ベージュ'],
                ],
                'seasons' => ['オール'],
                'tpos' => [],
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
                'name' => 'ネイビーワンピース',
                'brand_name' => 'NATURAL BEAUTY BASIC',
                'category' => 'onepiece_allinone',
                'shape' => 'onepiece',
                'sheerness' => 'high',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'navy', 'hex' => '#44516A', 'label' => 'ネイビー'],
                    ['role' => 'sub', 'mode' => 'preset', 'value' => 'beige', 'hex' => '#D8CBB4', 'label' => 'ベージュ'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事', '休日'],
                'spec' => null,
            ],
            [
                'name' => 'ブラックオールインワン',
                'brand_name' => 'GLOBAL WORK',
                'category' => 'onepiece_allinone',
                'shape' => 'allinone',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#2B2B2B', 'label' => 'ブラック'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
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
                'name' => '素材確認_本体のみ',
                'brand_name' => '確認用',
                'category' => 'tops',
                'shape' => 'tshirt',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'white', 'hex' => '#ECECEC', 'label' => 'ホワイト'],
                ],
                'seasons' => ['春', '夏'],
                'tpos' => ['休日'],
                'spec' => [
                    'tops' => [
                        'sleeve' => 'short',
                        'length' => 'normal',
                        'neck' => 'crew',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
                'materials' => [
                    ['part_label' => '本体', 'material_name' => '綿', 'ratio' => 80],
                    ['part_label' => '本体', 'material_name' => 'ポリエステル', 'ratio' => 20],
                ],
            ],
            [
                'name' => '素材確認_裏地あり',
                'brand_name' => '確認用',
                'category' => 'outer',
                'shape' => 'trench',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'beige', 'hex' => '#D3C0A4', 'label' => 'ベージュ'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'spec' => null,
                'materials' => [
                    ['part_label' => '本体', 'material_name' => '綿', 'ratio' => 80],
                    ['part_label' => '本体', 'material_name' => 'ポリエステル', 'ratio' => 20],
                    ['part_label' => '裏地', 'material_name' => 'ポリエステル', 'ratio' => 100],
                ],
            ],
            [
                'name' => '素材確認_自由入力区分',
                'brand_name' => '確認用',
                'category' => 'tops',
                'shape' => 'shirt',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'blue', 'hex' => '#0077D9', 'label' => 'ブルー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
                'spec' => [
                    'tops' => [
                        'sleeve' => 'long',
                        'length' => 'normal',
                        'neck' => 'crew',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
                'materials' => [
                    ['part_label' => '袖口', 'material_name' => '綿', 'ratio' => 50],
                    ['part_label' => '袖口', 'material_name' => 'ポリエステル', 'ratio' => 50],
                ],
            ],
            [
                'name' => '素材確認_自由入力素材',
                'brand_name' => '確認用',
                'category' => 'tops',
                'shape' => 'knit',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'ivory', 'hex' => '#F2EEE4', 'label' => 'アイボリー'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['仕事', '休日'],
                'spec' => [
                    'tops' => [
                        'sleeve' => 'long',
                        'length' => 'normal',
                        'neck' => 'crew',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
                'materials' => [
                    ['part_label' => '本体', 'material_name' => 'モダール', 'ratio' => 60],
                    ['part_label' => '本体', 'material_name' => '綿', 'ratio' => 40],
                ],
            ],
            [
                'name' => '素材確認_複合',
                'brand_name' => '確認用',
                'category' => 'onepiece_allinone',
                'shape' => 'onepiece',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'navy', 'hex' => '#44516A', 'label' => 'ネイビー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事', '休日'],
                'spec' => null,
                'materials' => [
                    ['part_label' => '本体', 'material_name' => 'レーヨン', 'ratio' => 70],
                    ['part_label' => '本体', 'material_name' => 'ナイロン', 'ratio' => 30],
                    ['part_label' => '別布', 'material_name' => 'モダール', 'ratio' => 50],
                    ['part_label' => '別布', 'material_name' => '綿', 'ratio' => 50],
                ],
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
                'images' => [
                    ['file' => 'sample-shape-brown-landscape.png', 'is_primary' => true],
                    ['file' => 'sample-shape-gray-padding.png'],
                ],
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
            $normalizedItem = $this->normalizeSeedItemDefinition($item);

            $itemRecord = Item::query()->updateOrCreate(
                ['user_id' => $user->id, 'name' => $normalizedItem['name']],
                [
                    ...collect($normalizedItem)->except('materials', 'images')->all(),
                    'tpo_ids' => $this->resolveTpoIds($user, $normalizedItem['tpos'] ?? []),
                ],
            );

            $this->syncMaterials($itemRecord, $normalizedItem['materials'] ?? []);
            $this->syncImages($itemRecord, $normalizedItem['images'] ?? []);
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

        $imageSets = [
            [
                ['file' => 'sample-shape-navy-portrait.png', 'is_primary' => true],
                ['file' => 'sample-shape-ivory-square.png'],
            ],
            [
                ['file' => 'sample-shape-brown-landscape.png', 'is_primary' => true],
            ],
            [
                ['file' => 'sample-shape-gray-padding.png', 'is_primary' => true],
                ['file' => 'sample-shape-blue-landscape.png'],
            ],
        ];

        Item::query()
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->take(count($imageSets))
            ->get()
            ->values()
            ->each(function (Item $item, int $index) use ($imageSets) {
                $this->syncImages($item, $imageSets[$index]);
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

    private function normalizeSeedItemDefinition(array $item): array
    {
        $originalCategory = is_string($item['category'] ?? null) ? $item['category'] : null;
        $originalShape = is_string($item['shape'] ?? null) ? trim($item['shape']) : null;
        $category = ListQuerySupport::resolveCurrentItemCategoryValue($originalCategory, $originalShape);

        if ($category === null) {
            throw new \RuntimeException('Unable to resolve current sample item category.');
        }

        $shape = $this->resolveCurrentShapeValue($originalCategory, $category, $originalShape);
        $subcategory = ItemSubcategorySupport::normalize($category, $item['subcategory'] ?? null)
            ?? ItemSubcategorySupport::inferFromShape($category, $shape);
        $spec = ItemSpecNormalizer::normalize($category, $shape, $item['spec'] ?? null, $subcategory);

        return [
            ...$item,
            'category' => $category,
            'subcategory' => $subcategory,
            'shape' => $shape,
            'spec' => $this->fillMissingSeedSpec($category, $shape, $originalShape, $spec),
        ];
    }

    private function resolveCurrentShapeValue(?string $originalCategory, string $category, ?string $shape): ?string
    {
        if ($shape === null || $shape === '') {
            return null;
        }

        if ($originalCategory === 'bottoms') {
            return match ($shape) {
                'tapered' => 'tapered',
                'wide' => 'wide',
                'straight' => 'straight',
                'mini-skirt' => 'skirt',
                'tight-skirt' => 'tight',
                'a-line-skirt' => 'a_line',
                'flare-skirt' => 'flare',
                default => $shape,
            };
        }

        if ($category === 'pants') {
            return match ($shape) {
                'pants', 'denim', 'slacks', 'short-pants', 'other' => 'pants',
                'tapered' => 'tapered',
                'wide' => 'wide',
                'straight' => 'straight',
                'culottes' => 'culottes',
                default => $shape,
            };
        }

        if ($category === 'skirts') {
            return match ($shape) {
                'skirt', 'other' => 'skirt',
                'tight' => 'tight',
                'flare' => 'flare',
                'a_line' => 'a_line',
                'mermaid' => 'mermaid',
                default => $shape,
            };
        }

        if ($originalCategory === 'outer') {
            return match ($shape) {
                'down' => 'down-padded',
                'outer-cardigan' => 'blouson',
                default => $shape,
            };
        }

        if ($originalCategory === 'accessories') {
            return match ($shape) {
                'accessory' => 'other',
                default => $shape,
            };
        }

        return $shape;
    }

    private function fillMissingSeedSpec(
        string $category,
        ?string $shape,
        ?string $originalShape,
        ?array $spec,
    ): ?array {
        $normalized = $spec ?? [];

        if ($category === 'pants' && data_get($normalized, 'bottoms.length_type') === null) {
            data_set(
                $normalized,
                'bottoms.length_type',
                $shape === 'tapered' ? 'ankle' : 'full',
            );
        }

        if ($category === 'skirts' && data_get($normalized, 'skirt.length_type') === null) {
            $lengthType = match ($originalShape) {
                'mini-skirt' => 'mini',
                'tight-skirt' => 'knee',
                'flare-skirt', 'a-line-skirt' => 'midi',
                default => match ($shape) {
                    'tight' => 'knee',
                    'flare', 'a_line', 'skirt' => 'midi',
                    'mermaid' => 'long',
                    default => null,
                },
            };

            if ($lengthType !== null) {
                data_set($normalized, 'skirt.length_type', $lengthType);
            }
        }

        return $normalized === [] ? null : $normalized;
    }

    private function syncMaterials(Item $item, array $materials): void
    {
        $item->materials()->delete();

        if ($materials === []) {
            return;
        }

        $item->materials()->createMany($materials);
    }

    private function syncImages(Item $item, array $images): void
    {
        $item->images()->delete();

        foreach ($images as $index => $image) {
            $filename = $image['file'];
            $sourcePath = database_path('seeders/assets/sample-images/'.$filename);
            $targetPath = 'seed/items/'.$item->user_id.'/'.md5($item->name).'/'.$filename;
            if (! is_file($sourcePath)) {
                throw new \RuntimeException('Sample image asset not found: '.$filename);
            }

            $contents = file_get_contents($sourcePath);

            Storage::disk('public')->put($targetPath, $contents);

            ItemImage::query()->create([
                'item_id' => $item->id,
                'disk' => 'public',
                'path' => $targetPath,
                'original_filename' => $filename,
                'mime_type' => 'image/png',
                'file_size' => strlen($contents),
                'sort_order' => $index + 1,
                'is_primary' => (bool) ($image['is_primary'] ?? $index === 0),
            ]);
        }
    }
}
