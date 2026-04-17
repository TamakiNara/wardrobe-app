<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_candidate_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->index('user_id');
        });

        Schema::table('purchase_candidates', function (Blueprint $table) {
            $table->foreignId('group_id')
                ->nullable()
                ->after('user_id')
                ->constrained('purchase_candidate_groups')
                ->nullOnDelete();
            $table->unsignedInteger('group_order')->nullable()->after('group_id');

            $table->unique(['group_id', 'group_order']);
        });
    }

    public function down(): void
    {
        Schema::table('purchase_candidates', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->dropUnique(['group_id', 'group_order']);
            $table->dropColumn(['group_id', 'group_order']);
        });

        Schema::dropIfExists('purchase_candidate_groups');
    }
};
