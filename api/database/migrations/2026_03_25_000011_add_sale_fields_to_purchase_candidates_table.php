<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_candidates', function (Blueprint $table) {
            $table->unsignedInteger('sale_price')->nullable()->after('price');
            $table->timestamp('sale_ends_at')->nullable()->after('sale_price');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_candidates', function (Blueprint $table) {
            $table->dropColumn(['sale_price', 'sale_ends_at']);
        });
    }
};
