<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_tpos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('sort_order');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_preset')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'name']);
            $table->unique(['user_id', 'sort_order']);
        });

        Schema::table('items', function (Blueprint $table) {
            $table->json('tpo_ids')->nullable()->after('tpos');
        });

        Schema::table('outfits', function (Blueprint $table) {
            $table->json('tpo_ids')->nullable()->after('tpos');
        });

        $now = now();
        $presets = ['仕事', '休日', 'フォーマル'];
        $userIds = DB::table('users')->pluck('id');

        foreach ($userIds as $userId) {
            foreach ($presets as $index => $name) {
                DB::table('user_tpos')->insert([
                    'user_id' => $userId,
                    'name' => $name,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                    'is_preset' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        $this->backfillTpoIds('items');
        $this->backfillTpoIds('outfits');
    }

    public function down(): void
    {
        Schema::table('outfits', function (Blueprint $table) {
            $table->dropColumn('tpo_ids');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('tpo_ids');
        });

        Schema::dropIfExists('user_tpos');
    }

    private function backfillTpoIds(string $table): void
    {
        DB::table($table)
            ->select(['id', 'user_id', 'tpos'])
            ->orderBy('id')
            ->chunkById(100, function ($rows) use ($table) {
                foreach ($rows as $row) {
                    $names = json_decode((string) ($row->tpos ?? '[]'), true);

                    if (! is_array($names) || $names === []) {
                        continue;
                    }

                    $ids = DB::table('user_tpos')
                        ->where('user_id', $row->user_id)
                        ->whereIn('name', $names)
                        ->orderBy('sort_order')
                        ->pluck('id')
                        ->map(fn ($id) => (int) $id)
                        ->values()
                        ->all();

                    DB::table($table)
                        ->where('id', $row->id)
                        ->update([
                            'tpo_ids' => json_encode($ids, JSON_UNESCAPED_UNICODE),
                        ]);
                }
            });
    }
};
