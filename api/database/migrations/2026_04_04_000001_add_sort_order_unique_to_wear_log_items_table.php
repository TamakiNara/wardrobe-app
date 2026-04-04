<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wear_log_items', function (Blueprint $table) {
            $table->dropIndex('wear_log_items_wear_log_id_sort_order_index');
            $table->unique(['wear_log_id', 'sort_order'], 'wear_log_items_log_order_unique');
        });
    }

    public function down(): void
    {
        Schema::table('wear_log_items', function (Blueprint $table) {
            $table->dropUnique('wear_log_items_log_order_unique');
            $table->index(['wear_log_id', 'sort_order']);
        });
    }
};
