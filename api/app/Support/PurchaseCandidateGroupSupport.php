<?php

namespace App\Support;

use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateGroup;
use Illuminate\Validation\ValidationException;

class PurchaseCandidateGroupSupport
{
    public static function ensureGroupBelongsToCandidateUser(
        ?PurchaseCandidateGroup $group,
        PurchaseCandidate $candidate,
    ): void {
        if ($group === null) {
            return;
        }

        if ((int) $group->user_id === (int) $candidate->user_id) {
            return;
        }

        throw ValidationException::withMessages([
            'group_id' => 'Selected purchase candidate group does not belong to the candidate owner.',
        ]);
    }
}
