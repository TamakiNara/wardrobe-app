<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('weather_records', function (Blueprint $table) {
            $table->renameColumn('weather_condition', 'weather_code');
        });
    }

    public function down(): void
    {
        Schema::table('weather_records', function (Blueprint $table) {
            $table->renameColumn('weather_code', 'weather_condition');
        });
    }
};
