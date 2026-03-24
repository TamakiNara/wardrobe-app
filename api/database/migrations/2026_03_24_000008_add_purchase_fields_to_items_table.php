<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->string('brand_name')->nullable()->after('name');
            $table->unsignedInteger('price')->nullable()->after('brand_name');
            $table->text('purchase_url')->nullable()->after('price');
            $table->date('purchased_at')->nullable()->after('purchase_url');
            $table->string('size_gender')->nullable()->after('purchased_at');
            $table->string('size_label')->nullable()->after('size_gender');
            $table->text('size_note')->nullable()->after('size_label');
            $table->json('size_details')->nullable()->after('size_note');
            $table->boolean('is_rain_ok')->default(false)->after('size_details');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn([
                'brand_name',
                'price',
                'purchase_url',
                'purchased_at',
                'size_gender',
                'size_label',
                'size_note',
                'size_details',
                'is_rain_ok',
            ]);
        });
    }
};
