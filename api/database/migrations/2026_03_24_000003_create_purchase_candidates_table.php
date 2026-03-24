<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('considering');
            $table->string('priority')->default('medium');
            $table->string('name');
            $table->string('category_id');
            $table->string('brand_name')->nullable();
            $table->unsignedInteger('price')->nullable();
            $table->text('purchase_url')->nullable();
            $table->text('memo')->nullable();
            $table->text('wanted_reason')->nullable();
            $table->string('size_gender')->nullable();
            $table->string('size_label')->nullable();
            $table->text('size_note')->nullable();
            $table->boolean('is_rain_ok')->default(false);
            $table->foreignId('converted_item_id')->nullable()->constrained('items')->nullOnDelete();
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('category_master');
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'priority']);
            $table->index(['user_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_candidates');
    }
};
