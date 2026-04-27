<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_candidates', function (Blueprint $table) {
            $table->string('alternate_size_label')->nullable()->after('size_details');
            $table->text('alternate_size_note')->nullable()->after('alternate_size_label');
            $table->json('alternate_size_details')->nullable()->after('alternate_size_note');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_candidates', function (Blueprint $table) {
            $table->dropColumn([
                'alternate_size_label',
                'alternate_size_note',
                'alternate_size_details',
            ]);
        });
    }
};
