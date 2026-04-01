<?php

namespace Database\Seeders;

use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateColor;
use App\Models\PurchaseCandidateSeason;
use App\Models\PurchaseCandidateTpo;
use App\Models\User;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Database\Seeder;

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

        $candidates = [
            [
                'name' => 'Tシャツ候補',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'tops_tshirt',
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
                'category_id' => 'bottoms_pants',
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
                'category_id' => 'outer_coat',
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
            ],
            [
                'name' => '購入素材確認_本体のみ',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'tops_tshirt',
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
                'category_id' => 'outer_coat',
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
                'category_id' => 'tops_shirt',
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
                'category_id' => 'onepiece',
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
                'category_id' => 'tops_knit',
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

        $candidates = [
            [
                'name' => '白シャツ候補',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'tops_shirt',
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
            ],
            [
                'name' => 'デニム候補',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'bottoms_pants',
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
            ],
        ];

        $this->syncCandidates($user->id, $candidates);
    }

    private function syncCandidates(int $userId, array $definitions): void
    {
        foreach ($definitions as $definition) {
            $candidate = PurchaseCandidate::query()->updateOrCreate(
                ['user_id' => $userId, 'name' => $definition['name']],
                [
                    'status' => $definition['status'] ?? 'considering',
                    'priority' => $definition['priority'] ?? 'medium',
                    'category_id' => $definition['category_id'],
                    'brand_name' => $definition['brand_name'] ?? null,
                    'price' => $definition['price'] ?? null,
                    'wanted_reason' => $definition['wanted_reason'] ?? null,
                    'size_gender' => $definition['size_gender'] ?? null,
                    'size_label' => $definition['size_label'] ?? null,
                    'size_note' => $definition['size_note'] ?? null,
                    'size_details' => $definition['size_details'] ?? null,
                    'is_rain_ok' => $definition['is_rain_ok'] ?? false,
                ],
            );

            PurchaseCandidateColor::query()->where('purchase_candidate_id', $candidate->id)->delete();
            PurchaseCandidateSeason::query()->where('purchase_candidate_id', $candidate->id)->delete();
            PurchaseCandidateTpo::query()->where('purchase_candidate_id', $candidate->id)->delete();
            $candidate->materials()->delete();

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
        }
    }
}
