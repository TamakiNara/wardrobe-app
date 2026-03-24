<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wear_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status');
            $table->date('event_date');
            $table->unsignedInteger('display_order');
            $table->foreignId('source_outfit_id')->nullable()->constrained('outfits')->nullOnDelete();
            $table->text('memo')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'event_date', 'display_order'], 'wear_logs_user_date_order_unique');
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'event_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wear_logs');
    }
};
