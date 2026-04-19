<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_candidate_colors', function (Blueprint $table) {
            $table->string('custom_label', 50)->nullable()->after('label');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_candidate_colors', function (Blueprint $table) {
            $table->dropColumn('custom_label');
        });
    }
};
