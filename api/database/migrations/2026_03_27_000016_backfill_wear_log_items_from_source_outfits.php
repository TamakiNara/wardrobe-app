<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = Carbon::now();

        $targetWearLogs = DB::table('wear_logs')
            ->leftJoin('wear_log_items', 'wear_logs.id', '=', 'wear_log_items.wear_log_id')
            ->whereNotNull('wear_logs.source_outfit_id')
            ->whereNull('wear_log_items.id')
            ->select('wear_logs.id', 'wear_logs.source_outfit_id')
            ->orderBy('wear_logs.id')
            ->get();

        foreach ($targetWearLogs as $wearLog) {
            $outfitItems = DB::table('outfit_items')
                ->where('outfit_id', $wearLog->source_outfit_id)
                ->orderBy('sort_order')
                ->get(['item_id', 'sort_order']);

            if ($outfitItems->isEmpty()) {
                continue;
            }

            $rows = $outfitItems
                ->map(fn ($outfitItem) => [
                    'wear_log_id' => $wearLog->id,
                    'source_item_id' => $outfitItem->item_id,
                    'item_source_type' => 'outfit',
                    'sort_order' => $outfitItem->sort_order,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
                ->all();

            DB::table('wear_log_items')->insert($rows);
        }
    }

    public function down(): void
    {
        // 既存データの補完 migration のため rollback では削除しない
    }
};
