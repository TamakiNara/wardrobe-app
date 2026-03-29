<?php

namespace App\Services\Items;

use App\Models\Item;
use App\Models\PurchaseCandidate;
use App\Models\User;
use App\Services\Brands\UserBrandService;
use App\Services\Settings\UserTpoService;
use App\Support\ItemImageSync;
use App\Support\ItemSpecNormalizer;
use App\Support\TpoSelectionResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class ItemStoreService
{
    public function __construct(
        private readonly UserBrandService $userBrandService,
        private readonly UserTpoService $userTpoService,
    ) {}

    public function store(User $user, array $validated): Item
    {
        $candidate = $this->resolveCandidate($user, $validated['purchase_candidate_id'] ?? null);
        $copiedFiles = [];

        try {
            $item = DB::transaction(function () use ($user, $validated, $candidate, &$copiedFiles) {
                $item = Item::create([
                    'user_id' => $user->id,
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
                    'tpo_ids' => TpoSelectionResolver::resolve($this->userTpoService, $user, $validated),
                    'spec' => ItemSpecNormalizer::normalize(
                        $validated['category'] ?? null,
                        $validated['shape'] ?? null,
                        $validated['spec'] ?? null,
                    ),
                ]);

                ItemImageSync::sync($item, $validated['images'] ?? [], $copiedFiles);

                if ($candidate !== null) {
                    $candidate->forceFill([
                        'status' => 'purchased',
                        'converted_item_id' => $item->id,
                        'converted_at' => now(),
                    ])->save();
                }

                $this->userBrandService->saveBrandFromItem(
                    $user,
                    $validated['brand_name'] ?? null,
                    (bool) ($validated['save_brand_as_candidate'] ?? false),
                );

                return $item->fresh()->load(['images', 'user']);
            });
        } catch (Throwable $e) {
            ItemImageSync::cleanupCopied($copiedFiles);
            throw $e;
        }

        return $item;
    }

    private function resolveCandidate(User $user, ?int $candidateId): ?PurchaseCandidate
    {
        if ($candidateId === null) {
            return null;
        }

        $candidate = PurchaseCandidate::query()
            ->where('user_id', $user->id)
            ->find($candidateId);

        if ($candidate === null) {
            throw ValidationException::withMessages([
                'purchase_candidate_id' => '紐付け元の購入検討が見つかりません。',
            ]);
        }

        return $candidate;
    }
}
