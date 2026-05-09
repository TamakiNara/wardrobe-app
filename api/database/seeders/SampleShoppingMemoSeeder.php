<?php

namespace Database\Seeders;

use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateColor;
use App\Models\PurchaseCandidateImage;
use App\Models\PurchaseCandidateSeason;
use App\Models\PurchaseCandidateTpo;
use App\Models\ShoppingMemo;
use App\Models\ShoppingMemoItem;
use App\Models\User;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class SampleShoppingMemoSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->where('email', TestSeedUsers::STANDARD_EMAIL)->firstOrFail();

        $candidates = $this->syncDemoCandidates($user->id);

        $this->syncMemo(
            $user->id,
            '春夏物',
            '春夏に買うか迷っている候補',
            'draft',
            [
                'REDKAP別注オックスフォードシャツ',
                'BOODY クルーネックTシャツ',
                'リネン洗いざらしジャケット',
                'ヘンプコットン長袖シャツ',
                '試着メモだけ残したワンピース',
            ],
            $candidates,
        );

        $this->syncMemo(
            $user->id,
            '店舗で見る候補',
            '実店舗で見たい候補',
            'draft',
            [
                '店舗で見るリブタンクトップ',
                '店舗で見るテーラードジャケット',
                '店舗で見るリネンシャツ',
            ],
            $candidates,
        );

        $this->syncMemo(
            $user->id,
            '見送り済み比較',
            '比較を終えた候補',
            'closed',
            [
                '見送り比較用ニット',
                '見送り比較用シャツ',
            ],
            $candidates,
        );
    }

    /**
     * @return array<string, PurchaseCandidate>
     */
    private function syncDemoCandidates(int $userId): array
    {
        $definitions = [
            [
                'name' => 'REDKAP別注オックスフォードシャツ',
                'status' => 'considering',
                'priority' => 'high',
                'category_id' => 'tops_shirt_blouse',
                'brand_name' => 'REDKAP',
                'price' => 6600,
                'sale_price' => 4950,
                'discount_ends_at' => '2026-05-11 10:59:00',
                'purchase_url' => 'https://item.rakuten.co.jp/sample/redkap-oxford-shirt/',
                'wanted_reason' => '買い物メモの楽天ドメイン確認用',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'blue', 'hex' => '#6E8DB6', 'label' => 'ブルー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
                'images' => [
                    ['file' => 'sample-shape-blue-landscape.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => 'BOODY クルーネックTシャツ',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'tops_tshirt_cutsew',
                'brand_name' => 'BOODY',
                'price' => 3900,
                'sale_price' => 3510,
                'discount_ends_at' => '2026-05-14 23:59:00',
                'purchase_url' => 'https://boody.co.jp/products/crew-neck-tshirt',
                'wanted_reason' => '買い物メモの独立ドメイン確認用',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'black', 'hex' => '#262626', 'label' => 'ブラック'],
                ],
                'seasons' => ['春', '夏'],
                'tpos' => ['休日'],
                'images' => [
                    ['file' => 'sample-shape-charcoal-square.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => 'リネン洗いざらしジャケット',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'outerwear_coat',
                'brand_name' => '無印良品',
                'price' => 9990,
                'purchase_url' => 'https://www.muji.com/jp/ja/store/cmdty/detail/linen-jacket',
                'wanted_reason' => '買い物メモの無印グループ確認用',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'navy', 'hex' => '#2F4058', 'label' => 'ネイビー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'images' => [
                    ['file' => 'sample-shape-navy-portrait.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => 'ヘンプコットン長袖シャツ',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'tops_shirt_blouse',
                'brand_name' => '無印良品',
                'price' => 3990,
                'purchase_url' => 'https://www.muji.com/jp/ja/store/cmdty/detail/hemp-cotton-shirt',
                'wanted_reason' => '買い物メモの同一ドメイン複数候補確認用',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'green', 'hex' => '#3F7A4D', 'label' => 'グリーン'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
                'images' => [
                    ['file' => 'sample-shape-green-portrait.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => '試着メモだけ残したワンピース',
                'status' => 'on_hold',
                'priority' => 'low',
                'category_id' => 'onepiece_dress_onepiece',
                'brand_name' => null,
                'price' => null,
                'sale_price' => null,
                'wanted_reason' => '未分類と価格未設定の確認用',
                'memo' => 'ブランド未確定。店舗で試着したい。',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#8A9099', 'label' => 'グレー'],
                ],
                'seasons' => ['春', '夏'],
                'tpos' => ['休日'],
            ],
            [
                'name' => '店舗で見るリブタンクトップ',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'tops_tshirt_cutsew',
                'brand_name' => 'UNIQLO',
                'price' => 1990,
                'wanted_reason' => 'URL なしブランドグループ確認用',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'white', 'hex' => '#ECECEC', 'label' => 'ホワイト'],
                ],
                'seasons' => ['春', '夏'],
                'tpos' => ['休日'],
                'images' => [
                    ['file' => 'sample-shape-ivory-square.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => '店舗で見るテーラードジャケット',
                'status' => 'considering',
                'priority' => 'medium',
                'category_id' => 'outerwear_coat',
                'brand_name' => '無印良品',
                'price' => 6990,
                'wanted_reason' => '実店舗候補の別ブランド確認用',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'brown', 'hex' => '#7C6556', 'label' => 'ブラウン'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['仕事'],
                'images' => [
                    ['file' => 'sample-shape-brown-landscape.png', 'is_primary' => true],
                ],
            ],
            [
                'name' => '店舗で見るリネンシャツ',
                'status' => 'on_hold',
                'priority' => 'low',
                'category_id' => 'tops_shirt_blouse',
                'brand_name' => 'UNITED ARROWS',
                'price' => 8900,
                'wanted_reason' => 'brand group の複数ブランド比較用',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'blue', 'hex' => '#6E8DB6', 'label' => 'ブルー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
            ],
            [
                'name' => '見送り比較用ニット',
                'status' => 'purchased',
                'priority' => 'medium',
                'category_id' => 'tops_knit_sweater',
                'brand_name' => 'Status Sample',
                'price' => 7900,
                'purchase_url' => 'https://zozo.jp/shop/sample/goods/knit/',
                'wanted_reason' => 'closed memo の確認用',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'green', 'hex' => '#3F7A4D', 'label' => 'グリーン'],
                ],
                'seasons' => ['秋', '冬'],
                'tpos' => ['休日'],
            ],
            [
                'name' => '見送り比較用シャツ',
                'status' => 'dropped',
                'priority' => 'low',
                'category_id' => 'tops_shirt_blouse',
                'brand_name' => 'Status Sample',
                'price' => 5900,
                'wanted_reason' => 'closed memo の状態確認用',
                'colors' => [
                    ['role' => 'main', 'mode' => 'preset', 'value' => 'gray', 'hex' => '#8A9099', 'label' => 'グレー'],
                ],
                'seasons' => ['春', '秋'],
                'tpos' => ['休日'],
            ],
        ];

        $candidates = [];

        foreach ($definitions as $definition) {
            $candidate = PurchaseCandidate::query()->updateOrCreate(
                ['user_id' => $userId, 'name' => $definition['name']],
                [
                    'status' => $definition['status'],
                    'priority' => $definition['priority'],
                    'category_id' => $definition['category_id'],
                    'brand_name' => $definition['brand_name'] ?? null,
                    'price' => $definition['price'] ?? null,
                    'sale_price' => $definition['sale_price'] ?? null,
                    'sale_ends_at' => $definition['sale_ends_at'] ?? null,
                    'discount_ends_at' => $definition['discount_ends_at'] ?? null,
                    'purchase_url' => $definition['purchase_url'] ?? null,
                    'memo' => $definition['memo'] ?? null,
                    'wanted_reason' => $definition['wanted_reason'] ?? null,
                ],
            );

            PurchaseCandidateColor::query()->where('purchase_candidate_id', $candidate->id)->delete();
            PurchaseCandidateSeason::query()->where('purchase_candidate_id', $candidate->id)->delete();
            PurchaseCandidateTpo::query()->where('purchase_candidate_id', $candidate->id)->delete();
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

            $this->syncImages($candidate, $definition['images'] ?? []);

            $candidates[$candidate->name] = $candidate->fresh();
        }

        return $candidates;
    }

    /**
     * @param  array<string, PurchaseCandidate>  $candidates
     * @param  array<int, string>  $candidateNames
     */
    private function syncMemo(
        int $userId,
        string $name,
        ?string $memo,
        string $status,
        array $candidateNames,
        array $candidates,
    ): void {
        $shoppingMemo = ShoppingMemo::query()->updateOrCreate(
            ['user_id' => $userId, 'name' => $name],
            [
                'memo' => $memo,
                'status' => $status,
            ],
        );

        ShoppingMemoItem::query()->where('shopping_memo_id', $shoppingMemo->id)->delete();

        foreach ($candidateNames as $index => $candidateName) {
            $candidate = $candidates[$candidateName] ?? null;

            if (! $candidate instanceof PurchaseCandidate) {
                continue;
            }

            ShoppingMemoItem::query()->updateOrCreate(
                [
                    'shopping_memo_id' => $shoppingMemo->id,
                    'purchase_candidate_id' => $candidate->id,
                ],
                [
                    'quantity' => 1,
                    'priority' => null,
                    'memo' => null,
                    'sort_order' => $index,
                ],
            );
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

            if ($contents === false) {
                throw new \RuntimeException('Failed to read sample image asset: '.$filename);
            }

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
