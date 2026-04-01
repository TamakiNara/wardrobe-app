<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->string('part_label');
            $table->string('material_name');
            $table->unsignedTinyInteger('ratio');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_materials');
    }
};
