<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use App\Models\WearLog;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Database\Seeder;

class SampleWearLogSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedStandardUserWearLogs();
        $this->seedLargeUserWearLogs();
    }

    private function seedStandardUserWearLogs(): void
    {
        $user = User::query()->where('email', TestSeedUsers::STANDARD_EMAIL)->firstOrFail();
        $items = Item::query()->where('user_id', $user->id)->get()->keyBy('name');
        $outfits = Outfit::query()->where('user_id', $user->id)->get()->keyBy('name');

        WearLog::query()->where('user_id', $user->id)->delete();

        $definitions = [
            [
                'status' => 'planned',
                'event_date' => '2026-03-24',
                'display_order' => 1,
                'source_outfit_name' => '通勤コーデ',
                'memo' => '朝の通勤予定',
                'items' => [],
            ],
            [
                'status' => 'worn',
                'event_date' => '2026-03-24',
                'display_order' => 2,
                'source_outfit_name' => null,
                'memo' => '靴だけ記録した日',
                'items' => [
                    ['name' => 'スニーカー', 'item_source_type' => 'manual'],
                ],
            ],
            [
                'status' => 'worn',
                'event_date' => '2026-03-23',
                'display_order' => 1,
                'source_outfit_name' => '休日コーデ',
                'memo' => 'バッグを追加した外出',
                'items' => [
                    ['name' => '白Tシャツ', 'item_source_type' => 'outfit'],
                    ['name' => 'トートバッグ', 'item_source_type' => 'manual'],
                ],
            ],
            [
                'status' => 'planned',
                'event_date' => '2026-03-22',
                'display_order' => 1,
                'source_outfit_name' => null,
                'memo' => 'トップスとボトムだけ先に決めた日',
                'items' => [
                    ['name' => '白Tシャツ', 'item_source_type' => 'manual'],
                    ['name' => 'デニムパンツ', 'item_source_type' => 'manual'],
                ],
            ],
            [
                'status' => 'worn',
                'event_date' => '2026-03-21',
                'display_order' => 1,
                'source_outfit_name' => '旧通勤コーデ',
                'memo' => '過去の記録を見直した日',
                'items' => [
                    ['name' => 'グレーパーカー', 'item_source_type' => 'outfit'],
                    ['name' => 'デニムパンツ', 'item_source_type' => 'outfit'],
                ],
            ],
            [
                'status' => 'planned',
                'event_date' => '2026-03-21',
                'display_order' => 2,
                'source_outfit_name' => 'きれいめ通勤コーデ',
                'memo' => '午後の打ち合わせ候補',
                'items' => [],
            ],
            [
                'status' => 'worn',
                'event_date' => '2026-03-20',
                'display_order' => 1,
                'source_outfit_name' => null,
                'memo' => 'コートだけ先に着た記録',
                'items' => [
                    ['name' => 'ベージュトレンチコート', 'item_source_type' => 'manual'],
                    ['name' => 'シルバーネックレス', 'item_source_type' => 'manual'],
                ],
            ],
            [
                'status' => 'planned',
                'event_date' => '2026-03-19',
                'display_order' => 1,
                'source_outfit_name' => '雨の日コーデ',
                'memo' => 'バッグだけ変える予定',
                'items' => [
                    ['name' => '黒カーディガン', 'item_source_type' => 'outfit'],
                    ['name' => 'デニムパンツ', 'item_source_type' => 'outfit'],
                    ['name' => 'スニーカー', 'item_source_type' => 'outfit'],
                    ['name' => 'シルバーネックレス', 'item_source_type' => 'manual'],
                ],
            ],
        ];

        foreach ($definitions as $definition) {
            $sourceOutfitName = $definition['source_outfit_name'];
            $sourceOutfit = is_string($sourceOutfitName)
                ? $outfits->get($sourceOutfitName)
                : null;
            $wearLog = WearLog::query()->create([
                'user_id' => $user->id,
                'status' => $definition['status'],
                'event_date' => $definition['event_date'],
                'display_order' => $definition['display_order'],
                'source_outfit_id' => $sourceOutfit?->id,
                'memo' => $definition['memo'],
            ]);

            $wearLog->wearLogItems()->createMany(
                $this->buildNamedWearLogItemsPayload(
                    $definition['items'],
                    $items,
                    $sourceOutfit
                ),
            );
        }
    }

    private function seedLargeUserWearLogs(): void
    {
        $user = User::query()->where('email', TestSeedUsers::LARGE_EMAIL)->firstOrFail();
        $items = Item::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->orderBy('id')
            ->get()
            ->values();
        $outfits = Outfit::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->orderBy('id')
            ->get()
            ->values();

        WearLog::query()->where('user_id', $user->id)->delete();

        if ($items->count() < 4 || $outfits->count() < 3) {
            return;
        }

        $definitions = [
            ['event_date' => '2026-03-24', 'display_order' => 1, 'status' => 'planned', 'memo' => '朝の通勤候補', 'source_outfit_index' => 0, 'items' => []],
            ['event_date' => '2026-03-24', 'display_order' => 2, 'status' => 'worn', 'memo' => '夜の買い物メモ', 'source_outfit_index' => null, 'items' => [['item_index' => 0, 'item_source_type' => 'manual']]],
            ['event_date' => '2026-03-23', 'display_order' => 1, 'status' => 'planned', 'memo' => '展示会に寄る予定', 'source_outfit_index' => 1, 'items' => [['item_index' => 1, 'item_source_type' => 'manual']]],
            ['event_date' => '2026-03-22', 'display_order' => 1, 'status' => 'worn', 'memo' => '在宅作業の日', 'source_outfit_index' => null, 'items' => [['item_index' => 2, 'item_source_type' => 'manual'], ['item_index' => 3, 'item_source_type' => 'manual']]],
            ['event_date' => '2026-03-21', 'display_order' => 1, 'status' => 'planned', 'memo' => '散歩メモ', 'source_outfit_index' => 2, 'items' => []],
            ['event_date' => '2026-03-20', 'display_order' => 1, 'status' => 'worn', 'memo' => '会食のあとに記録', 'source_outfit_index' => 0, 'items' => [['item_index' => 4, 'item_source_type' => 'manual']]],
            ['event_date' => '2026-03-19', 'display_order' => 1, 'status' => 'planned', 'memo' => '出張前の下見', 'source_outfit_index' => null, 'items' => [['item_index' => 5, 'item_source_type' => 'manual']]],
            ['event_date' => '2026-03-18', 'display_order' => 1, 'status' => 'worn', 'memo' => '映画のあとで登録', 'source_outfit_index' => 1, 'items' => []],
            ['event_date' => '2026-03-17', 'display_order' => 1, 'status' => 'planned', 'memo' => '朝だけ先に決めた日', 'source_outfit_index' => null, 'items' => [['item_index' => 6, 'item_source_type' => 'manual'], ['item_index' => 7, 'item_source_type' => 'manual']]],
            ['event_date' => '2026-03-16', 'display_order' => 1, 'status' => 'worn', 'memo' => '打ち合わせ用メモ', 'source_outfit_index' => 2, 'items' => [['item_index' => 8, 'item_source_type' => 'manual']]],
            ['event_date' => '2026-03-15', 'display_order' => 1, 'status' => 'planned', 'memo' => '休日の買い出し候補', 'source_outfit_index' => 3, 'items' => []],
            ['event_date' => '2026-03-14', 'display_order' => 1, 'status' => 'worn', 'memo' => '展示会の帰り道', 'source_outfit_index' => null, 'items' => [['item_index' => 9, 'item_source_type' => 'manual']]],
            ['event_date' => '2026-03-13', 'display_order' => 1, 'status' => 'planned', 'memo' => '在宅から外出に変更', 'source_outfit_index' => 4, 'items' => [['item_index' => 10, 'item_source_type' => 'manual']]],
            ['event_date' => '2026-03-12', 'display_order' => 1, 'status' => 'worn', 'memo' => '通院の帰りに記録', 'source_outfit_index' => null, 'items' => [['item_index' => 11, 'item_source_type' => 'manual']]],
        ];

        foreach ($definitions as $definition) {
            $sourceOutfit = is_int($definition['source_outfit_index'])
                ? $outfits->get($definition['source_outfit_index'])
                : null;

            $wearLog = WearLog::query()->create([
                'user_id' => $user->id,
                'status' => $definition['status'],
                'event_date' => $definition['event_date'],
                'display_order' => $definition['display_order'],
                'source_outfit_id' => $sourceOutfit?->id,
                'memo' => $definition['memo'],
            ]);

            $wearLog->wearLogItems()->createMany(
                $this->buildIndexedWearLogItemsPayload(
                    $definition['items'],
                    $items,
                    $sourceOutfit
                ),
            );
        }
    }

    private function buildNamedWearLogItemsPayload(array $definitionItems, $items, ?Outfit $sourceOutfit): array
    {
        if ($definitionItems !== []) {
            return collect($definitionItems)
                ->map(function (array $item, int $index) use ($items) {
                    return [
                        'source_item_id' => $items->get($item['name'])?->id,
                        'item_source_type' => $item['item_source_type'],
                        'sort_order' => $index + 1,
                    ];
                })
                ->filter(fn (array $item) => $item['source_item_id'] !== null)
                ->values()
                ->all();
        }

        return $this->buildOutfitDerivedWearLogItemsPayload($sourceOutfit);
    }

    private function buildIndexedWearLogItemsPayload(array $definitionItems, $items, ?Outfit $sourceOutfit): array
    {
        if ($definitionItems !== []) {
            return collect($definitionItems)
                ->map(function (array $item, int $index) use ($items) {
                    return [
                        'source_item_id' => $items->get($item['item_index'])?->id,
                        'item_source_type' => $item['item_source_type'],
                        'sort_order' => $index + 1,
                    ];
                })
                ->filter(fn (array $item) => $item['source_item_id'] !== null)
                ->values()
                ->all();
        }

        return $this->buildOutfitDerivedWearLogItemsPayload($sourceOutfit);
    }

    private function buildOutfitDerivedWearLogItemsPayload(?Outfit $sourceOutfit): array
    {
        if ($sourceOutfit === null) {
            return [];
        }

        return $sourceOutfit->outfitItems()
            ->orderBy('sort_order')
            ->get(['item_id', 'sort_order'])
            ->map(fn ($outfitItem) => [
                'source_item_id' => $outfitItem->item_id,
                'item_source_type' => 'outfit',
                'sort_order' => $outfitItem->sort_order,
            ])
            ->values()
            ->all();
    }
}
