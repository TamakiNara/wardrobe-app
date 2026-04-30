<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wear_logs', function (Blueprint $table) {
            $table->string('outdoor_temperature_feel', 32)->nullable()->after('memo');
            $table->string('indoor_temperature_feel', 32)->nullable()->after('outdoor_temperature_feel');
            $table->string('overall_rating', 16)->nullable()->after('indoor_temperature_feel');
            $table->json('feedback_tags')->nullable()->after('overall_rating');
            $table->text('feedback_memo')->nullable()->after('feedback_tags');
        });
    }

    public function down(): void
    {
        Schema::table('wear_logs', function (Blueprint $table) {
            $table->dropColumn([
                'outdoor_temperature_feel',
                'indoor_temperature_feel',
                'overall_rating',
                'feedback_tags',
                'feedback_memo',
            ]);
        });
    }
};
