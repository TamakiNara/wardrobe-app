<?php

namespace Database\Seeders;

use App\Models\CategoryMaster;
use Illuminate\Database\Seeder;

class CategoryMasterSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['id' => 'tops_tshirt', 'group_id' => 'tops', 'name' => 'Tシャツ', 'sort_order' => 1],
            ['id' => 'tops_shirt', 'group_id' => 'tops', 'name' => 'シャツ / ブラウス', 'sort_order' => 2],
            ['id' => 'tops_knit', 'group_id' => 'tops', 'name' => 'ニット / セーター', 'sort_order' => 3],
            ['id' => 'tops_hoodie', 'group_id' => 'tops', 'name' => 'パーカー / スウェット', 'sort_order' => 4],
            ['id' => 'tops_cardigan', 'group_id' => 'tops', 'name' => 'カーディガン', 'sort_order' => 5],
            ['id' => 'tops_vest', 'group_id' => 'tops', 'name' => 'ベスト', 'sort_order' => 6],
            ['id' => 'outer_jacket', 'group_id' => 'outer', 'name' => 'ジャケット', 'sort_order' => 1],
            ['id' => 'outer_coat', 'group_id' => 'outer', 'name' => 'コート', 'sort_order' => 2],
            ['id' => 'outer_blouson', 'group_id' => 'outer', 'name' => 'ブルゾン', 'sort_order' => 3],
            ['id' => 'outer_down', 'group_id' => 'outer', 'name' => 'ダウン / 中綿', 'sort_order' => 4],
            ['id' => 'outer_other', 'group_id' => 'outer', 'name' => 'その他アウター', 'sort_order' => 5],
            ['id' => 'bottoms_pants', 'group_id' => 'bottoms', 'name' => 'パンツ', 'sort_order' => 1],
            ['id' => 'bottoms_skirt', 'group_id' => 'bottoms', 'name' => 'スカート', 'sort_order' => 2],
            ['id' => 'bottoms_shorts', 'group_id' => 'bottoms', 'name' => 'ショートパンツ', 'sort_order' => 3],
            ['id' => 'bottoms_other', 'group_id' => 'bottoms', 'name' => 'その他ボトムス', 'sort_order' => 4],
            ['id' => 'dress_onepiece', 'group_id' => 'dress', 'name' => 'ワンピース', 'sort_order' => 1],
            ['id' => 'dress_allinone', 'group_id' => 'dress', 'name' => 'オールインワン / サロペット', 'sort_order' => 2],
            ['id' => 'inner_roomwear', 'group_id' => 'inner', 'name' => 'ルームウェア', 'sort_order' => 1],
            ['id' => 'inner_underwear', 'group_id' => 'inner', 'name' => 'インナー', 'sort_order' => 2],
            ['id' => 'inner_pajamas', 'group_id' => 'inner', 'name' => 'パジャマ', 'sort_order' => 3],
            ['id' => 'shoes_sneakers', 'group_id' => 'shoes', 'name' => 'スニーカー', 'sort_order' => 1],
            ['id' => 'shoes_loafers', 'group_id' => 'shoes', 'name' => 'ローファー / 革靴', 'sort_order' => 2],
            ['id' => 'shoes_pumps', 'group_id' => 'shoes', 'name' => 'パンプス', 'sort_order' => 3],
            ['id' => 'shoes_boots', 'group_id' => 'shoes', 'name' => 'ブーツ', 'sort_order' => 4],
            ['id' => 'shoes_sandals', 'group_id' => 'shoes', 'name' => 'サンダル', 'sort_order' => 5],
            ['id' => 'shoes_other', 'group_id' => 'shoes', 'name' => 'その他シューズ', 'sort_order' => 6],
            ['id' => 'bags_hand', 'group_id' => 'bags', 'name' => 'ハンドバッグ', 'sort_order' => 1],
            ['id' => 'bags_shoulder', 'group_id' => 'bags', 'name' => 'ショルダーバッグ', 'sort_order' => 2],
            ['id' => 'bags_tote', 'group_id' => 'bags', 'name' => 'トートバッグ', 'sort_order' => 3],
            ['id' => 'bags_backpack', 'group_id' => 'bags', 'name' => 'リュック', 'sort_order' => 4],
            ['id' => 'bags_body', 'group_id' => 'bags', 'name' => 'ボディバッグ', 'sort_order' => 5],
            ['id' => 'bags_clutch', 'group_id' => 'bags', 'name' => 'クラッチバッグ', 'sort_order' => 6],
            ['id' => 'bags_other', 'group_id' => 'bags', 'name' => 'その他バッグ', 'sort_order' => 7],
            ['id' => 'accessories_hat', 'group_id' => 'accessories', 'name' => '帽子', 'sort_order' => 1],
            ['id' => 'accessories_belt', 'group_id' => 'accessories', 'name' => 'ベルト', 'sort_order' => 2],
            ['id' => 'accessories_scarf', 'group_id' => 'accessories', 'name' => 'マフラー / ストール', 'sort_order' => 3],
            ['id' => 'accessories_gloves', 'group_id' => 'accessories', 'name' => '手袋', 'sort_order' => 4],
            ['id' => 'accessories_jewelry', 'group_id' => 'accessories', 'name' => 'アクセサリー', 'sort_order' => 5],
            ['id' => 'accessories_other', 'group_id' => 'accessories', 'name' => 'その他小物', 'sort_order' => 6],
        ];

        foreach ($categories as $category) {
            CategoryMaster::query()->updateOrCreate(
                ['id' => $category['id']],
                array_merge($category, ['is_active' => true]),
            );
        }
    }
}