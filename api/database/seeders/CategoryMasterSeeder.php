<?php

namespace Database\Seeders;

use App\Models\CategoryMaster;
use Illuminate\Database\Seeder;

class CategoryMasterSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['id' => 'tops_tshirt_cutsew', 'group_id' => 'tops', 'name' => 'Tシャツ・カットソー', 'sort_order' => 1],
            ['id' => 'tops_shirt_blouse', 'group_id' => 'tops', 'name' => 'シャツ・ブラウス', 'sort_order' => 2],
            ['id' => 'tops_knit_sweater', 'group_id' => 'tops', 'name' => 'ニット・セーター', 'sort_order' => 3],
            ['id' => 'tops_cardigan', 'group_id' => 'tops', 'name' => 'カーディガン', 'sort_order' => 4],
            ['id' => 'tops_polo_shirt', 'group_id' => 'tops', 'name' => 'ポロシャツ', 'sort_order' => 5],
            ['id' => 'tops_sweat_trainer', 'group_id' => 'tops', 'name' => 'スウェット・トレーナー', 'sort_order' => 6],
            ['id' => 'tops_hoodie', 'group_id' => 'tops', 'name' => 'パーカー・フーディー', 'sort_order' => 7],
            ['id' => 'tops_vest_gilet', 'group_id' => 'tops', 'name' => 'ベスト・ジレ', 'sort_order' => 8],
            ['id' => 'tops_camisole', 'group_id' => 'tops', 'name' => 'キャミソール', 'sort_order' => 9],
            ['id' => 'tops_tanktop', 'group_id' => 'tops', 'name' => 'タンクトップ', 'sort_order' => 10],
            ['id' => 'tops_other', 'group_id' => 'tops', 'name' => 'その他トップス', 'sort_order' => 11],
            ['id' => 'outerwear_jacket', 'group_id' => 'outerwear', 'name' => 'ジャケット', 'sort_order' => 1],
            ['id' => 'outerwear_blouson', 'group_id' => 'outerwear', 'name' => 'ブルゾン', 'sort_order' => 2],
            ['id' => 'outerwear_down_padded', 'group_id' => 'outerwear', 'name' => 'ダウン・中綿', 'sort_order' => 3],
            ['id' => 'outerwear_coat', 'group_id' => 'outerwear', 'name' => 'コート', 'sort_order' => 4],
            ['id' => 'outerwear_mountain_parka', 'group_id' => 'outerwear', 'name' => 'マウンテンパーカー', 'sort_order' => 5],
            ['id' => 'outerwear_other', 'group_id' => 'outerwear', 'name' => 'その他ジャケット・アウター', 'sort_order' => 6],
            ['id' => 'pants_pants', 'group_id' => 'pants', 'name' => 'パンツ', 'sort_order' => 1],
            ['id' => 'pants_denim', 'group_id' => 'pants', 'name' => 'ジーンズ・デニムパンツ', 'sort_order' => 2],
            ['id' => 'pants_slacks', 'group_id' => 'pants', 'name' => 'スラックス・ドレスパンツ', 'sort_order' => 3],
            ['id' => 'pants_short', 'group_id' => 'pants', 'name' => 'ショートパンツ', 'sort_order' => 4],
            ['id' => 'pants_other', 'group_id' => 'pants', 'name' => 'その他パンツ', 'sort_order' => 5],
            ['id' => 'skirts_skirt', 'group_id' => 'skirts', 'name' => 'スカート', 'sort_order' => 1],
            ['id' => 'skirts_other', 'group_id' => 'skirts', 'name' => 'その他スカート', 'sort_order' => 2],
            ['id' => 'onepiece_dress_onepiece', 'group_id' => 'onepiece_dress', 'name' => 'ワンピース', 'sort_order' => 1],
            ['id' => 'onepiece_dress_dress', 'group_id' => 'onepiece_dress', 'name' => 'ドレス', 'sort_order' => 2],
            ['id' => 'onepiece_dress_other', 'group_id' => 'onepiece_dress', 'name' => 'その他ワンピース・ドレス', 'sort_order' => 3],
            ['id' => 'allinone_allinone', 'group_id' => 'allinone', 'name' => 'オールインワン', 'sort_order' => 1],
            ['id' => 'allinone_salopette', 'group_id' => 'allinone', 'name' => 'サロペット', 'sort_order' => 2],
            ['id' => 'allinone_other', 'group_id' => 'allinone', 'name' => 'その他オールインワン', 'sort_order' => 3],
            ['id' => 'roomwear_inner_roomwear', 'group_id' => 'roomwear_inner', 'name' => 'ルームウェア', 'sort_order' => 1],
            ['id' => 'roomwear_inner_underwear', 'group_id' => 'roomwear_inner', 'name' => 'インナー', 'sort_order' => 2],
            ['id' => 'roomwear_inner_pajamas', 'group_id' => 'roomwear_inner', 'name' => 'パジャマ', 'sort_order' => 3],
            ['id' => 'roomwear_inner_other', 'group_id' => 'roomwear_inner', 'name' => 'その他ルームウェア・インナー', 'sort_order' => 4],
            ['id' => 'legwear_socks', 'group_id' => 'legwear', 'name' => 'ソックス', 'sort_order' => 1],
            ['id' => 'legwear_stockings', 'group_id' => 'legwear', 'name' => 'ストッキング', 'sort_order' => 2],
            ['id' => 'legwear_tights', 'group_id' => 'legwear', 'name' => 'タイツ', 'sort_order' => 3],
            ['id' => 'legwear_leggings', 'group_id' => 'legwear', 'name' => 'レギンス', 'sort_order' => 4],
            ['id' => 'legwear_other', 'group_id' => 'legwear', 'name' => 'その他レッグウェア', 'sort_order' => 5],
            ['id' => 'shoes_sneakers', 'group_id' => 'shoes', 'name' => 'スニーカー', 'sort_order' => 1],
            ['id' => 'shoes_pumps', 'group_id' => 'shoes', 'name' => 'パンプス', 'sort_order' => 2],
            ['id' => 'shoes_boots', 'group_id' => 'shoes', 'name' => 'ブーツ', 'sort_order' => 3],
            ['id' => 'shoes_sandals', 'group_id' => 'shoes', 'name' => 'サンダル', 'sort_order' => 4],
            ['id' => 'shoes_other', 'group_id' => 'shoes', 'name' => 'その他シューズ', 'sort_order' => 5],
            ['id' => 'bags_tote', 'group_id' => 'bags', 'name' => 'トートバッグ', 'sort_order' => 1],
            ['id' => 'bags_shoulder', 'group_id' => 'bags', 'name' => 'ショルダーバッグ', 'sort_order' => 2],
            ['id' => 'bags_backpack', 'group_id' => 'bags', 'name' => 'リュック', 'sort_order' => 3],
            ['id' => 'bags_hand', 'group_id' => 'bags', 'name' => 'ハンドバッグ', 'sort_order' => 4],
            ['id' => 'bags_clutch', 'group_id' => 'bags', 'name' => 'クラッチバッグ', 'sort_order' => 5],
            ['id' => 'bags_body', 'group_id' => 'bags', 'name' => 'ボディバッグ', 'sort_order' => 6],
            ['id' => 'bags_other', 'group_id' => 'bags', 'name' => 'その他バッグ', 'sort_order' => 7],
            ['id' => 'fashion_accessories_hat', 'group_id' => 'fashion_accessories', 'name' => '帽子', 'sort_order' => 1],
            ['id' => 'fashion_accessories_belt', 'group_id' => 'fashion_accessories', 'name' => 'ベルト', 'sort_order' => 2],
            ['id' => 'fashion_accessories_scarf_stole', 'group_id' => 'fashion_accessories', 'name' => 'マフラー・ストール', 'sort_order' => 3],
            ['id' => 'fashion_accessories_gloves', 'group_id' => 'fashion_accessories', 'name' => '手袋', 'sort_order' => 4],
            ['id' => 'fashion_accessories_jewelry', 'group_id' => 'fashion_accessories', 'name' => 'アクセサリー', 'sort_order' => 5],
            ['id' => 'fashion_accessories_wallet_case', 'group_id' => 'fashion_accessories', 'name' => '財布・カードケース', 'sort_order' => 6],
            ['id' => 'fashion_accessories_hair', 'group_id' => 'fashion_accessories', 'name' => 'ヘアアクセサリー', 'sort_order' => 7],
            ['id' => 'fashion_accessories_eyewear', 'group_id' => 'fashion_accessories', 'name' => '眼鏡・サングラス', 'sort_order' => 8],
            ['id' => 'fashion_accessories_watch', 'group_id' => 'fashion_accessories', 'name' => '腕時計', 'sort_order' => 9],
            ['id' => 'fashion_accessories_other', 'group_id' => 'fashion_accessories', 'name' => 'その他ファッション小物', 'sort_order' => 10],
            ['id' => 'swimwear_swimwear', 'group_id' => 'swimwear', 'name' => '水着', 'sort_order' => 1],
            ['id' => 'swimwear_rashguard', 'group_id' => 'swimwear', 'name' => 'ラッシュガード', 'sort_order' => 2],
            ['id' => 'swimwear_other', 'group_id' => 'swimwear', 'name' => 'その他水着', 'sort_order' => 3],
            ['id' => 'kimono_kimono', 'group_id' => 'kimono', 'name' => '着物', 'sort_order' => 1],
            ['id' => 'kimono_other', 'group_id' => 'kimono', 'name' => 'その他着物', 'sort_order' => 2],
        ];

        foreach ($categories as $category) {
            CategoryMaster::query()->updateOrCreate(
                ['id' => $category['id']],
                array_merge($category, ['is_active' => true]),
            );
        }
    }
}
