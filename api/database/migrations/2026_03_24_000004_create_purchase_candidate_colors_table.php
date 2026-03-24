<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_candidate_colors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_candidate_id')->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->string('mode');
            $table->string('value');
            $table->string('hex', 20);
            $table->string('label');
            $table->unsignedInteger('sort_order');
            $table->timestamps();

            $table->index(['purchase_candidate_id', 'sort_order'], 'purchase_candidate_colors_candidate_order_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_candidate_colors');
    }
};
