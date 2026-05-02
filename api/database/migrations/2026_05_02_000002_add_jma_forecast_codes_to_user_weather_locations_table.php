<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_weather_locations', function (Blueprint $table) {
            $table->string('jma_forecast_region_code', 50)
                ->nullable()
                ->after('forecast_area_code');
            $table->string('jma_forecast_office_code', 50)
                ->nullable()
                ->after('jma_forecast_region_code');
        });
    }

    public function down(): void
    {
        Schema::table('user_weather_locations', function (Blueprint $table) {
            $table->dropColumn([
                'jma_forecast_region_code',
                'jma_forecast_office_code',
            ]);
        });
    }
};
