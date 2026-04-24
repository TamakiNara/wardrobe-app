<?php

namespace App\Services\ImportExport;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateGroup;
use App\Models\User;
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
     * @return array<string, int>
     */
    public function import(User $user, array $payload): array
    {
        $ownerUserId = data_get($payload, 'owner.user_id');

        if (! is_int($ownerUserId) || $ownerUserId !== $user->id) {
            throw ValidationException::withMessages([
                'owner.user_id' => 'このバックアップファイルは作成したユーザー本人のみ復元できます。',
            ]);
        }

        $validatedItems = collect($payload['items'] ?? [])
            ->map(fn ($item) => ImportExportValidationSupport::validateItemPayload((array) $item))
            ->all();
        $validatedCandidates = collect($payload['purchase_candidates'] ?? [])
            ->map(fn ($candidate) => ImportExportValidationSupport::validatePurchaseCandidatePayload((array) $candidate))
            ->all();
        $validatedOutfits = collect($payload['outfits'] ?? [])
            ->map(fn ($outfit) => ImportExportValidationSupport::validateOutfitPayload((array) $outfit))
            ->all();

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
                &$createdFiles,
            ) {
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
                $purchaseCandidateIdMap = [];
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

                    $purchaseCandidateIdMap[(int) ($candidatePayload['id'] ?? $candidate->id)] = $candidate->id;
                }

                foreach ($validatedOutfits as $outfitPayload) {
                    $mappedItems = collect($outfitPayload['outfit_items'])
                        ->map(function ($outfitItem) use ($itemIdMap) {
                            return [
                                'item_id' => $itemIdMap[$outfitItem['item_id']] ?? null,
                                'sort_order' => $outfitItem['sort_order'],
                            ];
                        })
                        ->all();

                    if (collect($mappedItems)->contains(fn (array $item) => ! is_int($item['item_id']))) {
                        throw ValidationException::withMessages([
                            'outfits' => '存在しない item を参照する outfit は復元できません。',
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
                }

                return [
                    'items' => count($validatedItems),
                    'purchase_candidates' => count($validatedCandidates),
                    'outfits' => count($validatedOutfits),
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
}
