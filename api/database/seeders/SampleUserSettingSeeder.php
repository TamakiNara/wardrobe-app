<?php

namespace Database\Seeders;

use App\Models\CategoryMaster;
use App\Models\User;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Database\Seeder;

class SampleUserSettingSeeder extends Seeder
{
    public function run(): void
    {
        $allCategoryIds = CategoryMaster::query()
            ->where('is_active', true)
            ->orderBy('group_id')
            ->orderBy('sort_order')
            ->pluck('id')
            ->all();

        $standardHiddenIds = [
            'roomwear_inner_pajamas',
            'shoes_boots',
            'fashion_accessories_gloves',
        ];

        User::query()->where('email', TestSeedUsers::EMPTY_EMAIL)->update([
            'visible_category_ids' => null,
        ]);

        User::query()->where('email', TestSeedUsers::STANDARD_EMAIL)->update([
            'visible_category_ids' => array_values(array_diff($allCategoryIds, $standardHiddenIds)),
        ]);

        User::query()->where('email', TestSeedUsers::LARGE_EMAIL)->update([
            'visible_category_ids' => $allCategoryIds,
        ]);
    }
}
