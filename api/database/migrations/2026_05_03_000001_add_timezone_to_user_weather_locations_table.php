<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('user_weather_locations', 'timezone')) {
            Schema::table('user_weather_locations', function (Blueprint $table) {
                $table->string('timezone', 100)
                    ->nullable()
                    ->after('longitude');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('user_weather_locations', 'timezone')) {
            Schema::table('user_weather_locations', function (Blueprint $table) {
                $table->dropColumn('timezone');
            });
        }
    }
};
