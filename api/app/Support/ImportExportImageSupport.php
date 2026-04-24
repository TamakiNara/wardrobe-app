<?php

namespace App\Support;

use App\Models\Item;
use App\Models\ItemImage;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateImage;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ImportExportImageSupport
{
    /**
     * @param  Collection<int, ItemImage|PurchaseCandidateImage>|array<int, ItemImage|PurchaseCandidateImage>  $images
     * @return array<int, array<string, mixed>>
     */
    public static function buildExportPayload(Collection|array $images): array
    {
        return collect($images)
            ->sortBy('sort_order')
            ->values()
            ->map(function (ItemImage|PurchaseCandidateImage $image) {
                return [
                    'disk' => $image->disk,
                    'original_filename' => $image->original_filename,
                    'mime_type' => $image->mime_type,
                    'file_size' => $image->file_size,
                    'sort_order' => $image->sort_order,
                    'is_primary' => $image->is_primary,
                    'content_base64' => self::readAsBase64($image->disk, $image->path),
                ];
            })
            ->all();
    }

    /**
     * @param  Collection<int, ItemImage|PurchaseCandidateImage>|array<int, ItemImage|PurchaseCandidateImage>  $images
     * @return array<int, array{disk:string, path:string}>
     */
    public static function collectStoredFiles(Collection|array $images): array
    {
        return collect($images)
            ->map(function (ItemImage|PurchaseCandidateImage $image) {
                if (! is_string($image->disk) || ! is_string($image->path)) {
                    return null;
                }

                return [
                    'disk' => $image->disk,
                    'path' => $image->path,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $images
     * @param  array<int, array{disk:string, path:string}>  $createdFiles
     */
    public static function restoreItemImages(Item $item, array $images, array &$createdFiles): void
    {
        $normalizedImages = self::normalizeImages($images);

        foreach ($normalizedImages as $image) {
            [$disk, $path, $fileSize] = self::storeDecodedImage(
                'items',
                $item->id,
                $image,
                $createdFiles,
            );

            $item->images()->create([
                'disk' => $disk,
                'path' => $path,
                'original_filename' => $image['original_filename'] ?? null,
                'mime_type' => $image['mime_type'] ?? null,
                'file_size' => $fileSize,
                'sort_order' => $image['sort_order'],
                'is_primary' => $image['is_primary'],
            ]);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $images
     * @param  array<int, array{disk:string, path:string}>  $createdFiles
     */
    public static function restorePurchaseCandidateImages(PurchaseCandidate $candidate, array $images, array &$createdFiles): void
    {
        $normalizedImages = self::normalizeImages($images);

        foreach ($normalizedImages as $image) {
            [$disk, $path, $fileSize] = self::storeDecodedImage(
                'purchase-candidates',
                $candidate->id,
                $image,
                $createdFiles,
            );

            $candidate->images()->create([
                'disk' => $disk,
                'path' => $path,
                'original_filename' => $image['original_filename'] ?? null,
                'mime_type' => $image['mime_type'] ?? null,
                'file_size' => $fileSize,
                'sort_order' => $image['sort_order'],
                'is_primary' => $image['is_primary'],
            ]);
        }
    }

    /**
     * @param  array<int, array{disk:string, path:string}>  $files
     */
    public static function deleteStoredFiles(array $files): void
    {
        foreach ($files as $file) {
            Storage::disk($file['disk'])->delete($file['path']);
        }
    }

    private static function readAsBase64(?string $disk, ?string $path): ?string
    {
        if (! is_string($disk) || ! is_string($path)) {
            return null;
        }

        $storage = Storage::disk($disk);
        if (! $storage->exists($path)) {
            return null;
        }

        return base64_encode($storage->get($path));
    }

    /**
     * @param  array<int, array<string, mixed>>  $images
     * @return array<int, array<string, mixed>>
     */
    private static function normalizeImages(array $images): array
    {
        $orderedImages = collect($images)
            ->sortBy(fn (array $image) => (int) ($image['sort_order'] ?? PHP_INT_MAX))
            ->values();

        $primaryIndex = $orderedImages->search(
            fn (array $image) => (bool) ($image['is_primary'] ?? false)
        );

        if (! is_int($primaryIndex)) {
            $primaryIndex = 0;
        }

        return $orderedImages
            ->map(function (array $image, int $index) use ($primaryIndex) {
                $image['sort_order'] = $index + 1;
                $image['is_primary'] = $index === $primaryIndex;

                return $image;
            })
            ->all();
    }

    /**
     * @param  array<string, mixed>  $image
     * @param  array<int, array{disk:string, path:string}>  $createdFiles
     * @return array{0:?string,1:?string,2:?int}
     */
    private static function storeDecodedImage(string $directory, int $entityId, array $image, array &$createdFiles): array
    {
        $disk = is_string($image['disk'] ?? null) ? $image['disk'] : 'public';
        $contentBase64 = $image['content_base64'] ?? null;

        if (! is_string($contentBase64) || $contentBase64 === '') {
            return [
                $disk,
                null,
                isset($image['file_size']) ? (int) $image['file_size'] : null,
            ];
        }

        $decoded = base64_decode($contentBase64, true);

        if ($decoded === false) {
            throw ValidationException::withMessages([
                'images' => '画像データの復元に失敗しました。',
            ]);
        }

        $extension = self::resolveExtension(
            is_string($image['original_filename'] ?? null) ? $image['original_filename'] : null,
            is_string($image['mime_type'] ?? null) ? $image['mime_type'] : null,
        );

        $path = sprintf(
            '%s/%d/%s%s',
            $directory,
            $entityId,
            Str::uuid()->toString(),
            $extension !== '' ? '.'.$extension : '',
        );

        Storage::disk($disk)->put($path, $decoded);
        $createdFiles[] = [
            'disk' => $disk,
            'path' => $path,
        ];

        return [
            $disk,
            $path,
            isset($image['file_size']) ? (int) $image['file_size'] : strlen($decoded),
        ];
    }

    private static function resolveExtension(?string $originalFilename, ?string $mimeType): string
    {
        $filenameExtension = $originalFilename !== null
            ? strtolower((string) pathinfo($originalFilename, PATHINFO_EXTENSION))
            : '';

        if ($filenameExtension !== '') {
            return $filenameExtension;
        }

        return match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => '',
        };
    }
}
