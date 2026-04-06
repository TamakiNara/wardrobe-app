<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $specificBagCategoryIds = [
        'bags_tote',
        'bags_shoulder',
        'bags_backpack',
        'bags_hand',
        'bags_clutch',
        'bags_body',
    ];

    private function expandedBagCategoryIds(): array
    {
        return [
            ...$this->specificBagCategoryIds,
            'bags_other',
        ];
    }

    private function bagCategoryRows(string $timestamp): array
    {
        return [
            ['id' => 'bags_tote', 'group_id' => 'bags', 'name' => 'トートバッグ', 'sort_order' => 1, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_shoulder', 'group_id' => 'bags', 'name' => 'ショルダーバッグ', 'sort_order' => 2, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_backpack', 'group_id' => 'bags', 'name' => 'リュック', 'sort_order' => 3, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_hand', 'group_id' => 'bags', 'name' => 'ハンドバッグ', 'sort_order' => 4, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_clutch', 'group_id' => 'bags', 'name' => 'クラッチバッグ', 'sort_order' => 5, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_body', 'group_id' => 'bags', 'name' => 'ボディバッグ', 'sort_order' => 6, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_other', 'group_id' => 'bags', 'name' => 'その他バッグ', 'sort_order' => 7, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
        ];
    }

    public function up(): void
    {
        $timestamp = now()->toDateTimeString();

        DB::table('category_groups')->updateOrInsert(
            ['id' => 'bags'],
            [
                'name' => 'バッグ',
                'sort_order' => 10,
                'is_active' => true,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]
        );

        DB::table('category_master')->upsert(
            $this->bagCategoryRows($timestamp),
            ['id'],
            ['group_id', 'name', 'sort_order', 'is_active', 'updated_at']
        );

        DB::table('category_master')
            ->where('id', 'bags_bag')
            ->update([
                'is_active' => false,
                'updated_at' => $timestamp,
            ]);

        $presetIds = DB::table('category_preset_categories')
            ->where('category_id', 'bags_bag')
            ->pluck('category_preset_id')
            ->all();

        $presetRows = [];
        foreach ($presetIds as $presetId) {
            foreach ($this->expandedBagCategoryIds() as $categoryId) {
                $presetRows[] = [
                    'category_preset_id' => $presetId,
                    'category_id' => $categoryId,
                ];
            }
        }

        if ($presetRows !== []) {
            DB::table('category_preset_categories')->insertOrIgnore(
                $presetRows
            );
        }

        DB::table('category_preset_categories')
            ->where('category_id', 'bags_bag')
            ->delete();

        $users = DB::table('users')
            ->select(['id', 'visible_category_ids'])
            ->whereNotNull('visible_category_ids')
            ->get();

        foreach ($users as $user) {
            $visibleCategoryIds = json_decode($user->visible_category_ids, true);
            if (! is_array($visibleCategoryIds) || ! in_array('bags_bag', $visibleCategoryIds, true)) {
                continue;
            }

            $nextIds = array_values(array_unique(array_merge(
                array_values(array_diff($visibleCategoryIds, ['bags_bag'])),
                $this->expandedBagCategoryIds(),
            )));
            sort($nextIds);

            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'visible_category_ids' => json_encode($nextIds, JSON_UNESCAPED_UNICODE),
                ]);
        }

        DB::table('items')
            ->where('category', 'bags')
            ->whereIn('shape', $this->specificBagCategoryIdsToShapes())
            ->update([
                'subcategory' => DB::raw('shape'),
            ]);

        DB::table('items')
            ->where('category', 'bags')
            ->where('shape', 'bag')
            ->where('subcategory', 'bag')
            ->update([
                'subcategory' => null,
            ]);

        DB::table('purchase_candidates')
            ->where('category_id', 'bags_bag')
            ->update([
                'category_id' => 'bags_other',
            ]);
    }

    public function down(): void
    {
        $timestamp = now()->toDateTimeString();

        DB::table('category_master')->upsert(
            [
                ['id' => 'bags_bag', 'group_id' => 'bags', 'name' => 'バッグ', 'sort_order' => 1, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
                ['id' => 'bags_other', 'group_id' => 'bags', 'name' => 'その他バッグ', 'sort_order' => 2, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ],
            ['id'],
            ['group_id', 'name', 'sort_order', 'is_active', 'updated_at']
        );

        DB::table('category_master')
            ->whereIn('id', $this->specificBagCategoryIds)
            ->update([
                'is_active' => false,
                'updated_at' => $timestamp,
            ]);

        $presetIds = DB::table('category_preset_categories')
            ->whereIn('category_id', $this->specificBagCategoryIds)
            ->pluck('category_preset_id')
            ->unique()
            ->all();

        $presetRows = [];
        foreach ($presetIds as $presetId) {
            $presetRows[] = [
                'category_preset_id' => $presetId,
                'category_id' => 'bags_bag',
            ];
        }

        if ($presetRows !== []) {
            DB::table('category_preset_categories')->insertOrIgnore(
                $presetRows
            );
        }

        DB::table('category_preset_categories')
            ->whereIn('category_id', $this->specificBagCategoryIds)
            ->delete();

        $users = DB::table('users')
            ->select(['id', 'visible_category_ids'])
            ->whereNotNull('visible_category_ids')
            ->get();

        foreach ($users as $user) {
            $visibleCategoryIds = json_decode($user->visible_category_ids, true);
            if (! is_array($visibleCategoryIds)) {
                continue;
            }

            $hasSpecificIds = count(array_intersect($visibleCategoryIds, $this->specificBagCategoryIds)) > 0;
            if (! $hasSpecificIds) {
                continue;
            }

            $nextIds = array_values(array_unique(array_merge(
                array_values(array_diff($visibleCategoryIds, $this->specificBagCategoryIds)),
                ['bags_bag'],
            )));
            sort($nextIds);

            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'visible_category_ids' => json_encode($nextIds, JSON_UNESCAPED_UNICODE),
                ]);
        }

        DB::table('items')
            ->where('category', 'bags')
            ->whereIn('subcategory', $this->specificBagCategoryIdsToShapes())
            ->update([
                'subcategory' => 'bag',
            ]);

        DB::table('purchase_candidates')
            ->whereIn('category_id', $this->specificBagCategoryIds)
            ->update([
                'category_id' => 'bags_bag',
            ]);
    }

    private function specificBagCategoryIdsToShapes(): array
    {
        return ['tote', 'shoulder', 'backpack', 'hand', 'clutch', 'body'];
    }
};
