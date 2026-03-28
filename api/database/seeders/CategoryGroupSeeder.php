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
            ['id' => 'outer', 'name' => 'アウター', 'sort_order' => 2],
            ['id' => 'bottoms', 'name' => 'ボトムス', 'sort_order' => 3],
            ['id' => 'dress', 'name' => 'ワンピース・オールインワン', 'sort_order' => 4],
            ['id' => 'inner', 'name' => 'ルームウェア・インナー', 'sort_order' => 5],
            ['id' => 'legwear', 'name' => 'レッグウェア', 'sort_order' => 6],
            ['id' => 'shoes', 'name' => 'シューズ', 'sort_order' => 7],
            ['id' => 'bags', 'name' => 'バッグ', 'sort_order' => 8],
            ['id' => 'accessories', 'name' => '小物', 'sort_order' => 9],
        ];

        foreach ($groups as $group) {
            CategoryGroup::query()->updateOrCreate(
                ['id' => $group['id']],
                array_merge($group, ['is_active' => true]),
            );
        }
    }
}
