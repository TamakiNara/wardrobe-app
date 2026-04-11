<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $specificBagCategoryIds = [
        'bags_tote',
        'bags_shoulder',
        'bags_boston',
        'bags_rucksack',
        'bags_hand',
        'bags_body',
        'bags_waist_pouch',
        'bags_messenger',
        'bags_clutch',
        'bags_sacoche',
        'bags_pochette',
        'bags_drawstring',
        'bags_basket_bag',
        'bags_briefcase',
        'bags_marche_bag',
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
            ['id' => 'bags_boston', 'group_id' => 'bags', 'name' => 'ボストンバッグ', 'sort_order' => 3, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_rucksack', 'group_id' => 'bags', 'name' => 'リュックサック・バックパック', 'sort_order' => 4, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_hand', 'group_id' => 'bags', 'name' => 'ハンドバッグ', 'sort_order' => 5, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_body', 'group_id' => 'bags', 'name' => 'ボディバッグ・クロスボディバッグ', 'sort_order' => 6, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_waist_pouch', 'group_id' => 'bags', 'name' => 'ウエストポーチ', 'sort_order' => 7, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_messenger', 'group_id' => 'bags', 'name' => 'メッセンジャーバッグ', 'sort_order' => 8, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_clutch', 'group_id' => 'bags', 'name' => 'クラッチバッグ', 'sort_order' => 9, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_sacoche', 'group_id' => 'bags', 'name' => 'サコッシュ', 'sort_order' => 10, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_pochette', 'group_id' => 'bags', 'name' => 'ポシェット', 'sort_order' => 11, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_drawstring', 'group_id' => 'bags', 'name' => 'ドローストリングバッグ', 'sort_order' => 12, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_basket_bag', 'group_id' => 'bags', 'name' => 'かごバッグ', 'sort_order' => 13, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_briefcase', 'group_id' => 'bags', 'name' => 'ブリーフケース', 'sort_order' => 14, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_marche_bag', 'group_id' => 'bags', 'name' => 'マルシェバッグ', 'sort_order' => 15, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'bags_other', 'group_id' => 'bags', 'name' => 'その他バッグ', 'sort_order' => 16, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp],
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
        return ['tote', 'shoulder', 'boston', 'rucksack', 'hand', 'body', 'waist-pouch', 'messenger', 'clutch', 'sacoche', 'pochette', 'drawstring', 'basket-bag', 'briefcase', 'marche-bag'];
    }
};
