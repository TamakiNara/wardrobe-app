<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weather_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')
                ->nullable()
                ->constrained('user_weather_locations')
                ->restrictOnDelete();
            $table->date('weather_date');
            $table->string('location_name_snapshot');
            $table->string('forecast_area_code_snapshot')->nullable();
            $table->string('weather_condition');
            $table->decimal('temperature_high', 5, 1)->nullable();
            $table->decimal('temperature_low', 5, 1)->nullable();
            $table->text('memo')->nullable();
            $table->string('source_type')->default('manual');
            $table->string('source_name')->default('manual');
            $table->timestamp('source_fetched_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'weather_date', 'location_id'], 'weather_records_user_date_location_unique');
            $table->index(['user_id', 'weather_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weather_records');
    }
};
