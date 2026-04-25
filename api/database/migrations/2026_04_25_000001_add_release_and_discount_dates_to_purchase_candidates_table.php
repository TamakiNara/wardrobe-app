<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_candidates', function (Blueprint $table) {
            $table->date('release_date')->nullable()->after('price');
            $table->timestamp('discount_ends_at')->nullable()->after('sale_ends_at');
        });

        // 旧仕様では sale_ends_at をセール終了日として使っていたため、
        // 既存値は discount_ends_at へ移し、sale_ends_at は販売終了日用に空へ戻す。
        DB::statement(
            'update purchase_candidates
             set discount_ends_at = sale_ends_at,
                 sale_ends_at = null
             where sale_ends_at is not null
               and discount_ends_at is null'
        );
    }

    public function down(): void
    {
        Schema::table('purchase_candidates', function (Blueprint $table) {
            $table->dropColumn(['release_date', 'discount_ends_at']);
        });
    }
};
