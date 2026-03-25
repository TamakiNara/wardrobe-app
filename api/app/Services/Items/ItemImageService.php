<?php

namespace App\Services\Items;

use App\Models\Item;
use App\Models\ItemImage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ItemImageService
{
    public function addImage(User $user, int $itemId, UploadedFile $image, ?int $sortOrder = null, ?bool $isPrimary = null): ItemImage
    {
        $item = $this->findOwnedItem($user, $itemId);

        return DB::transaction(function () use ($item, $image, $sortOrder, $isPrimary) {
            $existingImages = $item->images()->orderBy('sort_order')->get();

            if ($existingImages->count() >= 5) {
                throw ValidationException::withMessages([
                    'image' => '画像は5枚まで登録できます。',
                ]);
            }

            $nextSortOrder = $sortOrder ?? (($existingImages->max('sort_order') ?? 0) + 1);
            $shouldBePrimary = $isPrimary ?? $existingImages->isEmpty();
            $storedPath = $image->store(sprintf('items/%d', $item->id), 'public');

            if ($shouldBePrimary) {
                $item->images()->update(['is_primary' => false]);
            }

            return $item->images()->create([
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

    public function deleteImage(User $user, int $itemId, int $imageId): void
    {
        $item = $this->findOwnedItem($user, $itemId);
        $image = $item->images()->where('id', $imageId)->firstOrFail();

        DB::transaction(function () use ($item, $image) {
            $wasPrimary = $image->is_primary;
            $this->deleteStoredImage($image);
            $image->delete();

            $remainingImages = $item->images()->orderBy('sort_order')->get();

            foreach ($remainingImages as $index => $remainingImage) {
                $remainingImage->forceFill([
                    'sort_order' => $index + 1,
                ])->save();
            }

            if ($wasPrimary && $remainingImages->isNotEmpty()) {
                $remainingImages->first()->forceFill(['is_primary' => true])->save();
            }
        });
    }

    private function findOwnedItem(User $user, int $itemId): Item
    {
        return Item::query()
            ->where('user_id', $user->id)
            ->with('images')
            ->findOrFail($itemId);
    }

    private function deleteStoredImage(ItemImage $image): void
    {
        if ($image->disk !== null && $image->path !== null) {
            Storage::disk($image->disk)->delete($image->path);
        }
    }
}
