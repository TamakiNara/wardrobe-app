<?php

use App\Support\SkinTonePresetSupport;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_preferences', function (Blueprint $table) {
            $table->string('skin_tone_preset')
                ->default(SkinTonePresetSupport::DEFAULT_PRESET)
                ->after('calendar_week_start');
        });
    }

    public function down(): void
    {
        Schema::table('user_preferences', function (Blueprint $table) {
            $table->dropColumn('skin_tone_preset');
        });
    }
};
