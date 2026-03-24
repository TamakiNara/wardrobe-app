<?php

namespace App\Services\PurchaseCandidates;

use App\Models\CategoryMaster;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateImage;
use App\Models\User;
use App\Support\PurchaseCandidateCategoryMap;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PurchaseCandidateService
{
    public function store(User $user, array $validated): PurchaseCandidate
    {
        $this->validatePayload($validated);

        return DB::transaction(function () use ($user, $validated) {
            $candidate = PurchaseCandidate::query()->create([
                'user_id' => $user->id,
                'status' => $validated['status'] ?? 'considering',
                'priority' => $validated['priority'] ?? 'medium',
                'name' => $validated['name'],
                'category_id' => $validated['category_id'],
                'brand_name' => $validated['brand_name'] ?? null,
                'price' => $validated['price'] ?? null,
                'purchase_url' => $validated['purchase_url'] ?? null,
                'memo' => $validated['memo'] ?? null,
                'wanted_reason' => $validated['wanted_reason'] ?? null,
                'size_gender' => $validated['size_gender'] ?? null,
                'size_label' => $validated['size_label'] ?? null,
                'size_note' => $validated['size_note'] ?? null,
                'is_rain_ok' => (bool) ($validated['is_rain_ok'] ?? false),
            ]);

            $this->syncAttributes($candidate, $validated);

            return $candidate->fresh()->load(['category', 'colors', 'seasons', 'tpos', 'images']);
        });
    }

    public function update(User $user, int $candidateId, array $validated): PurchaseCandidate
    {
        $candidate = $this->findOwnedCandidate($user, $candidateId);
        $this->validatePayload($validated);

        return DB::transaction(function () use ($candidate, $validated) {
            $candidate->update([
                'status' => $validated['status'] ?? 'considering',
                'priority' => $validated['priority'] ?? 'medium',
                'name' => $validated['name'],
                'category_id' => $validated['category_id'],
                'brand_name' => $validated['brand_name'] ?? null,
                'price' => $validated['price'] ?? null,
                'purchase_url' => $validated['purchase_url'] ?? null,
                'memo' => $validated['memo'] ?? null,
                'wanted_reason' => $validated['wanted_reason'] ?? null,
                'size_gender' => $validated['size_gender'] ?? null,
                'size_label' => $validated['size_label'] ?? null,
                'size_note' => $validated['size_note'] ?? null,
                'is_rain_ok' => (bool) ($validated['is_rain_ok'] ?? false),
            ]);

            $candidate->colors()->delete();
            $candidate->seasons()->delete();
            $candidate->tpos()->delete();
            $this->syncAttributes($candidate, $validated);

            return $candidate->fresh()->load(['category', 'colors', 'seasons', 'tpos', 'images']);
        });
    }

    public function delete(User $user, int $candidateId): void
    {
        $candidate = $this->findOwnedCandidate($user, $candidateId);

        DB::transaction(function () use ($candidate) {
            $images = $candidate->images()->get();
            foreach ($images as $image) {
                $this->deleteStoredImage($image);
            }

            $candidate->delete();
        });
    }

    public function addImage(User $user, int $candidateId, UploadedFile $image, ?int $sortOrder = null, ?bool $isPrimary = null): PurchaseCandidateImage
    {
        $candidate = $this->findOwnedCandidate($user, $candidateId);

        return DB::transaction(function () use ($candidate, $image, $sortOrder, $isPrimary) {
            $existingImages = $candidate->images()->orderBy('sort_order')->get();

            if ($existingImages->count() >= 5) {
                throw ValidationException::withMessages([
                    'image' => '画像は5枚まで登録できます。',
                ]);
            }

            $nextSortOrder = $sortOrder ?? (($existingImages->max('sort_order') ?? 0) + 1);
            $shouldBePrimary = $isPrimary ?? $existingImages->isEmpty();
            $storedPath = $image->store(sprintf('purchase-candidates/%d', $candidate->id), 'public');

            if ($shouldBePrimary) {
                $candidate->images()->update(['is_primary' => false]);
            }

            return $candidate->images()->create([
                'disk' => 'public',
                'path' => $storedPath,
                'original_filename' => $image->getClientOriginalName(),
                'mime_type' => $image->getMimeType(),
                'file_size' => $image->getSize(),
                'sort_order' => $nextSortOrder,
                'is_primary' => $shouldBePrimary,
            ]);
        });
    }

    public function deleteImage(User $user, int $candidateId, int $imageId): void
    {
        $candidate = $this->findOwnedCandidate($user, $candidateId);
        $image = $candidate->images()->where('id', $imageId)->firstOrFail();

        DB::transaction(function () use ($candidate, $image) {
            $wasPrimary = $image->is_primary;
            $this->deleteStoredImage($image);
            $image->delete();

            if ($wasPrimary) {
                $nextPrimary = $candidate->images()->orderBy('sort_order')->first();
                if ($nextPrimary !== null) {
                    $nextPrimary->forceFill(['is_primary' => true])->save();
                }
            }
        });
    }

    public function findOwnedCandidate(User $user, int $candidateId): PurchaseCandidate
    {
        return PurchaseCandidate::query()
            ->where('user_id', $user->id)
            ->with(['category', 'colors', 'seasons', 'tpos', 'images'])
            ->findOrFail($candidateId);
    }

    public function buildItemDraft(User $user, int $candidateId): array
    {
        $candidate = $this->findOwnedCandidate($user, $candidateId);
        $draft = \App\Support\PurchaseCandidatePayloadBuilder::buildItemDraft($candidate);

        if ($draft === []) {
            throw ValidationException::withMessages([
                'category_id' => 'item-draft を生成できないカテゴリです。',
            ]);
        }

        return [
            'message' => 'item_draft_ready',
            'item_draft' => $draft,
            'candidate_summary' => \App\Support\PurchaseCandidatePayloadBuilder::buildCandidateSummary($candidate),
            'images' => $candidate->images
                ->sortBy('sort_order')
                ->values()
                ->map(fn (PurchaseCandidateImage $image) => \App\Support\PurchaseCandidatePayloadBuilder::buildImage($image))
                ->all(),
        ];
    }

    private function syncAttributes(PurchaseCandidate $candidate, array $validated): void
    {
        $candidate->colors()->createMany(
            collect($validated['colors'] ?? [])->values()->map(function (array $color, int $index) {
                return [
                    'role' => $color['role'],
                    'mode' => $color['mode'],
                    'value' => $color['value'],
                    'hex' => $color['hex'],
                    'label' => $color['label'],
                    'sort_order' => $index + 1,
                ];
            })->all()
        );

        $candidate->seasons()->createMany(
            collect($validated['seasons'] ?? [])->values()->map(function (string $season, int $index) {
                return [
                    'season' => $season,
                    'sort_order' => $index + 1,
                ];
            })->all()
        );

        $candidate->tpos()->createMany(
            collect($validated['tpos'] ?? [])->values()->map(function (string $tpo, int $index) {
                return [
                    'tpo' => $tpo,
                    'sort_order' => $index + 1,
                ];
            })->all()
        );
    }

    private function validatePayload(array $validated): void
    {
        $category = CategoryMaster::query()
            ->where('id', $validated['category_id'])
            ->where('is_active', true)
            ->first();

        if ($category === null) {
            throw ValidationException::withMessages([
                'category_id' => '無効なカテゴリです。',
            ]);
        }

        if (PurchaseCandidateCategoryMap::resolveItemDraftCategory($validated['category_id']) === null) {
            throw ValidationException::withMessages([
                'category_id' => 'このカテゴリはまだ購入候補に対応していません。',
            ]);
        }
    }

    private function deleteStoredImage(PurchaseCandidateImage $image): void
    {
        if ($image->disk && $image->path) {
            Storage::disk($image->disk)->delete($image->path);
        }
    }
}
