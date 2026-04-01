<?php

namespace App\Services\Items;

use App\Models\Item;
use App\Models\User;
use App\Services\Brands\UserBrandService;
use App\Services\Settings\UserTpoService;
use App\Support\ItemImageSync;
use App\Support\ItemMaterialSync;
use App\Support\ItemSpecNormalizer;
use App\Support\TpoSelectionResolver;
use Illuminate\Support\Facades\DB;
use Throwable;

class ItemUpdateService
{
    public function __construct(
        private readonly UserBrandService $userBrandService,
        private readonly UserTpoService $userTpoService,
    ) {}

    public function update(User $user, Item $item, array $validated): Item
    {
        $copiedFiles = [];

        try {
            return DB::transaction(function () use ($user, $item, $validated, &$copiedFiles) {
                $item->update([
                    'care_status' => $validated['care_status'] ?? null,
                    'name' => $validated['name'] ?? null,
                    'brand_name' => $validated['brand_name'] ?? null,
                    'price' => $validated['price'] ?? null,
                    'purchase_url' => $validated['purchase_url'] ?? null,
                    'memo' => $validated['memo'] ?? null,
                    'purchased_at' => $validated['purchased_at'] ?? null,
                    'size_gender' => $validated['size_gender'] ?? null,
                    'size_label' => $validated['size_label'] ?? null,
                    'size_note' => $validated['size_note'] ?? null,
                    'size_details' => $validated['size_details'] ?? null,
                    'is_rain_ok' => (bool) ($validated['is_rain_ok'] ?? false),
                    'category' => $validated['category'],
                    'shape' => $validated['shape'],
                    'colors' => $validated['colors'],
                    'seasons' => $validated['seasons'] ?? [],
                    'tpo_ids' => TpoSelectionResolver::resolve(
                        $this->userTpoService,
                        $user,
                        $validated,
                        $item->tpo_ids ?? [],
                    ),
                    'spec' => ItemSpecNormalizer::normalize(
                        $validated['category'] ?? null,
                        $validated['shape'] ?? null,
                        $validated['spec'] ?? null,
                    ),
                ]);

                ItemImageSync::sync($item, $validated['images'] ?? [], $copiedFiles);
                ItemMaterialSync::sync($item, $validated['materials'] ?? []);
                $this->userBrandService->saveBrandFromItem(
                    $user,
                    $validated['brand_name'] ?? null,
                    (bool) ($validated['save_brand_as_candidate'] ?? false),
                );

                return $item->fresh()->load(['images', 'materials', 'user']);
            });
        } catch (Throwable $e) {
            ItemImageSync::cleanupCopied($copiedFiles);
            throw $e;
        }
    }
}
