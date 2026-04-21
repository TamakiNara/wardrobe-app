<?php

namespace App\Services\PurchaseCandidates;

use App\Models\CategoryMaster;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateGroup;
use App\Models\PurchaseCandidateImage;
use App\Models\User;
use App\Services\Brands\UserBrandService;
use App\Support\ItemSpecNormalizer;
use App\Support\PurchaseCandidateCategoryMap;
use App\Support\PurchaseCandidateGroupSupport;
use App\Support\PurchaseCandidateMaterialSync;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PurchaseCandidateService
{
    public function __construct(
        private readonly UserBrandService $userBrandService,
    ) {}

    public function store(User $user, array $validated): PurchaseCandidate
    {
        $this->validatePayload($validated);
        $copiedFiles = [];

        try {
            return DB::transaction(function () use ($user, $validated, &$copiedFiles) {
                $colorVariantGroup = $this->resolveColorVariantGroupForCreate($user, $validated);

                $candidate = PurchaseCandidate::query()->create([
                    'user_id' => $user->id,
                    'group_id' => $colorVariantGroup?->id,
                    'group_order' => $colorVariantGroup?->nextGroupOrder(),
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
                    'size_details' => $validated['size_details'] ?? null,
                    'spec' => $this->normalizeSpec($validated),
                    'is_rain_ok' => (bool) ($validated['is_rain_ok'] ?? false),
                ]);

                $this->syncAttributes($candidate, $validated);
                $this->copyDuplicateImagesFromSources(
                    $candidate,
                    $user,
                    $validated['duplicate_images'] ?? [],
                    $copiedFiles,
                );
                $this->userBrandService->saveBrandFromItem(
                    $user,
                    $validated['brand_name'] ?? null,
                    (bool) ($validated['save_brand_as_candidate'] ?? false),
                );

                return $candidate->fresh()->load(['category', 'colors', 'seasons', 'tpos', 'images', 'materials']);
            });
        } catch (\Throwable $exception) {
            $this->cleanupCopiedImages($copiedFiles);
            throw $exception;
        }
    }

    public function update(User $user, int $candidateId, array $validated): PurchaseCandidate
    {
        $candidate = $this->findOwnedCandidate($user, $candidateId);

        if ($candidate->status === 'purchased') {
            return DB::transaction(function () use ($candidate, $validated) {
                $candidate->update([
                    'priority' => $validated['priority'] ?? $candidate->priority,
                    'sale_price' => array_key_exists('sale_price', $validated) ? $validated['sale_price'] : $candidate->sale_price,
                    'sale_ends_at' => array_key_exists('sale_ends_at', $validated) ? $validated['sale_ends_at'] : $candidate->sale_ends_at,
                    'purchase_url' => array_key_exists('purchase_url', $validated) ? $validated['purchase_url'] : $candidate->purchase_url,
                    'memo' => array_key_exists('memo', $validated) ? $validated['memo'] : $candidate->memo,
                    'wanted_reason' => array_key_exists('wanted_reason', $validated) ? $validated['wanted_reason'] : $candidate->wanted_reason,
                ]);

                return $candidate->fresh()->load(['category', 'colors', 'seasons', 'tpos', 'images', 'materials']);
            });
        }

        $this->validatePayload($validated);

        return DB::transaction(function () use ($user, $candidate, $validated) {
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
                'size_details' => $validated['size_details'] ?? null,
                'spec' => $this->normalizeSpec($validated),
                'is_rain_ok' => (bool) ($validated['is_rain_ok'] ?? false),
            ]);

            $candidate->colors()->delete();
            $candidate->seasons()->delete();
            $candidate->tpos()->delete();
            $this->syncAttributes($candidate, $validated);
            $this->userBrandService->saveBrandFromItem(
                $user,
                $validated['brand_name'] ?? null,
                (bool) ($validated['save_brand_as_candidate'] ?? false),
            );

            return $candidate->fresh()->load(['category', 'colors', 'seasons', 'tpos', 'images', 'materials']);
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

    public function duplicate(User $user, int $candidateId): array
    {
        $sourceCandidate = $this->findOwnedCandidate($user, $candidateId);

        return \App\Support\PurchaseCandidatePayloadBuilder::buildDuplicateDraft(
            $sourceCandidate,
            $this->buildDuplicateName($sourceCandidate->name),
        );
    }

    public function colorVariant(User $user, int $candidateId): array
    {
        $sourceCandidate = $this->findOwnedCandidate($user, $candidateId);

        return \App\Support\PurchaseCandidatePayloadBuilder::buildColorVariantDraft($sourceCandidate);
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
            ->with(['category', 'colors', 'seasons', 'tpos', 'images', 'materials'])
            ->findOrFail($candidateId);
    }

    public function buildItemDraft(User $user, int $candidateId): array
    {
        $candidate = $this->findOwnedCandidate($user, $candidateId);

        if ($candidate->status === 'purchased') {
            throw ValidationException::withMessages([
                'status' => '購入済みの購入検討からはアイテム作成初期値を生成できません。',
            ]);
        }

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
                    'custom_label' => $this->normalizeMainColorCustomLabel($color),
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

        PurchaseCandidateMaterialSync::sync($candidate, $validated['materials'] ?? []);
    }

    private function normalizeMainColorCustomLabel(array $color): ?string
    {
        if (($color['role'] ?? null) !== 'main') {
            return null;
        }

        $customLabel = trim((string) ($color['custom_label'] ?? ''));

        return $customLabel === '' ? null : $customLabel;
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

    private function normalizeSpec(array $validated): ?array
    {
        if (! array_key_exists('spec', $validated)) {
            return null;
        }

        $resolvedCategory = PurchaseCandidateCategoryMap::resolveItemDraftCategory($validated['category_id']);
        $itemCategory = $resolvedCategory['category'] ?? null;

        if (! in_array($itemCategory, ['tops', 'pants', 'legwear'], true)) {
            return null;
        }

        return ItemSpecNormalizer::normalize(
            $itemCategory,
            $resolvedCategory['shape'] ?? null,
            $validated['spec'] ?? null,
            $resolvedCategory['subcategory'] ?? null,
        );
    }

    private function resolveColorVariantGroupForCreate(User $user, array $validated): ?PurchaseCandidateGroup
    {
        if (($validated['variant_source_candidate_id'] ?? null) === null) {
            return null;
        }

        $sourceCandidate = PurchaseCandidate::query()
            ->where('user_id', $user->id)
            ->lockForUpdate()
            ->find((int) $validated['variant_source_candidate_id']);

        if ($sourceCandidate === null) {
            throw ValidationException::withMessages([
                'variant_source_candidate_id' => 'Selected source candidate does not belong to the current user.',
            ]);
        }

        if ($sourceCandidate->group_id === null) {
            $group = PurchaseCandidateGroup::query()->create([
                'user_id' => $user->id,
            ]);

            $sourceCandidate->forceFill([
                'group_id' => $group->id,
                'group_order' => 1,
            ])->save();

            return $group;
        }

        $group = PurchaseCandidateGroup::query()
            ->where('user_id', $user->id)
            ->lockForUpdate()
            ->find($sourceCandidate->group_id);

        if ($group === null) {
            throw ValidationException::withMessages([
                'variant_source_candidate_id' => 'Selected source candidate group does not belong to the current user.',
            ]);
        }

        PurchaseCandidateGroupSupport::ensureGroupBelongsToCandidateUser($group, $sourceCandidate);

        if ($sourceCandidate->group_order === null) {
            $sourceCandidate->forceFill([
                'group_order' => $group->nextGroupOrder(),
            ])->save();
        }

        return $group;
    }

    private function copyDuplicateImagesFromSources(
        PurchaseCandidate $candidate,
        User $user,
        array $duplicateImages,
        array &$copiedFiles,
    ): void {
        if ($duplicateImages === []) {
            return;
        }

        $sourceImageIds = collect($duplicateImages)
            ->map(fn ($image) => is_array($image) ? (int) ($image['source_image_id'] ?? 0) : 0)
            ->filter(fn (int $imageId) => $imageId > 0)
            ->values();

        if ($sourceImageIds->isEmpty()) {
            return;
        }

        $sourceImages = PurchaseCandidateImage::query()
            ->whereIn('id', $sourceImageIds)
            ->whereHas('purchaseCandidate', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get()
            ->keyBy('id');

        if ($sourceImages->count() !== $sourceImageIds->unique()->count()) {
            throw ValidationException::withMessages([
                'duplicate_images' => '複製元画像が見つかりません。',
            ]);
        }

        $copiedImages = $sourceImageIds
            ->values()
            ->map(function (int $sourceImageId, int $index) use ($candidate, $sourceImages, &$copiedFiles) {
                /** @var PurchaseCandidateImage $sourceImage */
                $sourceImage = $sourceImages->get($sourceImageId);

                return [
                    'disk' => $sourceImage->disk,
                    'path' => $this->copyPurchaseCandidateImage($candidate, $sourceImage, $copiedFiles),
                    'original_filename' => $sourceImage->original_filename,
                    'mime_type' => $sourceImage->mime_type,
                    'file_size' => $sourceImage->file_size,
                    'sort_order' => $index + 1,
                    'is_primary' => $sourceImage->is_primary,
                ];
            })
            ->all();

        if ($copiedImages !== [] && ! collect($copiedImages)->contains('is_primary', true)) {
            $copiedImages[0]['is_primary'] = true;
        }

        $candidate->images()->createMany($copiedImages);
    }

    private function buildDuplicateName(?string $name): string
    {
        $baseName = $name ?? '';

        if ($baseName === '') {
            return '（コピー）';
        }

        if (str_ends_with($baseName, '（コピー）')) {
            return $baseName;
        }

        return $baseName.'（コピー）';
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
            $extension !== '' ? '.'.$extension : ''
        );

        $contents = $storage->get($image->path);
        if (! is_string($contents)) {
            throw ValidationException::withMessages([
                'images' => '複製元画像が読み込めません。',
            ]);
        }

        $storage->put($destinationPath, $contents);
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
