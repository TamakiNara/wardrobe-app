<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $roomwearSubcategoryMap = [
        'roomwear' => 'roomwear_inner_roomwear',
        'underwear' => 'roomwear_inner_underwear',
        'pajamas' => 'roomwear_inner_pajamas',
        'other' => 'roomwear_inner_other',
    ];

    private array $shapeToSubcategoryMap = [
        'roomwear' => 'roomwear',
        'underwear' => 'underwear',
        'pajamas' => 'pajamas',
    ];

    public function up(): void
    {
        $timestamp = now()->toDateTimeString();

        if (DB::table('category_groups')->where('id', 'roomwear_inner')->exists()) {
            DB::table('category_master')->updateOrInsert(
                ['id' => 'roomwear_inner_other'],
                [
                    'group_id' => 'roomwear_inner',
                    'name' => 'その他ルームウェア・インナー',
                    'sort_order' => 4,
                    'is_active' => true,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]
            );

            $presetIds = DB::table('category_preset_categories')
                ->whereIn('category_id', [
                    'roomwear_inner_roomwear',
                    'roomwear_inner_underwear',
                    'roomwear_inner_pajamas',
                ])
                ->pluck('category_preset_id')
                ->unique()
                ->all();

            $presetRows = [];
            foreach ($presetIds as $presetId) {
                $presetRows[] = [
                    'category_preset_id' => $presetId,
                    'category_id' => 'roomwear_inner_other',
                ];
            }

            if ($presetRows !== []) {
                DB::table('category_preset_categories')->insertOrIgnore($presetRows);
            }

            $users = DB::table('users')
                ->select(['id', 'visible_category_ids'])
                ->whereNotNull('visible_category_ids')
                ->get();

            foreach ($users as $user) {
                $visibleCategoryIds = json_decode($user->visible_category_ids, true);
                if (! is_array($visibleCategoryIds)) {
                    continue;
                }

                $hasRoomwearIds = count(array_intersect($visibleCategoryIds, [
                    'roomwear_inner_roomwear',
                    'roomwear_inner_underwear',
                    'roomwear_inner_pajamas',
                ])) > 0;
                if (! $hasRoomwearIds || in_array('roomwear_inner_other', $visibleCategoryIds, true)) {
                    continue;
                }

                $nextIds = array_values(array_unique(array_merge(
                    $visibleCategoryIds,
                    ['roomwear_inner_other'],
                )));
                sort($nextIds);

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'visible_category_ids' => json_encode($nextIds, JSON_UNESCAPED_UNICODE),
                    ]);
            }
        }

        foreach ($this->shapeToSubcategoryMap as $shape => $subcategory) {
            DB::table('items')
                ->where('category', 'inner')
                ->where('shape', $shape)
                ->whereNull('subcategory')
                ->update([
                    'subcategory' => $subcategory,
                ]);
        }
    }

    public function down(): void
    {
        $timestamp = now()->toDateTimeString();

        if (DB::table('category_groups')->where('id', 'roomwear_inner')->exists()) {
            DB::table('category_master')
                ->where('id', 'roomwear_inner_other')
                ->update([
                    'is_active' => false,
                    'updated_at' => $timestamp,
                ]);

            DB::table('category_preset_categories')
                ->where('category_id', 'roomwear_inner_other')
                ->delete();

            $users = DB::table('users')
                ->select(['id', 'visible_category_ids'])
                ->whereNotNull('visible_category_ids')
                ->get();

            foreach ($users as $user) {
                $visibleCategoryIds = json_decode($user->visible_category_ids, true);
                if (! is_array($visibleCategoryIds) || ! in_array('roomwear_inner_other', $visibleCategoryIds, true)) {
                    continue;
                }

                $nextIds = array_values(array_diff($visibleCategoryIds, ['roomwear_inner_other']));

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'visible_category_ids' => json_encode($nextIds, JSON_UNESCAPED_UNICODE),
                    ]);
            }
        }

        foreach (array_values($this->shapeToSubcategoryMap) as $subcategory) {
            DB::table('items')
                ->where('category', 'inner')
                ->where('subcategory', $subcategory)
                ->update([
                    'subcategory' => null,
                ]);
        }
    }
};
