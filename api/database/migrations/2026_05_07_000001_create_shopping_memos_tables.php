<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shopping_memos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('memo')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->index('user_id', 'shopping_memos_user_id_idx');
            $table->index('status', 'shopping_memos_status_idx');
            $table->index(['user_id', 'status'], 'shopping_memos_user_status_idx');
        });

        Schema::create('shopping_memo_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shopping_memo_id')->constrained('shopping_memos')->cascadeOnDelete();
            $table->foreignId('purchase_candidate_id')->constrained('purchase_candidates')->restrictOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('priority')->nullable();
            $table->text('memo')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(
                ['shopping_memo_id', 'purchase_candidate_id'],
                'shopping_memo_items_memo_candidate_uq'
            );
            $table->index('shopping_memo_id', 'shopping_memo_items_memo_idx');
            $table->index('purchase_candidate_id', 'shopping_memo_items_candidate_idx');
            $table->index(
                ['shopping_memo_id', 'sort_order'],
                'shopping_memo_items_memo_sort_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shopping_memo_items');
        Schema::dropIfExists('shopping_memos');
    }
};
