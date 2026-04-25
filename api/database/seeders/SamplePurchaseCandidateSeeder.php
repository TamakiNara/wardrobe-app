<?php

namespace Database\Seeders;

use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateColor;
use App\Models\PurchaseCandidateGroup;
use App\Models\PurchaseCandidateImage;
use App\Models\PurchaseCandidateSeason;
use App\Models\PurchaseCandidateTpo;
use App\Models\User;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class SamplePurchaseCandidateSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedStandardUserCandidates();
        $this->seedLargeUserCandidates();
    }

    private function seedStandardUserCandidates(): void
    {
        $user = User::query()->where('email', TestSeedUsers::STANDARD_EMAIL)->firstOrFail();

        PurchaseCandidate::query()->where('user_id', $user->id)->delete();
        PurchaseCandidateGroup::query()->where('user_id', $user->id)->delete();

        $candidates = [
            [
                'name' => 'Tシャツ候補',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'tops_tshirt_cutsew',
                'brand_name' => 'UNIQLO',
                'price' => 1990,
                'wanted_reason' => '夏の買い足し用',
                'size_gender' => 'women',
                'size_label' => 'M',
                'size_note' => '普段Mだが少しゆったりめ',
                'size_details' => [
                    'structured' => [
                        'shoulder_width' => 45,
                        'body_width' => 52,
                        'body_length' => 69,
                        'sleeve_length' => 22,
                    ],
                    'custom_fields' => [
                        ['label' => '裄丈', 'value' => 46, 'sort_order' => 1],
                    ],
                ],
                'is_rain_ok' => false,
                'sheerness' => 'slight',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'white', 'hex' => '#ECECEC', 'label' => 'ホワイト'],
                ],
                'seasons' => ['春', '夏'],
                'tpos' => ['休日'],
            ],
            [
                'name' => 'パンツ候補',
                'status' => 'considering',
                'priority' => 'high',
                'category_id' => 'pants_pants',
                'brand_name' => 'GLOBAL WORK',
                'price' => 5990,
                'wanted_reason' => '通勤用の入れ替え候補',
                'size_gender' => 'women',
                'size_label' => 'M',
                'size_note' => '腰回りは少し細め',
                'size_details' => [
                    'structured' => [
                        'waist' => 68,
                        'hip' => 96,
                        'rise' => 31,
                        'inseam' => 67,
                        'hem_width' => 17,
                        'thigh_width' => 30,
                    ],
                ],
                'is_rain_ok' => true,
                'sheerness' => 'high',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#262626', 'label' => 'ブラック'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
            ],
            [
                'name' => 'トレンチコート候補',
                'status' => 'on_hold',
                'priority' => 'low',
                'category_id' => 'outerwear_coat',
                'brand_name' => 'UNITED ARROWS',
                'price' => 19800,
                'wanted_reason' => '春先の羽織り候補',
                'size_gender' => 'women',
                'size_label' => 'FREE',
                'size_note' => '厚手インナー込みで確認中',
                'size_details' => [
                    'custom_fields' => [
                        ['label' => '裄丈', 'value' => 79, 'sort_order' => 1],
                        ['label' => '袖口幅', 'value' => 14, 'sort_order' => 2],
                    ],
                ],
                'is_rain_ok' => true,
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'beige', 'hex' => '#D3C0A4', 'label' => 'ベージュ'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事', '休日'],
                'images' => [
                    ['file' => 'sample-shape-ivory-square.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => '画像確認_単独候補 複数画像',
                'status' => 'considering',
                'priority' => 'high',
                'category_id' => 'outerwear_coat',
                'brand_name' => 'Image Sample',
                'price' => 16800,
                'release_date' => '2026-04-10',
                'sale_price' => 12800,
                'discount_ends_at' => '2026-05-06 23:59:00',
                'wanted_reason' => '単独候補の複数画像切替確認用',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'navy', 'hex' => '#1F3A5F', 'label' => 'ネイビー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事', '休日'],
                'images' => [
                    ['file' => 'sample-shape-navy-portrait.png', 'is_primary' => true],
                    ['file' => 'sample-shape-ivory-square.png'],
                    ['file' => 'sample-shape-brown-landscape.png'],
                ],
            ],
            [
                'name' => '色違いスニーカー候補 ブラック',
                'status' => 'considering',
                'priority' => 'high',
                'category_id' => 'shoes_sneakers',
                'brand_name' => 'ABC-MART',
                'price' => 9900,
                'wanted_reason' => '色違い比較用の2件グループ',
                'group_key' => 'sneaker-color-variants',
                'group_order' => 1,
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#262626', 'label' => 'ブラック'],
                ],
                'seasons' => ['オール'],
                'tpos' => ['休日'],
                'images' => [
                    ['file' => 'sample-shape-charcoal-square.png', 'is_primary' => true],
                    ['file' => 'sample-shape-gray-padding.png'],
                ],
            ],
            [
                'name' => '色違いスニーカー候補 ホワイト',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'shoes_sneakers',
                'brand_name' => 'ABC-MART',
                'price' => 9900,
                'wanted_reason' => '色違い比較用の2件グループ',
                'group_key' => 'sneaker-color-variants',
                'group_order' => 2,
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'white', 'hex' => '#ECECEC', 'label' => 'ホワイト'],
                ],
                'seasons' => ['オール'],
                'tpos' => ['休日'],
                'images' => [
                    ['file' => 'sample-shape-ivory-square.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => '色違いバッグ候補 ブラウン',
                'status' => 'considering',
                'priority' => 'high',
                'category_id' => 'bags_rucksack',
                'brand_name' => 'Sample Bag',
                'price' => 12800,
                'wanted_reason' => '色違い比較用の3件グループ',
                'group_key' => 'bag-color-variants',
                'group_order' => 1,
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'brown', 'hex' => '#7C6556', 'label' => 'ブラウン'],
                ],
                'seasons' => ['オール'],
                'tpos' => ['休日'],
                'images' => [
                    ['file' => 'sample-shape-brown-landscape.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => '色違いバッグ候補 グレー',
                'status' => 'on_hold',
                'priority' => 'medium',
                'category_id' => 'bags_rucksack',
                'brand_name' => 'Sample Bag',
                'price' => 12800,
                'wanted_reason' => '色違い比較用の3件グループ',
                'group_key' => 'bag-color-variants',
                'group_order' => 2,
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#8A9099', 'label' => 'グレー'],
                ],
                'seasons' => ['オール'],
                'tpos' => ['休日'],
            ],
            [
                'name' => '色違いバッグ候補 ネイビー',
                'status' => 'considering',
                'priority' => 'low',
                'category_id' => 'bags_rucksack',
                'brand_name' => 'Sample Bag',
                'price' => 11800,
                'sale_ends_at' => '2026-05-20 23:59:00',
                'sale_price' => 9900,
                'discount_ends_at' => '2026-05-10 23:59:00',
                'wanted_reason' => '色違い比較用の3件グループ',
                'group_key' => 'bag-color-variants',
                'group_order' => 3,
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'navy', 'hex' => '#1F3A5F', 'label' => 'ネイビー'],
                ],
                'seasons' => ['オール'],
                'tpos' => ['休日'],
                'images' => [
                    ['file' => 'sample-shape-navy-portrait.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => '画像なし色違い候補 レッド',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'fashion_accessories_scarf_bandana',
                'brand_name' => 'No Image Sample',
                'price' => 3900,
                'wanted_reason' => '画像なし group の fallback 確認用',
                'group_key' => 'no-image-color-variants',
                'group_order' => 1,
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'red', 'hex' => '#C94444', 'label' => 'レッド'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
            ],
            [
                'name' => '画像なし色違い候補 ブルー',
                'status' => 'on_hold',
                'priority' => 'low',
                'category_id' => 'fashion_accessories_scarf_bandana',
                'brand_name' => 'No Image Sample',
                'price' => 3900,
                'wanted_reason' => '画像なし group の fallback 確認用',
                'group_key' => 'no-image-color-variants',
                'group_order' => 2,
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'blue', 'hex' => '#0077D9', 'label' => 'ブルー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
            ],
            [
                'name' => '状態混在色違い候補 グリーン',
                'status' => 'considering',
                'priority' => 'high',
                'category_id' => 'tops_knit_sweater',
                'brand_name' => 'Status Sample',
                'price' => 7900,
                'wanted_reason' => '詳細の同 group 候補ナビで状態混在を確認する',
                'group_key' => 'status-mixed-color-variants',
                'group_order' => 1,
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'green', 'hex' => '#3F7A4D', 'label' => 'グリーン'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['休日'],
                'images' => [
                    ['file' => 'sample-shape-green-portrait.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => '状態混在色違い候補 アイボリー',
                'status' => 'purchased',
                'priority' => 'medium',
                'category_id' => 'tops_knit_sweater',
                'brand_name' => 'Status Sample',
                'price' => 7900,
                'wanted_reason' => '詳細の同 group 候補ナビで購入済み表示を確認する',
                'group_key' => 'status-mixed-color-variants',
                'group_order' => 2,
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'ivory', 'hex' => '#F2EEE4', 'label' => 'アイボリー'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['休日'],
                'images' => [
                    ['file' => 'sample-shape-ivory-square.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => '状態混在色違い候補 グレー',
                'status' => 'dropped',
                'priority' => 'low',
                'category_id' => 'tops_knit_sweater',
                'brand_name' => 'Status Sample',
                'price' => 7900,
                'wanted_reason' => '詳細の同 group 候補ナビで見送り表示を確認する',
                'group_key' => 'status-mixed-color-variants',
                'group_order' => 3,
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#8A9099', 'label' => 'グレー'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['休日'],
            ],
            [
                'name' => '購入素材確認_本体のみ',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'tops_tshirt_cutsew',
                'brand_name' => '素材確認ブランド',
                'price' => 2990,
                'wanted_reason' => '素材表示確認用',
                'size_gender' => 'women',
                'size_label' => 'M',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'white', 'hex' => '#ECECEC', 'label' => 'ホワイト'],
                ],
                'seasons' => ['春', '夏'],
                'tpos' => ['休日'],
                'materials' => [
                    ['part_label' => '本体', 'material_name' => '綿', 'ratio' => 80],
                    ['part_label' => '本体', 'material_name' => 'ポリエステル', 'ratio' => 20],
                ],
            ],
            [
                'name' => '購入素材確認_裏地あり',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'outerwear_coat',
                'brand_name' => '素材確認ブランド',
                'price' => 12800,
                'wanted_reason' => '複数区分確認用',
                'size_gender' => 'women',
                'size_label' => 'FREE',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'beige', 'hex' => '#D3C0A4', 'label' => 'ベージュ'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'materials' => [
                    ['part_label' => '本体', 'material_name' => '綿', 'ratio' => 80],
                    ['part_label' => '本体', 'material_name' => 'ポリエステル', 'ratio' => 20],
                    ['part_label' => '裏地', 'material_name' => 'ポリエステル', 'ratio' => 100],
                ],
            ],
            [
                'name' => '購入素材確認_自由入力区分',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'tops_shirt_blouse',
                'brand_name' => '素材確認ブランド',
                'price' => 6900,
                'wanted_reason' => '自由入力区分確認用',
                'size_gender' => 'women',
                'size_label' => 'M',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'blue', 'hex' => '#0077D9', 'label' => 'ブルー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'materials' => [
                    ['part_label' => '袖口', 'material_name' => '綿', 'ratio' => 50],
                    ['part_label' => '袖口', 'material_name' => 'ポリエステル', 'ratio' => 50],
                ],
            ],
            [
                'name' => '購入素材確認_自由入力素材',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'onepiece_dress_onepiece',
                'brand_name' => '素材確認ブランド',
                'price' => 9900,
                'wanted_reason' => '自由入力素材確認用',
                'size_gender' => 'women',
                'size_label' => 'M',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#8A9099', 'label' => 'グレー'],
                ],
                'seasons' => ['春', '夏'],
                'tpos' => ['休日'],
                'materials' => [
                    ['part_label' => '本体', 'material_name' => 'モダール', 'ratio' => 60],
                    ['part_label' => '本体', 'material_name' => '綿', 'ratio' => 40],
                ],
            ],
            [
                'name' => '購入素材確認_複合',
                'status' => 'on_hold',
                'priority' => 'low',
                'category_id' => 'tops_knit_sweater',
                'brand_name' => '素材確認ブランド',
                'price' => 11800,
                'wanted_reason' => '複合確認用',
                'size_gender' => 'women',
                'size_label' => 'M',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'brown', 'hex' => '#7C6556', 'label' => 'ブラウン'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['休日'],
                'materials' => [
                    ['part_label' => '本体', 'material_name' => 'レーヨン', 'ratio' => 70],
                    ['part_label' => '本体', 'material_name' => 'ナイロン', 'ratio' => 30],
                    ['part_label' => '別布', 'material_name' => 'モダール', 'ratio' => 50],
                    ['part_label' => '別布', 'material_name' => '綿', 'ratio' => 50],
                ],
            ],
        ];

        $this->syncCandidates($user->id, $candidates);
    }

    private function seedLargeUserCandidates(): void
    {
        $user = User::query()->where('email', TestSeedUsers::LARGE_EMAIL)->firstOrFail();

        PurchaseCandidate::query()->where('user_id', $user->id)->delete();
        PurchaseCandidateGroup::query()->where('user_id', $user->id)->delete();

        $candidates = [
            [
                'name' => '白シャツ候補',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'tops_shirt_blouse',
                'size_note' => '首回りは細め',
                'size_details' => [
                    'structured' => [
                        'shoulder_width' => 43,
                        'body_width' => 51,
                        'body_length' => 72,
                        'sleeve_length' => 60,
                        'neck_circumference' => 39,
                    ],
                ],
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'white', 'hex' => '#ECECEC', 'label' => 'ホワイト'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'images' => [
                    ['file' => 'sample-shape-ivory-square.png', 'is_primary' => true],
                    ['file' => 'sample-shape-blue-landscape.png'],
                ],
            ],
            [
                'name' => 'デニム候補',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'pants_pants',
                'size_note' => '丈はやや長め',
                'size_details' => [
                    'structured' => [
                        'waist' => 78,
                        'hip' => 102,
                        'rise' => 30,
                        'inseam' => 74,
                    ],
                ],
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'navy', 'hex' => '#2F4058', 'label' => 'ネイビー'],
                ],
                'seasons' => ['春', '秋', '冬'],
                'tpos' => ['休日'],
                'images' => [
                    ['file' => 'sample-shape-navy-portrait.png', 'is_primary' => true],
                    ['file' => 'sample-shape-brown-landscape.png'],
                ],
            ],
        ];

        $this->syncCandidates($user->id, $candidates);
    }

    private function syncCandidates(int $userId, array $definitions): void
    {
        $groupCache = [];

        foreach ($definitions as $definition) {
            $group = null;
            $groupKey = $definition['group_key'] ?? null;
            if (is_string($groupKey) && $groupKey !== '') {
                $group = $groupCache[$groupKey] ??= PurchaseCandidateGroup::query()->create([
                    'user_id' => $userId,
                ]);
            }

            $candidate = PurchaseCandidate::query()->updateOrCreate(
                ['user_id' => $userId, 'name' => $definition['name']],
                [
                    'status' => $definition['status'] ?? 'considering',
                    'priority' => $definition['priority'] ?? 'medium',
                    'category_id' => $definition['category_id'],
                    'group_id' => $group?->id,
                    'group_order' => $group === null ? null : ($definition['group_order'] ?? $group->nextGroupOrder()),
                    'brand_name' => $definition['brand_name'] ?? null,
                    'price' => $definition['price'] ?? null,
                    'release_date' => $definition['release_date'] ?? null,
                    'sale_price' => $definition['sale_price'] ?? null,
                    'sale_ends_at' => $definition['sale_ends_at'] ?? null,
                    'discount_ends_at' => $definition['discount_ends_at'] ?? null,
                    'purchase_url' => $definition['purchase_url'] ?? null,
                    'memo' => $definition['memo'] ?? null,
                    'wanted_reason' => $definition['wanted_reason'] ?? null,
                    'size_gender' => $definition['size_gender'] ?? null,
                    'size_label' => $definition['size_label'] ?? null,
                    'size_note' => $definition['size_note'] ?? null,
                    'size_details' => $definition['size_details'] ?? null,
                    'is_rain_ok' => $definition['is_rain_ok'] ?? false,
                    'sheerness' => $definition['sheerness'] ?? null,
                ],
            );

            PurchaseCandidateColor::query()->where('purchase_candidate_id', $candidate->id)->delete();
            PurchaseCandidateSeason::query()->where('purchase_candidate_id', $candidate->id)->delete();
            PurchaseCandidateTpo::query()->where('purchase_candidate_id', $candidate->id)->delete();
            $candidate->materials()->delete();
            $candidate->images()->delete();

            foreach ($definition['colors'] ?? [] as $index => $color) {
                PurchaseCandidateColor::query()->create([
                    'purchase_candidate_id' => $candidate->id,
                    ...$color,
                    'sort_order' => $index + 1,
                ]);
            }

            foreach ($definition['seasons'] ?? [] as $index => $season) {
                PurchaseCandidateSeason::query()->create([
                    'purchase_candidate_id' => $candidate->id,
                    'season' => $season,
                    'sort_order' => $index + 1,
                ]);
            }

            foreach ($definition['tpos'] ?? [] as $index => $tpo) {
                PurchaseCandidateTpo::query()->create([
                    'purchase_candidate_id' => $candidate->id,
                    'tpo' => $tpo,
                    'sort_order' => $index + 1,
                ]);
            }

            if (! empty($definition['materials'])) {
                $candidate->materials()->createMany($definition['materials']);
            }

            $this->syncImages($candidate, $definition['images'] ?? []);
        }
    }

    private function syncImages(PurchaseCandidate $candidate, array $images): void
    {
        foreach ($images as $index => $image) {
            $filename = $image['file'];
            $sourcePath = database_path('seeders/assets/sample-images/'.$filename);
            $targetPath = 'seed/purchase-candidates/'.$candidate->user_id.'/'.md5($candidate->name).'/'.$filename;
            if (! is_file($sourcePath)) {
                throw new \RuntimeException('Sample image asset not found: '.$filename);
            }

            $contents = file_get_contents($sourcePath);

            Storage::disk('public')->put($targetPath, $contents);

            PurchaseCandidateImage::query()->create([
                'purchase_candidate_id' => $candidate->id,
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
