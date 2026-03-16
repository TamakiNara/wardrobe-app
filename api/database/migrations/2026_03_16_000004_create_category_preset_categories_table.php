<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_preset_categories', function (Blueprint $table) {
            $table->id();
            $table->string('category_preset_id');
            $table->string('category_id');
            $table->timestamps();

            $table->foreign('category_preset_id')->references('id')->on('category_presets')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreign('category_id')->references('id')->on('category_master')->cascadeOnUpdate()->cascadeOnDelete();
            $table->unique(['category_preset_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_preset_categories');
    }
};