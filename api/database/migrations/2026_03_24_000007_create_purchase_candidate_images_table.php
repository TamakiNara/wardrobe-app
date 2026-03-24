<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_candidate_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_candidate_id')->constrained()->cascadeOnDelete();
            $table->string('disk');
            $table->string('path');
            $table->string('original_filename')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedInteger('file_size')->nullable();
            $table->unsignedInteger('sort_order');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->index(['purchase_candidate_id', 'sort_order'], 'purchase_candidate_images_candidate_order_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_candidate_images');
    }
};
