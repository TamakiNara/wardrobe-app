<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_candidate_tpos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_candidate_id')->constrained()->cascadeOnDelete();
            $table->string('tpo');
            $table->unsignedInteger('sort_order');
            $table->timestamps();

            $table->index(['purchase_candidate_id', 'sort_order'], 'purchase_candidate_tpos_candidate_order_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_candidate_tpos');
    }
};
