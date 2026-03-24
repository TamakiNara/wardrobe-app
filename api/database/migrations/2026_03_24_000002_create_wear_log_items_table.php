<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wear_log_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wear_log_id')->constrained()->cascadeOnDelete();
            $table->foreignId('source_item_id')->nullable()->constrained('items')->nullOnDelete();
            $table->string('item_source_type');
            $table->unsignedInteger('sort_order');
            $table->timestamps();

            $table->unique(['wear_log_id', 'source_item_id'], 'wear_log_items_log_item_unique');
            $table->index(['wear_log_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wear_log_items');
    }
};
