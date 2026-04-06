<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $shoeSubcategoryMap = [
        'sneakers' => 'shoes_sneakers',
        'pumps' => 'shoes_pumps',
        'boots' => 'shoes_boots',
        'sandals' => 'shoes_sandals',
        'other' => 'shoes_other',
    ];

    private array $shapeToSubcategoryMap = [
        'sneakers' => 'sneakers',
        'pumps' => 'pumps',
        'short-boots' => 'boots',
        'sandals' => 'sandals',
        'other' => 'other',
    ];

    public function up(): void
    {
        $timestamp = now()->toDateTimeString();

        DB::table('category_master')
            ->where('id', 'shoes_loafers_leather')
            ->update([
                'is_active' => false,
                'updated_at' => $timestamp,
            ]);

        $presetIds = DB::table('category_preset_categories')
            ->where('category_id', 'shoes_loafers_leather')
            ->pluck('category_preset_id')
            ->all();

        $presetRows = [];
        foreach ($presetIds as $presetId) {
            $presetRows[] = [
                'category_preset_id' => $presetId,
                'category_id' => 'shoes_other',
            ];
        }

        if ($presetRows !== []) {
            DB::table('category_preset_categories')->insertOrIgnore($presetRows);
        }

        DB::table('category_preset_categories')
            ->where('category_id', 'shoes_loafers_leather')
            ->delete();

        $users = DB::table('users')
            ->select(['id', 'visible_category_ids'])
            ->whereNotNull('visible_category_ids')
            ->get();

        foreach ($users as $user) {
            $visibleCategoryIds = json_decode($user->visible_category_ids, true);
            if (! is_array($visibleCategoryIds) || ! in_array('shoes_loafers_leather', $visibleCategoryIds, true)) {
                continue;
            }

            $nextIds = array_values(array_unique(array_merge(
                array_values(array_diff($visibleCategoryIds, ['shoes_loafers_leather'])),
                ['shoes_other'],
            )));
            sort($nextIds);

            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'visible_category_ids' => json_encode($nextIds, JSON_UNESCAPED_UNICODE),
                ]);
        }

        foreach ($this->shapeToSubcategoryMap as $shape => $subcategory) {
            DB::table('items')
                ->where('category', 'shoes')
                ->where('shape', $shape)
                ->where(function ($query) {
                    $query->whereNull('subcategory')
                        ->orWhere('subcategory', 'shoes');
                })
                ->update([
                    'subcategory' => $subcategory,
                ]);
        }

        DB::table('purchase_candidates')
            ->where('category_id', 'shoes_loafers_leather')
            ->update([
                'category_id' => 'shoes_other',
            ]);
    }

    public function down(): void
    {
        $timestamp = now()->toDateTimeString();

        DB::table('category_master')
            ->where('id', 'shoes_loafers_leather')
            ->update([
                'is_active' => true,
                'updated_at' => $timestamp,
            ]);

        foreach (array_values($this->shapeToSubcategoryMap) as $subcategory) {
            DB::table('items')
                ->where('category', 'shoes')
                ->where('subcategory', $subcategory)
                ->update([
                    'subcategory' => 'shoes',
                ]);
        }
    }
};
