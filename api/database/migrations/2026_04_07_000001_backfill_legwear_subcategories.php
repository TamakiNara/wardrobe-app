<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $shapeToSubcategoryMap = [
        'socks' => 'socks',
        'stockings' => 'stockings',
        'tights' => 'tights',
        'leggings' => 'leggings',
    ];

    public function up(): void
    {
        foreach ($this->shapeToSubcategoryMap as $shape => $subcategory) {
            DB::table('items')
                ->where('category', 'legwear')
                ->where('shape', $shape)
                ->whereNull('subcategory')
                ->update([
                    'subcategory' => $subcategory,
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        foreach (array_values($this->shapeToSubcategoryMap) as $subcategory) {
            DB::table('items')
                ->where('category', 'legwear')
                ->where('subcategory', $subcategory)
                ->update([
                    'subcategory' => null,
                    'updated_at' => now(),
                ]);
        }
    }
};
