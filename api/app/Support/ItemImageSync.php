<?php

namespace App\Support;

use App\Models\Item;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ItemImageSync
{
    public static function sync(Item $item, array $images, ?array &$copiedFiles = null): void
    {
        $copiedFiles ??= [];
        $item->images()->delete();

        if ($images === []) {
            return;
        }

        $normalizedImages = self::normalizeImages($images);

        $item->images()->createMany(
            collect($normalizedImages)
                ->map(function (array $image) use ($item, &$copiedFiles) {
                    return [
                        'disk' => $image['disk'] ?? null,
                        'path' => self::resolveItemImagePath($item, $image, $copiedFiles),
                        'original_filename' => $image['original_filename'] ?? null,
                        'mime_type' => $image['mime_type'] ?? null,
                        'file_size' => $image['file_size'] ?? null,
                        'sort_order' => $image['sort_order'],
                        'is_primary' => $image['is_primary'],
                    ];
                })
                ->all()
        );
    }

    public static function cleanupCopied(array $copiedFiles): void
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

    private static function resolveItemImagePath(Item $item, array $image, array &$copiedFiles): ?string
    {
        $disk = $image['disk'] ?? null;
        $path = $image['path'] ?? null;

        if ($disk === null || $path === null) {
            return $path;
        }

        if (self::isOwnedItemPath($item, $path)) {
            return $path;
        }

        $storage = Storage::disk($disk);
        if (! $storage->exists($path)) {
            throw ValidationException::withMessages([
                'images' => '引き継ぎ元画像が見つかりません。',
            ]);
        }

        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $destinationPath = sprintf(
            'items/%d/%s%s',
            $item->id,
            Str::uuid()->toString(),
            $extension !== '' ? '.'.$extension : ''
        );

        $storage->put($destinationPath, $storage->get($path));
        $copiedFiles[] = [
            'disk' => $disk,
            'path' => $destinationPath,
        ];

        return $destinationPath;
    }

    private static function isOwnedItemPath(Item $item, string $path): bool
    {
        return str_starts_with($path, sprintf('items/%d/', $item->id));
    }

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
}
