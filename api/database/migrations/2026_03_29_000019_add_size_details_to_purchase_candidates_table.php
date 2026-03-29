<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_candidates', function (Blueprint $table) {
            $table->json('size_details')->nullable()->after('size_note');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_candidates', function (Blueprint $table) {
            $table->dropColumn('size_details');
        });
    }
};
