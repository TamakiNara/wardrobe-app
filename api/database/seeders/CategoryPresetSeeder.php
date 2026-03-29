<?php

namespace Database\Seeders;

use App\Models\CategoryPreset;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoryPresetSeeder extends Seeder
{
    public function run(): void
    {
        $presets = [
            ['id' => 'male', 'name' => '男', 'sort_order' => 1],
            ['id' => 'female', 'name' => '女', 'sort_order' => 2],
        ];

        foreach ($presets as $preset) {
            CategoryPreset::query()->updateOrCreate(
                ['id' => $preset['id']],
                array_merge($preset, ['is_active' => true]),
            );
        }

        $allCategoryIds = DB::table('category_master')->orderBy('id')->pluck('id')->all();
        $maleExcludedIds = [
            'bottoms_skirt',
            'dress_onepiece',
            'dress_allinone',
            'shoes_pumps',
        ];

        $presetCategoryMap = [
            'male' => array_values(array_diff($allCategoryIds, $maleExcludedIds)),
            'female' => $allCategoryIds,
        ];

        foreach ($presetCategoryMap as $presetId => $categoryIds) {
            $preset = CategoryPreset::query()->findOrFail($presetId);
            $preset->categories()->sync($categoryIds);
        }
    }
}
