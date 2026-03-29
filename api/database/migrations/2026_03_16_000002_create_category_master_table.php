<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_master', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('group_id');
            $table->string('name');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('group_id')->references('id')->on('category_groups')->cascadeOnUpdate()->cascadeOnDelete();
            $table->index(['group_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_master');
    }
};
