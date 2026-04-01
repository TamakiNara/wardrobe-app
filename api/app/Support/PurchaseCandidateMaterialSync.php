<?php

namespace App\Support;

use App\Models\PurchaseCandidate;

class PurchaseCandidateMaterialSync
{
    /**
     * @param  array<int, array<string, mixed>>  $materials
     */
    public static function sync(PurchaseCandidate $candidate, array $materials): void
    {
        $normalized = ItemMaterialSupport::normalizeForStorage($materials);

        $candidate->materials()->delete();

        if ($normalized === []) {
            return;
        }

        $candidate->materials()->createMany($normalized);
    }
}
