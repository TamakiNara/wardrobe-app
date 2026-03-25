<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_brands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('kana')->nullable();
            $table->string('normalized_name');
            $table->string('normalized_kana')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'normalized_name']);
            $table->index(['user_id', 'is_active']);
            $table->index(['user_id', 'normalized_kana']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_brands');
    }
};
