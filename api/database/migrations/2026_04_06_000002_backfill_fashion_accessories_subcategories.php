<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $shapeToSubcategory = [
            'hat' => 'hat',
            'belt' => 'belt',
            'scarf-stole' => 'scarf_stole',
            'gloves' => 'gloves',
            'jewelry' => 'jewelry',
            'wallet-case' => 'other',
            'scarf-bandana' => 'scarf_bandana',
            'hair-accessory' => 'hair_accessory',
            'eyewear' => 'eyewear',
            'watch' => 'watch',
            'other' => 'other',
            'accessory' => 'other',
        ];

        foreach ($shapeToSubcategory as $shape => $subcategory) {
            DB::table('items')
                ->whereIn('category', ['fashion_accessories', 'accessories'])
                ->where('shape', $shape)
                ->whereNull('subcategory')
                ->update(['subcategory' => $subcategory]);
        }
    }

    public function down(): void
    {
        DB::table('items')
            ->whereIn('category', ['fashion_accessories', 'accessories'])
            ->whereIn('subcategory', [
                'hat',
                'belt',
                'scarf_stole',
                'gloves',
                'jewelry',
                'scarf_bandana',
                'hair_accessory',
                'eyewear',
                'watch',
                'other',
            ])
            ->update(['subcategory' => null]);
    }
};
