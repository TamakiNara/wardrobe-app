<?php

namespace App\Services\ImportExport;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateGroup;
use App\Models\User;
use App\Models\WearLog;
use App\Services\Items\ItemStoreService;
use App\Services\PurchaseCandidates\PurchaseCandidateService;
use App\Services\Settings\UserTpoService;
use App\Support\ImportExportImageSupport;
use App\Support\ImportExportValidationSupport;
use App\Support\TpoSelectionResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ImportService
{
    public function __construct(
        private readonly ItemStoreService $itemStoreService,
        private readonly PurchaseCandidateService $purchaseCandidateService,
        private readonly UserTpoService $userTpoService,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *   items: array{total: int, visible: int},
     *   purchase_candidates: array{total: int},
     *   outfits: array{total: int, visible: int},
     *   wear_logs: array{total: int}
     * }
     */
    public function import(User $user, array $payload): array
    {
        $ownerUserId = data_get($payload, 'owner.user_id');

        if (! is_int($ownerUserId) || $ownerUserId !== $user->id) {
            throw ValidationException::withMessages([
                'owner.user_id' => 'このバックアップファイルは作成したユーザー本人のみ復元できます。',
            ]);
        }

        $validatedItems = $this->validateCollectionPayloads(
            $payload['items'] ?? [],
            'items',
            'アイテム',
            fn ($item) => ImportExportValidationSupport::validateItemPayload((array) $item),
        );
        $validatedCandidates = $this->validateCollectionPayloads(
            $payload['purchase_candidates'] ?? [],
            'purchase_candidates',
            '購入検討',
            fn ($candidate) => ImportExportValidationSupport::validatePurchaseCandidatePayload((array) $candidate),
        );
        $validatedOutfits = $this->validateCollectionPayloads(
            $payload['outfits'] ?? [],
            'outfits',
            'コーディネート',
            fn ($outfit) => ImportExportValidationSupport::validateOutfitPayload((array) $outfit),
        );
        $validatedWearLogs = $this->validateCollectionPayloads(
            $payload['wear_logs'] ?? [],
            'wear_logs',
            '着用履歴',
            fn ($wearLog) => ImportExportValidationSupport::validateWearLogPayload((array) $wearLog),
        );

        $existingItemFiles = ImportExportImageSupport::collectStoredFiles(
            Item::query()->where('user_id', $user->id)->with('images')->get()->pluck('images')->flatten()
        );
        $existingCandidateFiles = ImportExportImageSupport::collectStoredFiles(
            PurchaseCandidate::query()->where('user_id', $user->id)->with('images')->get()->pluck('images')->flatten()
        );

        $createdFiles = [];

        try {
            $counts = DB::transaction(function () use (
                $user,
                $validatedItems,
                $validatedCandidates,
                $validatedOutfits,
                $validatedWearLogs,
                &$createdFiles,
            ) {
                WearLog::query()->where('user_id', $user->id)->delete();
                Outfit::query()->where('user_id', $user->id)->delete();
                PurchaseCandidate::query()->where('user_id', $user->id)->delete();
                PurchaseCandidateGroup::query()->where('user_id', $user->id)->delete();
                Item::query()->where('user_id', $user->id)->delete();

                $itemIdMap = [];
                foreach ($validatedItems as $itemPayload) {
                    $item = $this->itemStoreService->store($user, array_merge($itemPayload, [
                        'images' => [],
                    ]));

                    if (($itemPayload['status'] ?? 'active') !== 'active') {
                        $item->forceFill([
                            'status' => $itemPayload['status'],
                        ])->save();
                    }

                    ImportExportImageSupport::restoreItemImages(
                        $item,
                        is_array($itemPayload['images'] ?? null) ? $itemPayload['images'] : [],
                        $createdFiles,
                    );

                    $itemIdMap[(int) ($itemPayload['id'] ?? $item->id)] = $item->id;
                }

                $groupIdMap = [];
                foreach ($validatedCandidates as $candidatePayload) {
                    $candidate = $this->purchaseCandidateService->store($user, array_merge($candidatePayload, [
                        'duplicate_images' => [],
                    ]));

                    $oldGroupId = $candidatePayload['group_id'] ?? null;
                    $newGroupId = null;
                    if (is_int($oldGroupId)) {
                        if (! array_key_exists($oldGroupId, $groupIdMap)) {
                            $groupIdMap[$oldGroupId] = PurchaseCandidateGroup::query()->create([
                                'user_id' => $user->id,
                            ])->id;
                        }

                        $newGroupId = $groupIdMap[$oldGroupId];
                    }

                    $newConvertedItemId = null;
                    if (is_int($candidatePayload['converted_item_id'] ?? null)) {
                        $newConvertedItemId = $itemIdMap[$candidatePayload['converted_item_id']] ?? null;
                    }

                    $candidate->forceFill([
                        'group_id' => $newGroupId,
                        'group_order' => $candidatePayload['group_order'] ?? null,
                        'converted_item_id' => $newConvertedItemId,
                        'converted_at' => $candidatePayload['converted_at'] ?? null,
                    ])->save();

                    ImportExportImageSupport::restorePurchaseCandidateImages(
                        $candidate,
                        is_array($candidatePayload['images'] ?? null) ? $candidatePayload['images'] : [],
                        $createdFiles,
                    );
                }

                $outfitIdMap = [];
                foreach ($validatedOutfits as $outfitPayload) {
                    $mappedItems = collect($outfitPayload['outfit_items'])
                        ->map(function (array $outfitItem) use ($itemIdMap) {
                            return [
                                'item_id' => $itemIdMap[$outfitItem['item_id']] ?? null,
                                'sort_order' => $outfitItem['sort_order'],
                            ];
                        })
                        ->all();

                    if (collect($mappedItems)->contains(fn (array $item) => ! is_int($item['item_id']))) {
                        throw ValidationException::withMessages([
                            'outfits' => '復元対象に存在しないアイテムを参照するコーディネートは復元できません。',
                        ]);
                    }

                    $outfit = Outfit::query()->create([
                        'user_id' => $user->id,
                        'status' => $outfitPayload['status'] ?? 'active',
                        'name' => $outfitPayload['name'] ?? null,
                        'memo' => $outfitPayload['memo'] ?? null,
                        'seasons' => $outfitPayload['seasons'] ?? [],
                        'tpo_ids' => TpoSelectionResolver::resolve(
                            $this->userTpoService,
                            $user,
                            [
                                'tpo_ids' => $outfitPayload['tpo_ids'] ?? [],
                                'tpos' => $outfitPayload['tpos'] ?? [],
                            ],
                        ),
                    ]);

                    $outfit->outfitItems()->createMany($mappedItems);
                    $outfitIdMap[(int) ($outfitPayload['id'] ?? $outfit->id)] = $outfit->id;
                }

                foreach ($validatedWearLogs as $wearLogPayload) {
                    $mappedSourceOutfitId = null;
                    if (is_int($wearLogPayload['source_outfit_id'] ?? null)) {
                        $mappedSourceOutfitId = $outfitIdMap[$wearLogPayload['source_outfit_id']] ?? null;

                        if (! is_int($mappedSourceOutfitId)) {
                            throw ValidationException::withMessages([
                                'wear_logs' => '復元対象に存在しないコーディネートを参照する着用履歴は復元できません。',
                            ]);
                        }
                    }

                    $mappedItems = collect($wearLogPayload['items'] ?? [])
                        ->map(function (array $wearLogItem) use ($itemIdMap) {
                            $originalSourceItemId = $wearLogItem['source_item_id'] ?? null;
                            $mappedSourceItemId = null;

                            if (is_int($originalSourceItemId)) {
                                $mappedSourceItemId = $itemIdMap[$originalSourceItemId] ?? null;
                            }

                            return [
                                'original_source_item_id' => $originalSourceItemId,
                                'source_item_id' => $mappedSourceItemId,
                                'item_source_type' => $wearLogItem['item_source_type'],
                                'sort_order' => $wearLogItem['sort_order'],
                            ];
                        })
                        ->all();

                    if (collect($mappedItems)->contains(
                        fn (array $item) => is_int($item['original_source_item_id']) && ! is_int($item['source_item_id'])
                    )) {
                        throw ValidationException::withMessages([
                            'wear_logs' => '復元対象に存在しないアイテムを参照する着用履歴は復元できません。',
                        ]);
                    }

                    $wearLog = WearLog::query()->create([
                        'user_id' => $user->id,
                        'status' => $wearLogPayload['status'],
                        'event_date' => $wearLogPayload['event_date'],
                        'display_order' => $wearLogPayload['display_order'],
                        'source_outfit_id' => $mappedSourceOutfitId,
                        'memo' => $wearLogPayload['memo'] ?? null,
                        'outdoor_temperature_feel' => $wearLogPayload['outdoor_temperature_feel'] ?? null,
                        'indoor_temperature_feel' => $wearLogPayload['indoor_temperature_feel'] ?? null,
                        'overall_rating' => $wearLogPayload['overall_rating'] ?? null,
                        'feedback_tags' => $wearLogPayload['feedback_tags'] ?? null,
                        'feedback_memo' => $wearLogPayload['feedback_memo'] ?? null,
                    ]);

                    if ($mappedItems !== []) {
                        $wearLog->wearLogItems()->createMany(
                            array_map(
                                static fn (array $item): array => [
                                    'source_item_id' => $item['source_item_id'],
                                    'item_source_type' => $item['item_source_type'],
                                    'sort_order' => $item['sort_order'],
                                ],
                                $mappedItems
                            )
                        );
                    }
                }

                return [
                    'items' => [
                        'total' => count($validatedItems),
                        'visible' => collect($validatedItems)
                            ->where('status', 'active')
                            ->count(),
                    ],
                    'purchase_candidates' => [
                        'total' => count($validatedCandidates),
                    ],
                    'outfits' => [
                        'total' => count($validatedOutfits),
                        'visible' => collect($validatedOutfits)
                            ->where('status', 'active')
                            ->count(),
                    ],
                    'wear_logs' => [
                        'total' => count($validatedWearLogs),
                    ],
                ];
            });
        } catch (\Throwable $exception) {
            ImportExportImageSupport::deleteStoredFiles($createdFiles);
            throw $exception;
        }

        ImportExportImageSupport::deleteStoredFiles([
            ...$existingItemFiles,
            ...$existingCandidateFiles,
        ]);

        return $counts;
    }

    /**
     * @param  callable(array<string, mixed>): array<string, mixed>  $validator
     * @return array<int, array<string, mixed>>
     */
    private function validateCollectionPayloads(
        mixed $payloads,
        string $payloadKey,
        string $entityLabel,
        callable $validator,
    ): array {
        $validated = [];

        foreach (collect($payloads)->values() as $index => $payload) {
            try {
                $validated[] = $validator((array) $payload);
            } catch (ValidationException $exception) {
                $messages = [];

                foreach ($exception->errors() as $field => $fieldMessages) {
                    $fieldLabel = $this->fieldLabel($field);

                    foreach ((array) $fieldMessages as $message) {
                        $messages[sprintf('%s.%d.%s', $payloadKey, $index, $field)][] =
                            sprintf('%sの%d件目の%sでエラーが発生しました: %s', $entityLabel, $index + 1, $fieldLabel, $message);
                    }
                }

                throw ValidationException::withMessages($messages);
            }
        }

        return $validated;
    }

    private function fieldLabel(string $field): string
    {
        return match ($field) {
            'subcategory', 'category_id' => '種類',
            'shape' => '形',
            'spec.tops.sleeve' => '仕様・属性（袖丈）',
            'spec.tops.length' => '仕様・属性（丈）',
            'spec.tops.neck' => '仕様・属性（首まわり）',
            'spec.tops.design' => '仕様・属性（デザイン）',
            'spec.tops.fit' => '仕様・属性（フィット）',
            'spec.bottoms.length_type' => '仕様・属性（ボトムス丈）',
            'spec.bottoms.rise_type' => '仕様・属性（股上）',
            'spec.skirt.length_type' => '仕様・属性（スカート丈）',
            'spec.skirt.material_type' => '仕様・属性（スカート素材）',
            'spec.skirt.design_type' => '仕様・属性（スカートデザイン）',
            'spec.legwear.coverage_type' => '仕様・属性（レッグウェア丈）',
            'source_outfit_id' => '参照コーディネート',
            'items' => '着用アイテム',
            'items.present' => '着用アイテム',
            'items.*.source_item_id' => '参照アイテム',
            'items.*.sort_order' => '表示順',
            'items.*.item_source_type' => 'アイテム取得元',
            'display_order' => '表示順',
            'event_date' => '着用日',
            'owner.user_id' => 'バックアップ所有者',
            default => $field,
        };
    }
}
