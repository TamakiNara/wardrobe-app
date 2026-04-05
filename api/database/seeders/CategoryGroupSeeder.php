<?php

namespace Database\Seeders;

use App\Models\CategoryGroup;
use Illuminate\Database\Seeder;

class CategoryGroupSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            ['id' => 'tops', 'name' => 'トップス', 'sort_order' => 1],
            ['id' => 'outerwear', 'name' => 'ジャケット・アウター', 'sort_order' => 2],
            ['id' => 'pants', 'name' => 'パンツ', 'sort_order' => 3],
            ['id' => 'skirts', 'name' => 'スカート', 'sort_order' => 4],
            ['id' => 'onepiece_dress', 'name' => 'ワンピース・ドレス', 'sort_order' => 5],
            ['id' => 'allinone', 'name' => 'オールインワン', 'sort_order' => 6],
            ['id' => 'roomwear_inner', 'name' => 'ルームウェア・インナー', 'sort_order' => 7],
            ['id' => 'legwear', 'name' => 'レッグウェア', 'sort_order' => 8],
            ['id' => 'shoes', 'name' => 'シューズ', 'sort_order' => 9],
            ['id' => 'bags', 'name' => 'バッグ', 'sort_order' => 10],
            ['id' => 'fashion_accessories', 'name' => 'ファッション小物', 'sort_order' => 11],
            ['id' => 'swimwear', 'name' => '水着', 'sort_order' => 12],
            ['id' => 'kimono', 'name' => '着物', 'sort_order' => 13],
        ];

        foreach ($groups as $group) {
            CategoryGroup::query()->updateOrCreate(
                ['id' => $group['id']],
                array_merge($group, ['is_active' => true]),
            );
        }
    }
}
