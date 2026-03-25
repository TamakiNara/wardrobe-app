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
use Illuminate\Support\Str;
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
                'sale_price' => $validated['sale_price'] ?? null,
                'sale_ends_at' => $validated['sale_ends_at'] ?? null,
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
                'sale_price' => $validated['sale_price'] ?? null,
                'sale_ends_at' => $validated['sale_ends_at'] ?? null,
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

    public function duplicate(User $user, int $candidateId): PurchaseCandidate
    {
        $sourceCandidate = $this->findOwnedCandidate($user, $candidateId);
        $copiedFiles = [];

        try {
            return DB::transaction(function () use ($sourceCandidate, &$copiedFiles) {
                $duplicatedCandidate = PurchaseCandidate::query()->create([
                    'user_id' => $sourceCandidate->user_id,
                    'status' => 'considering',
                    'priority' => $sourceCandidate->priority,
                    'name' => $sourceCandidate->name,
                    'category_id' => $sourceCandidate->category_id,
                    'brand_name' => $sourceCandidate->brand_name,
                    'price' => $sourceCandidate->price,
                    'sale_price' => $sourceCandidate->sale_price,
                    'sale_ends_at' => $sourceCandidate->sale_ends_at,
                    'purchase_url' => $sourceCandidate->purchase_url,
                    'memo' => $sourceCandidate->memo,
                    'wanted_reason' => $sourceCandidate->wanted_reason,
                    'size_gender' => $sourceCandidate->size_gender,
                    'size_label' => $sourceCandidate->size_label,
                    'size_note' => $sourceCandidate->size_note,
                    'is_rain_ok' => $sourceCandidate->is_rain_ok,
                    'converted_item_id' => null,
                    'converted_at' => null,
                ]);

                $duplicatedCandidate->colors()->createMany(
                    $sourceCandidate->colors
                        ->sortBy('sort_order')
                        ->values()
                        ->map(fn ($color) => [
                            'role' => $color->role,
                            'mode' => $color->mode,
                            'value' => $color->value,
                            'hex' => $color->hex,
                            'label' => $color->label,
                            'sort_order' => $color->sort_order,
                        ])
                        ->all()
                );

                $duplicatedCandidate->seasons()->createMany(
                    $sourceCandidate->seasons
                        ->sortBy('sort_order')
                        ->values()
                        ->map(fn ($season) => [
                            'season' => $season->season,
                            'sort_order' => $season->sort_order,
                        ])
                        ->all()
                );

                $duplicatedCandidate->tpos()->createMany(
                    $sourceCandidate->tpos
                        ->sortBy('sort_order')
                        ->values()
                        ->map(fn ($tpo) => [
                            'tpo' => $tpo->tpo,
                            'sort_order' => $tpo->sort_order,
                        ])
                        ->all()
                );

                $duplicatedCandidate->images()->createMany(
                    $sourceCandidate->images
                        ->sortBy('sort_order')
                        ->values()
                        ->map(function (PurchaseCandidateImage $image) use ($duplicatedCandidate, &$copiedFiles) {
                            return [
                                'disk' => $image->disk,
                                'path' => $this->copyPurchaseCandidateImage($duplicatedCandidate, $image, $copiedFiles),
                                'original_filename' => $image->original_filename,
                                'mime_type' => $image->mime_type,
                                'file_size' => $image->file_size,
                                'sort_order' => $image->sort_order,
                                'is_primary' => $image->is_primary,
                            ];
                        })
                        ->all()
                );

                return $duplicatedCandidate->fresh()->load(['category', 'colors', 'seasons', 'tpos', 'images']);
            });
        } catch (\Throwable $exception) {
            $this->cleanupCopiedImages($copiedFiles);
            throw $exception;
        }
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

    private function copyPurchaseCandidateImage(
        PurchaseCandidate $candidate,
        PurchaseCandidateImage $image,
        array &$copiedFiles,
    ): ?string {
        if ($image->disk === null || $image->path === null) {
            return $image->path;
        }

        $storage = Storage::disk($image->disk);
        if (! $storage->exists($image->path)) {
            throw ValidationException::withMessages([
                'images' => '複製元画像が見つかりません。',
            ]);
        }

        $extension = pathinfo($image->path, PATHINFO_EXTENSION);
        $destinationPath = sprintf(
            'purchase-candidates/%d/%s%s',
            $candidate->id,
            Str::uuid()->toString(),
            $extension !== '' ? '.' . $extension : ''
        );

        $storage->put($destinationPath, $storage->get($image->path));
        $copiedFiles[] = [
            'disk' => $image->disk,
            'path' => $destinationPath,
        ];

        return $destinationPath;
    }

    private function cleanupCopiedImages(array $copiedFiles): void
    {
        foreach ($copiedFiles as $file) {
            $disk = $file['disk'] ?? null;
            $path = $file['path'] ?? null;

            if ($disk === null || $path === null) {
                continue;
            }

            Storage::disk($disk)->delete($path);
        }
    }
}
