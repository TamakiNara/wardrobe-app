<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_candidate_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_candidate_id')->constrained()->cascadeOnDelete();
            $table->string('part_label', 100);
            $table->string('material_name', 100);
            $table->unsignedTinyInteger('ratio');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_candidate_materials');
    }
};
