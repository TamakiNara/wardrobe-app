<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->string('subcategory')->nullable()->after('category');
            $table->index(['category', 'subcategory']);
        });

        DB::table('items')
            ->select(['id', 'category', 'shape'])
            ->orderBy('id')
            ->chunkById(200, function ($items) {
                foreach ($items as $item) {
                    $subcategory = match ($item->category) {
                        'tops' => match ($item->shape) {
                            'tshirt' => 'tshirt_cutsew',
                            'shirt', 'blouse' => 'shirt_blouse',
                            'knit' => 'knit_sweater',
                            'cardigan' => 'cardigan',
                            'camisole' => 'camisole',
                            'tanktop' => 'tanktop',
                            default => null,
                        },
                        'pants' => match ($item->shape) {
                            'pants', 'straight', 'tapered', 'wide', 'culottes', 'short-pants' => 'pants',
                            'denim' => 'denim',
                            'slacks' => 'slacks',
                            'other' => 'other',
                            default => null,
                        },
                        'outerwear' => match ($item->shape) {
                            'jacket' => 'jacket',
                            'coat' => 'coat',
                            'blouson' => 'blouson',
                            'down-padded' => 'down_padded',
                            'mountain-parka' => 'mountain_parka',
                            'other' => 'other',
                            default => null,
                        },
                        'outer' => match ($item->shape) {
                            'tailored' => 'jacket',
                            'trench', 'chester' => 'coat',
                            'outer-cardigan' => 'blouson',
                            'down' => 'down_padded',
                            default => null,
                        },
                        'onepiece_dress' => match ($item->shape) {
                            'onepiece' => 'onepiece',
                            'dress' => 'dress',
                            'other' => 'other',
                            default => null,
                        },
                        'allinone' => match ($item->shape) {
                            'allinone' => 'allinone',
                            'salopette' => 'salopette',
                            'other' => 'other',
                            default => null,
                        },
                        'onepiece_allinone' => match ($item->shape) {
                            'onepiece' => 'onepiece',
                            'allinone' => 'allinone',
                            default => null,
                        },
                        default => null,
                    };

                    if ($subcategory === null) {
                        continue;
                    }

                    DB::table('items')
                        ->where('id', $item->id)
                        ->update(['subcategory' => $subcategory]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex(['category', 'subcategory']);
            $table->dropColumn('subcategory');
        });
    }
};
